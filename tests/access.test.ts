// Integration tests for the main access rules. They run against a SEPARATE test database
// (see .env.test.example), create their own data and delete it afterwards.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

if (!process.env.DATABASE_URL?.includes('test')) {
  throw new Error('Refusing to run: DATABASE_URL must point to a test database (its name must contain "test")');
}

const SECRET_ANSWER = 'Yellow-secret-answer';
const ADMIN = { email: 'admin@test.local', password: 'AdminPass123' };

let adminToken = '';
let aliceToken = '';
let bobToken = '';
let lookups = { categoryId: 0, colorId: 0, locationId: 0 };

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

// True if `key` appears anywhere in the object (including nested objects and arrays)
function containsKey(value: unknown, key: string): boolean {
  if (Array.isArray(value)) return value.some((v) => containsKey(v, key));
  if (value && typeof value === 'object') {
    return Object.entries(value).some(([k, v]) => k === key || containsKey(v, key));
  }
  return false;
}

// Makes sure a response never leaks the hidden answer in any form
function expectNoSecret(body: unknown) {
  expect(containsKey(body, 'verificationAnswer')).toBe(false);
  expect(containsKey(body, 'correctAnswer')).toBe(false);
  expect(JSON.stringify(body)).not.toContain(SECRET_ANSWER);
}

async function cleanDatabase() {
  await prisma.ownershipRequest.deleteMany();
  await prisma.lostReport.deleteMany();
  await prisma.foundItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.color.deleteMany();
  await prisma.location.deleteMany();
}

async function registerUser(fullName: string, email: string) {
  const res = await request(app).post('/api/auth/register').send({ fullName, email, password: 'Password123' });
  expect(res.status).toBe(201);
  return res.body.token as string;
}

async function createFoundItem(title = 'Black backpack') {
  const res = await request(app)
    .post('/api/found-items')
    .set(auth(adminToken))
    .send({
      title,
      description: 'Found near the library',
      ...lookups,
      foundDate: '2026-10-01',
      verificationQuestion: 'What color is the sticker?',
      verificationAnswer: SECRET_ANSWER,
    });
  expect(res.status).toBe(201);
  return res.body.id as number;
}

async function createLostReport(token: string) {
  const res = await request(app)
    .post('/api/lost-reports')
    .set(auth(token))
    .send({ title: 'Lost backpack', description: 'Black backpack', ...lookups, lostDate: '2026-09-30' });
  expect(res.status).toBe(201);
  return res.body.id as number;
}

beforeAll(async () => {
  await cleanDatabase();

  const [category, color, location] = await Promise.all([
    prisma.category.create({ data: { name: 'Bags' } }),
    prisma.color.create({ data: { name: 'Black' } }),
    prisma.location.create({ data: { name: 'Library' } }),
  ]);
  lookups = { categoryId: category.id, colorId: color.id, locationId: location.id };

  await prisma.user.create({
    data: {
      email: ADMIN.email,
      fullName: 'Test Admin',
      role: 'Admin',
      passwordHash: await bcrypt.hash(ADMIN.password, 4),
    },
  });
  const login = await request(app).post('/api/auth/login').send(ADMIN);
  adminToken = login.body.token;

  aliceToken = await registerUser('Alice', 'alice@test.local');
  bobToken = await registerUser('Bob', 'bob@test.local');
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

describe('authentication', () => {
  it('rejects requests without a token (401)', async () => {
    const res = await request(app).get('/api/found-items');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('registration ignores "role" and always creates a regular User', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Hacker', email: 'hacker@test.local', password: 'Password123', role: 'Admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('User');
    expect(containsKey(res.body, 'passwordHash')).toBe(false);
  });

  it('rejects unknown fields (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'X', email: 'x@test.local', password: 'Password123', isAdmin: true });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('login errors do not reveal whether the email exists', async () => {
    const wrongEmail = await request(app).post('/api/auth/login').send({ email: 'nobody@test.local', password: 'x' });
    const wrongPassword = await request(app).post('/api/auth/login').send({ email: ADMIN.email, password: 'wrong' });
    expect(wrongEmail.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(wrongEmail.body).toEqual(wrongPassword.body);
  });
});

describe('lost reports – a user cannot touch another user’s data', () => {
  let aliceReportId = 0;

  beforeAll(async () => {
    aliceReportId = await createLostReport(aliceToken);
  });

  it('another user gets 404 when reading the report', async () => {
    const res = await request(app).get(`/api/lost-reports/${aliceReportId}`).set(auth(bobToken));
    expect(res.status).toBe(404);
  });

  it('another user gets 404 when updating or deleting the report', async () => {
    const update = await request(app)
      .put(`/api/lost-reports/${aliceReportId}`)
      .set(auth(bobToken))
      .send({ title: 'Hacked', description: 'Hacked', ...lookups, lostDate: '2026-09-30' });
    const remove = await request(app).delete(`/api/lost-reports/${aliceReportId}`).set(auth(bobToken));
    expect(update.status).toBe(404);
    expect(remove.status).toBe(404);
  });

  it('another user gets 404 for the report’s matches', async () => {
    const res = await request(app).get(`/api/lost-reports/${aliceReportId}/matches`).set(auth(bobToken));
    expect(res.status).toBe(404);
  });

  it('the list shows a user only their own reports', async () => {
    const res = await request(app).get('/api/lost-reports').set(auth(bobToken));
    expect(res.status).toBe(200);
    expect(res.body.items.map((r: { id: number }) => r.id)).not.toContain(aliceReportId);
  });

  it('the owner can read and update their own report', async () => {
    const res = await request(app)
      .put(`/api/lost-reports/${aliceReportId}`)
      .set(auth(aliceToken))
      .send({ title: 'Updated title', description: 'Black backpack', ...lookups, lostDate: '2026-09-30' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated title');
  });

  it('status cannot be set through PUT (400)', async () => {
    const res = await request(app)
      .put(`/api/lost-reports/${aliceReportId}`)
      .set(auth(aliceToken))
      .send({ title: 'T', description: 'D', ...lookups, lostDate: '2026-09-30', status: 'Returned' });
    expect(res.status).toBe(400);
  });

  it('an admin can view and edit any report', async () => {
    const read = await request(app).get(`/api/lost-reports/${aliceReportId}`).set(auth(adminToken));
    expect(read.status).toBe(200);
    const update = await request(app)
      .put(`/api/lost-reports/${aliceReportId}`)
      .set(auth(adminToken))
      .send({ title: 'Edited by admin', description: 'Black backpack', ...lookups, lostDate: '2026-09-30' });
    expect(update.status).toBe(200);
  });

  it('an admin cannot create lost reports (403)', async () => {
    const res = await request(app)
      .post('/api/lost-reports')
      .set(auth(adminToken))
      .send({ title: 'T', description: 'D', ...lookups, lostDate: '2026-09-30' });
    expect(res.status).toBe(403);
  });

  it('an admin can delete any open report', async () => {
    const id = await createLostReport(bobToken);
    const res = await request(app).delete(`/api/lost-reports/${id}`).set(auth(adminToken));
    expect(res.status).toBe(204);
  });
});

describe('found items – only admins manage them', () => {
  it('a regular user cannot create, update or delete found items (403)', async () => {
    const itemId = await createFoundItem();
    const body = {
      title: 'T',
      description: 'D',
      ...lookups,
      foundDate: '2026-10-01',
      verificationQuestion: 'Q',
      verificationAnswer: 'A',
    };
    const create = await request(app).post('/api/found-items').set(auth(aliceToken)).send(body);
    const update = await request(app).put(`/api/found-items/${itemId}`).set(auth(aliceToken)).send(body);
    const remove = await request(app).delete(`/api/found-items/${itemId}`).set(auth(aliceToken));
    expect(create.status).toBe(403);
    expect(update.status).toBe(403);
    expect(remove.status).toBe(403);
  });

  it('an admin sees verificationAnswer', async () => {
    const itemId = await createFoundItem();
    const res = await request(app).get(`/api/found-items/${itemId}`).set(auth(adminToken));
    expect(res.body.verificationAnswer).toBe(SECRET_ANSWER);
  });
});

describe('verificationAnswer is never sent to a non-admin', () => {
  it('not in the found-items list or a single item', async () => {
    const itemId = await createFoundItem();
    const list = await request(app).get('/api/found-items').set(auth(aliceToken));
    const one = await request(app).get(`/api/found-items/${itemId}`).set(auth(aliceToken));
    expect(list.status).toBe(200);
    expect(list.body.items.length).toBeGreaterThan(0);
    expectNoSecret(list.body);
    expectNoSecret(one.body);
    expect(one.body.verificationQuestion).toBeTruthy();
  });

  it('not in matches or ownership requests', async () => {
    await createFoundItem();
    const reportId = await createLostReport(aliceToken);

    const matches = await request(app).get(`/api/lost-reports/${reportId}/matches`).set(auth(aliceToken));
    expect(matches.status).toBe(200);
    expect(matches.body.length).toBeGreaterThan(0);
    expectNoSecret(matches.body);

    const created = await request(app)
      .post('/api/ownership-requests')
      .set(auth(aliceToken))
      .send({ lostReportId: reportId, foundItemId: matches.body[0].foundItem.id, answer: 'Yellow' });
    expect(created.status).toBe(201);
    expectNoSecret(created.body);

    const list = await request(app).get('/api/ownership-requests').set(auth(aliceToken));
    const one = await request(app).get(`/api/ownership-requests/${created.body.id}`).set(auth(aliceToken));
    expectNoSecret(list.body);
    expectNoSecret(one.body);
  });
});

describe('ownership requests', () => {
  it('a user cannot request using another user’s lost report (404)', async () => {
    const itemId = await createFoundItem();
    const aliceReportId = await createLostReport(aliceToken);
    const res = await request(app)
      .post('/api/ownership-requests')
      .set(auth(bobToken))
      .send({ lostReportId: aliceReportId, foundItemId: itemId, answer: 'Yellow' });
    expect(res.status).toBe(404);
  });

  it('a duplicate pending request for the same item is rejected (409)', async () => {
    const itemId = await createFoundItem();
    const reportId = await createLostReport(aliceToken);
    const body = { lostReportId: reportId, foundItemId: itemId, answer: 'Yellow' };
    const first = await request(app).post('/api/ownership-requests').set(auth(aliceToken)).send(body);
    const second = await request(app).post('/api/ownership-requests').set(auth(aliceToken)).send(body);
    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
  });

  it('only an admin can approve or reject (403), and a user cannot read another user’s request (404)', async () => {
    const itemId = await createFoundItem();
    const reportId = await createLostReport(aliceToken);
    const created = await request(app)
      .post('/api/ownership-requests')
      .set(auth(aliceToken))
      .send({ lostReportId: reportId, foundItemId: itemId, answer: 'Yellow' });

    const approve = await request(app).patch(`/api/ownership-requests/${created.body.id}/approve`).set(auth(aliceToken));
    const reject = await request(app)
      .patch(`/api/ownership-requests/${created.body.id}/reject`)
      .set(auth(aliceToken))
      .send({ rejectionReason: 'Not yours at all' });
    const bobRead = await request(app).get(`/api/ownership-requests/${created.body.id}`).set(auth(bobToken));
    expect(approve.status).toBe(403);
    expect(reject.status).toBe(403);
    expect(bobRead.status).toBe(404);
  });

  it('rejecting requires a reason of at least 5 characters', async () => {
    const itemId = await createFoundItem();
    const reportId = await createLostReport(aliceToken);
    const created = await request(app)
      .post('/api/ownership-requests')
      .set(auth(aliceToken))
      .send({ lostReportId: reportId, foundItemId: itemId, answer: 'Blue' });

    const tooShort = await request(app)
      .patch(`/api/ownership-requests/${created.body.id}/reject`)
      .set(auth(adminToken))
      .send({ rejectionReason: 'no' });
    expect(tooShort.status).toBe(400);

    const ok = await request(app)
      .patch(`/api/ownership-requests/${created.body.id}/reject`)
      .set(auth(adminToken))
      .send({ rejectionReason: 'The answer is wrong' });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe('Rejected');

    // The user can see the rejection reason
    const mine = await request(app).get(`/api/ownership-requests/${created.body.id}`).set(auth(aliceToken));
    expect(mine.body.rejectionReason).toBe('The answer is wrong');
  });

  it('approval returns the item and report, and rejects other pending requests', async () => {
    const itemId = await createFoundItem('Approval test item');
    const aliceReport = await createLostReport(aliceToken);
    const bobReport = await createLostReport(bobToken);

    const aliceReq = await request(app)
      .post('/api/ownership-requests')
      .set(auth(aliceToken))
      .send({ lostReportId: aliceReport, foundItemId: itemId, answer: 'Yellow' });
    const bobReq = await request(app)
      .post('/api/ownership-requests')
      .set(auth(bobToken))
      .send({ lostReportId: bobReport, foundItemId: itemId, answer: 'Red' });

    // The admin sees question, user's answer and correct answer together
    const adminView = await request(app).get(`/api/ownership-requests/${aliceReq.body.id}`).set(auth(adminToken));
    expect(adminView.body.answer).toBe('Yellow');
    expect(adminView.body.correctAnswer).toBe(SECRET_ANSWER);
    expect(adminView.body.verificationQuestion).toBeTruthy();

    const approve = await request(app).patch(`/api/ownership-requests/${aliceReq.body.id}/approve`).set(auth(adminToken));
    expect(approve.status).toBe(200);
    expect(approve.body.status).toBe('Approved');
    expect(approve.body.reviewedAt).toBeTruthy();

    const item = await prisma.foundItem.findUniqueOrThrow({ where: { id: itemId } });
    const report = await prisma.lostReport.findUniqueOrThrow({ where: { id: aliceReport } });
    const other = await prisma.ownershipRequest.findUniqueOrThrow({ where: { id: bobReq.body.id } });
    expect(item.status).toBe('Returned');
    expect(report.status).toBe('Returned');
    expect(other.status).toBe('Rejected');
    expect(other.rejectionReason).toBe('This item was returned to another person.');

    // Regular users no longer see the returned item in the list
    const list = await request(app).get('/api/found-items?pageSize=100').set(auth(bobToken));
    expect(list.body.items.map((i: { id: number }) => i.id)).not.toContain(itemId);

    // A returned report gets no matches, cannot be edited, and a returned item cannot be deleted
    const matches = await request(app).get(`/api/lost-reports/${aliceReport}/matches`).set(auth(aliceToken));
    expect(matches.body).toEqual([]);
    const edit = await request(app)
      .put(`/api/lost-reports/${aliceReport}`)
      .set(auth(aliceToken))
      .send({ title: 'T', description: 'D', ...lookups, lostDate: '2026-09-30' });
    expect(edit.status).toBe(409);
    const remove = await request(app).delete(`/api/found-items/${itemId}`).set(auth(adminToken));
    expect(remove.status).toBe(409);
  });
});

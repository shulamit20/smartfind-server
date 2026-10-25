// Seed script – safe to run many times (uses upsert / "create only if missing").
// Creates: the admin account, starting lookup values, and (in development) sample data.
// The values fit an educational institution (school / college campus).
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  'תיקים',
  'קלמרים',
  'ארנקים',
  'טלפונים',
  'מחשבים ניידים',
  'טאבלטים',
  'אוזניות',
  'מטענים וכבלים',
  'מחשבונים',
  'אלקטרוניקה',
  'ספרים ומחברות',
  'ציוד כתיבה',
  'מפתחות',
  'כרטיסים ותעודות',
  'מסמכים',
  'ביגוד',
  'מעילים וסווטשירטים',
  'נעליים',
  'ציוד ספורט',
  'בקבוקי מים',
  'קופסאות אוכל',
  'משקפיים',
  'תכשיטים',
  'שעונים',
  'מטריות',
  'כלי נגינה',
  'אחר',
];

const COLORS = [
  'שחור',
  'לבן',
  'אפור',
  'אדום',
  'כחול',
  'תכלת',
  'ירוק',
  'צהוב',
  'כתום',
  'סגול',
  'ורוד',
  'חום',
  "בז'",
  'כסוף',
  'זהב',
  'שקוף',
  'צבעוני',
  'אחר',
];

const LOCATIONS = [
  'כניסה ראשית',
  'לובי',
  'מזכירות',
  'ספרייה',
  'קפטריה',
  'חדר אוכל',
  'בניין א',
  'בניין ב',
  'בניין ג',
  'מעבדת מחשבים',
  'מעבדת מדעים',
  'חדר אמנות',
  'חדר מוזיקה',
  'אודיטוריום',
  'חדר מורים',
  'חדר כושר',
  'אולם ספורט',
  'מגרש ספורט',
  'חצר',
  'שירותים',
  'מעונות',
  'חניון',
  'תחנת אוטובוס',
];

// Development-only demo user (not a secret – only created when SEED_SAMPLE_DATA is not "false")
const DEMO_USER = { email: 'demo@smartfind.local', password: 'Demo12345', fullName: 'משתמש לדוגמה' };

// Sample found items. Lookup values are given by name; each item is added only if its title is not taken yet.
const SAMPLE_FOUND_ITEMS = [
  {
    title: 'תיק גב שחור',
    description: 'תיק גב שחור שנמצא ליד הכניסה לספרייה',
    category: 'תיקים',
    color: 'שחור',
    location: 'ספרייה',
    daysAgo: 2,
    verificationQuestion: 'באיזה צבע המדבקה על התיק?',
    verificationAnswer: 'צהוב',
  },
  {
    title: 'ארנק עור חום',
    description: 'ארנק חום קטן שנמצא על שולחן בקפטריה',
    category: 'ארנקים',
    color: 'חום',
    location: 'קפטריה',
    daysAgo: 5,
    verificationQuestion: 'של איזה בנק הכרטיס שבפנים?',
    verificationAnswer: 'לאומי',
  },
  {
    title: 'טלפון כסוף',
    description: 'סמארטפון עם מגן מסך סדוק',
    category: 'טלפונים',
    color: 'כסוף',
    location: 'חדר כושר',
    daysAgo: 10,
    verificationQuestion: 'מה התמונה במסך הנעילה?',
    verificationAnswer: 'כלב',
  },
  {
    title: 'מפתחות רכב',
    description: 'מפתחות רכב עם מחזיק מפתחות כחול',
    category: 'מפתחות',
    color: 'כחול',
    location: 'חניון',
    daysAgo: 1,
    verificationQuestion: 'מה כתוב על מחזיק המפתחות?',
    verificationAnswer: 'אילת',
  },
  {
    title: 'מחשב נייד אפור',
    description: 'מחשב נייד שנשכח על שולחן בסוף שיעור',
    category: 'מחשבים ניידים',
    color: 'אפור',
    location: 'מעבדת מחשבים',
    daysAgo: 3,
    verificationQuestion: 'איזו מדבקה יש על המכסה?',
    verificationAnswer: 'חתול',
  },
  {
    title: 'אוזניות אלחוטיות לבנות',
    description: 'אוזניות בתוך קופסת טעינה לבנה',
    category: 'אוזניות',
    color: 'לבן',
    location: 'אולם ספורט',
    daysAgo: 4,
    verificationQuestion: 'מה חרוט על קופסת הטעינה?',
    verificationAnswer: 'נועה',
  },
  {
    title: 'קלמר סגול',
    description: 'קלמר בד עם עטים וטושים',
    category: 'קלמרים',
    color: 'סגול',
    location: 'בניין א',
    daysAgo: 6,
    verificationQuestion: 'איזה שם כתוב בתוך הקלמר?',
    verificationAnswer: 'דניאל',
  },
  {
    title: 'מחשבון מדעי',
    description: 'מחשבון מדעי שחור, נמצא אחרי בחינה',
    category: 'מחשבונים',
    color: 'שחור',
    location: 'אודיטוריום',
    daysAgo: 7,
    verificationQuestion: 'מה כתוב על הגב של המחשבון?',
    verificationAnswer: 'כיתה י2',
  },
  {
    title: 'סווטשירט כחול עם קפוצ׳ון',
    description: 'סווטשירט כחול מידה M שנשאר על ספסל',
    category: 'מעילים וסווטשירטים',
    color: 'כחול',
    location: 'חצר',
    daysAgo: 8,
    verificationQuestion: 'מה מודפס על הגב?',
    verificationAnswer: 'מחזור 2026',
  },
  {
    title: 'בקבוק מים ירוק',
    description: 'בקבוק מים מתכת עם מדבקות',
    category: 'בקבוקי מים',
    color: 'ירוק',
    location: 'מגרש ספורט',
    daysAgo: 2,
    verificationQuestion: 'איזו מדבקה יש על הבקבוק?',
    verificationAnswer: 'דינוזאור',
  },
  {
    title: 'כרטיס סטודנט',
    description: 'כרטיס סטודנט שנמצא ליד המזכירות',
    category: 'כרטיסים ותעודות',
    color: 'כחול',
    location: 'מזכירות',
    daysAgo: 1,
    verificationQuestion: 'מה ארבע הספרות האחרונות במספר הכרטיס?',
    verificationAnswer: '4821',
  },
  {
    title: 'משקפי ראייה בנרתיק',
    description: 'משקפיים במסגרת שחורה בתוך נרתיק אדום',
    category: 'משקפיים',
    color: 'שחור',
    location: 'ספרייה',
    daysAgo: 9,
    verificationQuestion: 'באיזה צבע הנרתיק?',
    verificationAnswer: 'אדום',
  },
  {
    title: 'מחברת מתמטיקה',
    description: 'מחברת משובצת עם כריכה כתומה',
    category: 'ספרים ומחברות',
    color: 'כתום',
    location: 'בניין ב',
    daysAgo: 3,
    verificationQuestion: 'איזה שם כתוב בעמוד הראשון?',
    verificationAnswer: 'יעל',
  },
  {
    title: 'מטען לטלפון',
    description: 'מטען עם כבל לבן שנשאר בשקע',
    category: 'מטענים וכבלים',
    color: 'לבן',
    location: 'ספרייה',
    daysAgo: 2,
    verificationQuestion: 'איזה סוג חיבור יש בכבל?',
    verificationAnswer: 'USB-C',
  },
  {
    title: 'מטרייה שחורה מתקפלת',
    description: 'מטרייה מתקפלת עם ידית עץ',
    category: 'מטריות',
    color: 'שחור',
    location: 'כניסה ראשית',
    daysAgo: 12,
    verificationQuestion: 'מה צבע הידית?',
    verificationAnswer: 'חום',
  },
  {
    title: 'שעון יד כסוף',
    description: 'שעון יד עם רצועת מתכת',
    category: 'שעונים',
    color: 'כסוף',
    location: 'חדר כושר',
    daysAgo: 5,
    verificationQuestion: 'מה חרוט על גב השעון?',
    verificationAnswer: 'באהבה מסבתא',
  },
];

// Sample lost reports of the demo user. Each is added only if the demo user has no report with that title.
const SAMPLE_LOST_REPORTS = [
  {
    title: 'איבדתי תיק גב שחור',
    description: 'תיק גב שחור עם מחשב נייד בפנים, יש עליו מדבקה צהובה',
    category: 'תיקים',
    color: 'שחור',
    location: 'ספרייה',
    daysAgo: 3,
  },
  {
    title: 'איבדתי אוזניות',
    description: 'אוזניות אלחוטיות לבנות, השם שלי חרוט על הקופסה',
    category: 'אוזניות',
    color: 'לבן',
    location: 'חדר כושר',
    daysAgo: 4,
  },
  {
    title: 'איבדתי מחשבון',
    description: 'מחשבון מדעי שחור עם שם הכיתה על הגב',
    category: 'מחשבונים',
    color: 'שחור',
    location: 'אודיטוריום',
    daysAgo: 7,
  },
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to run the seed');
  }
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { role: Role.Admin, passwordHash },
    create: { email, passwordHash, fullName: 'מנהל המערכת', role: Role.Admin },
  });
  console.log(`Admin ready: ${email}`);
}

async function seedLookups() {
  for (const name of CATEGORIES) await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  for (const name of COLORS) await prisma.color.upsert({ where: { name }, update: {}, create: { name } });
  for (const name of LOCATIONS) await prisma.location.upsert({ where: { name }, update: {}, create: { name } });
  console.log('Lookup values ready');
}

async function seedSampleData() {
  const id = async (table: 'category' | 'color' | 'location', name: string) => {
    const row = await (prisma[table] as any).findUniqueOrThrow({ where: { name } });
    return row.id as number;
  };
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  let itemsAdded = 0;
  for (const item of SAMPLE_FOUND_ITEMS) {
    if (await prisma.foundItem.findFirst({ where: { title: item.title } })) continue;
    await prisma.foundItem.create({
      data: {
        title: item.title,
        description: item.description,
        categoryId: await id('category', item.category),
        colorId: await id('color', item.color),
        locationId: await id('location', item.location),
        foundDate: daysAgo(item.daysAgo),
        verificationQuestion: item.verificationQuestion,
        verificationAnswer: item.verificationAnswer,
      },
    });
    itemsAdded++;
  }

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {},
    create: {
      email: DEMO_USER.email,
      fullName: DEMO_USER.fullName,
      passwordHash: await bcrypt.hash(DEMO_USER.password, 10),
      role: Role.User,
    },
  });

  let reportsAdded = 0;
  for (const report of SAMPLE_LOST_REPORTS) {
    if (await prisma.lostReport.findFirst({ where: { userId: demoUser.id, title: report.title } })) continue;
    await prisma.lostReport.create({
      data: {
        userId: demoUser.id,
        title: report.title,
        description: report.description,
        categoryId: await id('category', report.category),
        colorId: await id('color', report.color),
        locationId: await id('location', report.location),
        lostDate: daysAgo(report.daysAgo),
      },
    });
    reportsAdded++;
  }

  console.log(
    `Sample data ready: ${itemsAdded} found items and ${reportsAdded} lost reports added ` +
      `(demo user: ${DEMO_USER.email} / ${DEMO_USER.password})`,
  );
}

async function main() {
  await seedAdmin();
  await seedLookups();
  if (process.env.SEED_SAMPLE_DATA !== 'false') {
    await seedSampleData();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

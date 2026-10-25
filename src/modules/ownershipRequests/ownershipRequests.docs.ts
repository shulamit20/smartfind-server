import { errors, jsonBody, jsonResponse, registry, secured } from '../../docs/registry';
import { idParams } from '../../lib/validation';
import {
  adminOwnershipRequestSchema,
  createOwnershipRequestBody,
  ownershipRequestListQuery,
  ownershipRequestPageSchema,
  ownershipRequestSchema,
  rejectBody,
} from './ownershipRequests.schemas';

const tags = ['Ownership requests'];
const roleNote = 'Users get OwnershipRequest; admins get OwnershipRequestAdmin (adds correctAnswer and user).';

registry.registerPath({
  method: 'post',
  path: '/ownership-requests',
  tags,
  summary: '"This is mine" – request a found item (User only)',
  description:
    'The lost report must be yours and Open, the item must be Available, and you cannot have another Pending request for the same item.',
  security: secured,
  request: { body: jsonBody(createOwnershipRequestBody) },
  responses: {
    201: jsonResponse('Created (status Pending)', ownershipRequestSchema),
    ...errors(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: 'get',
  path: '/ownership-requests',
  tags,
  summary: 'List ownership requests',
  description: `A user gets their own requests; an admin gets all. Optional status filter. ${roleNote}`,
  security: secured,
  request: { query: ownershipRequestListQuery },
  responses: {
    200: jsonResponse('A page of requests', ownershipRequestPageSchema),
    ...errors(400, 401),
  },
});

registry.registerPath({
  method: 'get',
  path: '/ownership-requests/{id}',
  tags,
  summary: 'One ownership request (owner or admin)',
  description: roleNote,
  security: secured,
  request: { params: idParams },
  responses: {
    200: jsonResponse('The request', adminOwnershipRequestSchema),
    ...errors(400, 401, 404),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/ownership-requests/{id}/approve',
  tags,
  summary: 'Approve a pending request (Admin)',
  description:
    'In one transaction: request → Approved, found item → Returned, lost report → Returned, other pending requests for the item → Rejected.',
  security: secured,
  request: { params: idParams },
  responses: {
    200: jsonResponse('Approved', adminOwnershipRequestSchema),
    ...errors(400, 401, 403, 404, 409),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/ownership-requests/{id}/reject',
  tags,
  summary: 'Reject a pending request with a reason (Admin)',
  security: secured,
  request: { params: idParams, body: jsonBody(rejectBody) },
  responses: {
    200: jsonResponse('Rejected', adminOwnershipRequestSchema),
    ...errors(400, 401, 403, 404, 409),
  },
});

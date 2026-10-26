import { errors, jsonBody, jsonResponse, registry, secured } from '../../docs/registry';
import { idParams } from '../../lib/validation';
import { adminFoundItemSchema, foundItemBody, foundItemListQuery, foundItemPageSchema } from './foundItems.schemas';

const tags = ['Found items'];

registry.registerPath({
  method: 'get',
  path: '/found-items',
  tags,
  summary: 'List found items – search, filter, sort, paginate',
  description:
    'Regular users see only Available items, without verificationAnswer. Admins see all statuses (optional `status` filter) and the answer.',
  security: secured,
  request: { query: foundItemListQuery },
  responses: {
    200: jsonResponse('A page of found items', foundItemPageSchema),
    ...errors(400, 401),
  },
});

registry.registerPath({
  method: 'get',
  path: '/found-items/{id}',
  tags,
  summary: 'One found item',
  description: 'Regular users get the public shape (FoundItem); admins get FoundItemAdmin.',
  security: secured,
  request: { params: idParams },
  responses: {
    200: jsonResponse('The item', adminFoundItemSchema),
    ...errors(400, 401, 404),
  },
});

registry.registerPath({
  method: 'post',
  path: '/found-items',
  tags,
  summary: 'Register a found item (Admin)',
  security: secured,
  request: { body: jsonBody(foundItemBody) },
  responses: {
    201: jsonResponse('Created', adminFoundItemSchema),
    ...errors(400, 401, 403),
  },
});

registry.registerPath({
  method: 'put',
  path: '/found-items/{id}',
  tags,
  summary: 'Update a found item (Admin)',
  description: 'Send all fields. Status cannot be changed here.',
  security: secured,
  request: { params: idParams, body: jsonBody(foundItemBody) },
  responses: {
    200: jsonResponse('Updated', adminFoundItemSchema),
    ...errors(400, 401, 403, 404),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/found-items/{id}',
  tags,
  summary: 'Delete a found item (Admin)',
  description:
    'Returned items and items with pending ownership requests cannot be deleted (409). Also deletes the item’s rejected ownership requests.',
  security: secured,
  request: { params: idParams },
  responses: {
    204: { description: 'Deleted' },
    ...errors(400, 401, 403, 404, 409),
  },
});

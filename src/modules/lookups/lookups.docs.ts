import { errors, jsonBody, jsonResponse, registry, secured } from '../../docs/registry';
import { allLookupsSchema, createLookupBody, lookupItemParams, lookupSchema, lookupTypeParams } from './lookups.schemas';

registry.registerPath({
  method: 'get',
  path: '/lookups',
  tags: ['Lookups'],
  summary: 'All categories, colors and locations (for dropdowns)',
  security: secured,
  responses: {
    200: jsonResponse('All lookup values', allLookupsSchema),
    ...errors(401),
  },
});

registry.registerPath({
  method: 'post',
  path: '/lookups/{type}',
  tags: ['Lookups'],
  summary: 'Add a value (Admin)',
  security: secured,
  request: { params: lookupTypeParams, body: jsonBody(createLookupBody) },
  responses: {
    201: jsonResponse('Created', lookupSchema),
    ...errors(400, 401, 403, 409),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/lookups/{type}/{id}',
  tags: ['Lookups'],
  summary: 'Delete a value that is not in use (Admin)',
  security: secured,
  request: { params: lookupItemParams },
  responses: {
    204: { description: 'Deleted' },
    ...errors(400, 401, 403, 404, 409),
  },
});

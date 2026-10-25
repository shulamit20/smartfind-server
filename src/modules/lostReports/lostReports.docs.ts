import { z } from 'zod';
import { errors, jsonBody, jsonResponse, registry, secured } from '../../docs/registry';
import { idParams } from '../../lib/validation';
import { lostReportBody, lostReportListQuery, lostReportPageSchema, lostReportSchema, matchSchema } from './lostReports.schemas';

const tags = ['Lost reports'];

registry.registerPath({
  method: 'get',
  path: '/lost-reports',
  tags,
  summary: 'List lost reports',
  description: 'A user gets their own reports; an admin gets all reports.',
  security: secured,
  request: { query: lostReportListQuery },
  responses: {
    200: jsonResponse('A page of lost reports', lostReportPageSchema),
    ...errors(400, 401),
  },
});

registry.registerPath({
  method: 'get',
  path: '/lost-reports/{id}',
  tags,
  summary: 'One lost report (owner or admin)',
  security: secured,
  request: { params: idParams },
  responses: {
    200: jsonResponse('The report', lostReportSchema),
    ...errors(400, 401, 404),
  },
});

registry.registerPath({
  method: 'post',
  path: '/lost-reports',
  tags,
  summary: 'Create a lost report (User only)',
  security: secured,
  request: { body: jsonBody(lostReportBody) },
  responses: {
    201: jsonResponse('Created', lostReportSchema),
    ...errors(400, 401, 403),
  },
});

registry.registerPath({
  method: 'put',
  path: '/lost-reports/{id}',
  tags,
  summary: 'Update a lost report (owner or admin, only while Open)',
  description: 'Send all fields. Status cannot be changed here.',
  security: secured,
  request: { params: idParams, body: jsonBody(lostReportBody) },
  responses: {
    200: jsonResponse('Updated', lostReportSchema),
    ...errors(400, 401, 404, 409),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/lost-reports/{id}',
  tags,
  summary: 'Delete a lost report (owner or admin, only while Open)',
  description: 'Also deletes the report’s ownership requests.',
  security: secured,
  request: { params: idParams },
  responses: {
    204: { description: 'Deleted' },
    ...errors(400, 401, 404, 409),
  },
});

registry.registerPath({
  method: 'get',
  path: '/lost-reports/{id}/matches',
  tags,
  summary: 'Possible matches for a report (owner or admin)',
  description:
    'Compares the report with every Available found item. Returns only matches at or above the threshold, best first. A Returned report gets an empty list. A match is only a suggestion.',
  security: secured,
  request: { params: idParams },
  responses: {
    200: jsonResponse('Matches', z.array(matchSchema)),
    ...errors(400, 401, 404),
  },
});

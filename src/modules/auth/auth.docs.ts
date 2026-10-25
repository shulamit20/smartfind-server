import { errors, jsonBody, jsonResponse, registry, secured } from '../../docs/registry';
import { authResponseSchema, loginBody, registerBody, userSchema } from './auth.schemas';

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  summary: 'Register a new user (always role "User")',
  request: { body: jsonBody(registerBody) },
  responses: {
    201: jsonResponse('Created – returns token and user', authResponseSchema),
    ...errors(400, 409, 429),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Log in and get a token',
  request: { body: jsonBody(loginBody) },
  responses: {
    200: jsonResponse('Token and user', authResponseSchema),
    ...errors(400, 401, 429),
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'The currently logged-in user',
  security: secured,
  responses: {
    200: jsonResponse('Current user', userSchema),
    ...errors(401),
  },
});

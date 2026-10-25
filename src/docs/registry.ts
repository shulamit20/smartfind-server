import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Every module registers its endpoints here (see modules/*/*.docs.ts).
// docs/openapi.ts turns the registry into the OpenAPI document shown at /api/docs.
export const registry = new OpenAPIRegistry();

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Paste the token you got from /auth/login or /auth/register',
});

// Add `security: secured` to an endpoint that needs a logged-in user
export const secured = [{ [bearerAuth.name]: [] }];

const errorSchema = z
  .object({
    error: z.object({
      code: z.string().meta({ example: 'VALIDATION_ERROR' }),
      message: z.string().meta({ example: 'Invalid request' }),
      details: z.array(z.any()),
    }),
  })
  .meta({ id: 'Error' });

const errorDescriptions: Record<number, string> = {
  400: 'Validation error',
  401: 'Not logged in / invalid token',
  403: 'Wrong role',
  404: 'Not found (or not yours)',
  409: 'Conflict',
  429: 'Too many attempts',
};

// A JSON response with a schema
export const jsonResponse = (description: string, schema: z.ZodType) => ({
  description,
  content: { 'application/json': { schema } },
});

// A JSON request body
export const jsonBody = (schema: z.ZodType) => ({
  content: { 'application/json': { schema } },
});

// The standard error responses for an endpoint, e.g. errors(400, 401, 404)
export function errors(...statuses: number[]) {
  return Object.fromEntries(statuses.map((status) => [status, jsonResponse(errorDescriptions[status], errorSchema)]));
}

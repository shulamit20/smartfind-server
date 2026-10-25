import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

// Each import registers that module's endpoints in the registry
import '../modules/auth/auth.docs';
import '../modules/lookups/lookups.docs';
import '../modules/foundItems/foundItems.docs';
import '../modules/lostReports/lostReports.docs';
import '../modules/ownershipRequests/ownershipRequests.docs';

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'SmartFind API',
      version: '1.0.0',
      description:
        'Lost-and-found management API.\n\n' +
        '1. Call **POST /auth/login** (or register) and copy the `token`.\n' +
        '2. Click **Authorize** and paste the token.\n' +
        '3. Try any endpoint.\n\n' +
        'Errors always look like `{ "error": { "code", "message", "details" } }`.',
    },
    servers: [{ url: '/api' }],
  });
}

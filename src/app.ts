import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { authenticate } from './middleware/authenticate';
import { errorHandler, notFoundRoute } from './middleware/errorHandler';
import { buildOpenApiDocument } from './docs/openapi';
import authRoutes from './modules/auth/auth.routes';
import lookupsRoutes from './modules/lookups/lookups.routes';
import foundItemsRoutes from './modules/foundItems/foundItems.routes';
import lostReportsRoutes from './modules/lostReports/lostReports.routes';
import ownershipRequestsRoutes from './modules/ownershipRequests/ownershipRequests.routes';

export const app = express();

app.set('trust proxy', 1); // Render runs behind a proxy – needed for correct client IPs (rate limit)
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGINS })); // only the React client may call the API
app.use(express.json({ limit: '100kb' }));

// Health check (used by Render)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API documentation: Swagger UI at /api/docs, raw OpenAPI JSON at /api/docs.json
const openApiDocument = buildOpenApiDocument();
app.get('/api/docs.json', (_req, res) => {
  res.json(openApiDocument);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { swaggerOptions: { persistAuthorization: true } }));

// Public: register and login. /auth/me checks the token itself.
app.use('/api/auth', authRoutes);

// Everything below requires a valid JWT
app.use('/api/lookups', authenticate, lookupsRoutes);
app.use('/api/found-items', authenticate, foundItemsRoutes);
app.use('/api/lost-reports', authenticate, lostReportsRoutes);
app.use('/api/ownership-requests', authenticate, ownershipRequestsRoutes);

app.use(notFoundRoute);
app.use(errorHandler);

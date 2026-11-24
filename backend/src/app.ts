import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error-handler.js';
import { requestLogger } from './middlewares/request-logger.js';
import { apiRouter } from './routes/index.js';

export const app = express();

if (env.NODE_ENV === 'production') {
  // Produksi: klien -> edge Cloudflare -> proxy Render -> app. Dua hop dipercaya
  // agar req.ip (rate limit, log, audit) berisi IP klien, bukan IP Cloudflare/Render.
  // Bila DNS `api` diubah menjadi DNS-only, turunkan ke 1.
  app.set('trust proxy', 2);
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestLogger);
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

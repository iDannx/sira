import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import estudiantesRoutes from './routes/estudiantes.routes';
import carteraRoutes from './routes/cartera.routes';
import acuerdosRoutes from './routes/acuerdos.routes';
import automatizacionesRoutes from './routes/automatizaciones.routes';
import prediccionRoutes from './routes/prediccion.routes';
import openfinanceRoutes from './routes/openfinance.routes';
import estrategiasRoutes from './routes/estrategias.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/estudiantes', authenticate, estudiantesRoutes);
app.use('/api/cartera', authenticate, carteraRoutes);
app.use('/api/acuerdos', authenticate, acuerdosRoutes);
app.use('/api/automatizaciones', authenticate, automatizacionesRoutes);
app.use('/api/prediccion', authenticate, prediccionRoutes);
app.use('/api/openfinance', authenticate, openfinanceRoutes);
app.use('/api/estrategias', authenticate, estrategiasRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' },
  });
});

app.use(errorHandler);

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`[sira-backend] listening on port ${port}`);
});

export default app;

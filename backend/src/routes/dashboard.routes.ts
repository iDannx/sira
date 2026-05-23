import { Router } from 'express';
import {
  getStats,
  getDistribucionCartera,
  getEvolucionRecuperacion,
  getRiesgoDesercion,
} from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', getStats);
router.get('/distribucion-cartera', getDistribucionCartera);
router.get('/evolucion-recuperacion', getEvolucionRecuperacion);
router.get('/riesgo-desercion', getRiesgoDesercion);

export default router;

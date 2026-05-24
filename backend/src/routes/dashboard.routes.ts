import { Router } from 'express';
import {
  getStats,
  getDistribucionCartera,
  getEvolucionRecuperacion,
  getRiesgoDesercion,
  getCreditosMoraPorTipo,
  getEstadoJuridico,
} from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', getStats);
router.get('/distribucion-cartera', getDistribucionCartera);
router.get('/evolucion-recuperacion', getEvolucionRecuperacion);
router.get('/riesgo-desercion', getRiesgoDesercion);
router.get('/creditos-mora-por-tipo', getCreditosMoraPorTipo);
router.get('/estado-juridico', getEstadoJuridico);

export default router;

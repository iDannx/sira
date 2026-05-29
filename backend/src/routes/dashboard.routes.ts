import { Router } from 'express';
import {
  getStats,
  getDistribucionCartera,
  getEvolucionRecuperacion,
  getRiesgoDesercion,
  getCreditosMoraPorTipo,
  getEstadoJuridico,
  getGestionActivaEscenario,
  getAlertasAcademicas,
} from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', getStats);
router.get('/distribucion-cartera', getDistribucionCartera);
router.get('/evolucion-recuperacion', getEvolucionRecuperacion);
router.get('/riesgo-desercion', getRiesgoDesercion);
router.get('/creditos-mora-por-tipo', getCreditosMoraPorTipo);
router.get('/estado-juridico', getEstadoJuridico);
router.get('/gestion-activa-escenario', getGestionActivaEscenario);
router.get('/alertas-academicas', getAlertasAcademicas);

export default router;

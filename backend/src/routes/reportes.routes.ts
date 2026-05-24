import { Router } from 'express';
import {
  getCortes,
  getPagos,
  getGestionesReporte,
  getEstrategiasActivas,
  getJuridico,
  exportarReporte,
} from '../controllers/reportes.controller';

const router = Router();

router.get('/cortes', getCortes);
router.get('/pagos', getPagos);
router.get('/gestiones', getGestionesReporte);
router.get('/estrategias-activas', getEstrategiasActivas);
router.get('/juridico', getJuridico);
router.get('/exportar', exportarReporte);

export default router;

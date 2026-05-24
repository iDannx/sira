import { Router } from 'express';
import {
  listCartera,
  getHistorialCliente,
  getResumen,
  listClientes,
  getCliente,
  createNota,
  generarEstrategiaCliente,
  exportarClientes,
} from '../controllers/cartera.controller';

const router = Router();

// El listado original de snapshots y el detalle por cliente quedan intactos.
router.get('/', listCartera);

// Endpoints nuevos. Deben ir ANTES de `/:estudianteId` porque ese parámetro
// captura cualquier path de un solo segmento (atraparía /resumen, /clientes,
// /exportar). Las rutas con dos segmentos (/clientes/:id, /clientes/:id/notas,
// /clientes/:id/estrategia) no chocan, pero las dejo agrupadas por claridad.
router.get('/resumen', getResumen);
router.get('/exportar', exportarClientes);
router.get('/clientes', listClientes);
router.get('/clientes/:id', getCliente);
router.post('/clientes/:id/notas', createNota);
router.post('/clientes/:id/estrategia', generarEstrategiaCliente);

router.get('/:estudianteId', getHistorialCliente);

export default router;

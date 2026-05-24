import { Router } from 'express';
import {
  getResumen,
  listAcuerdos,
  getAcuerdo,
  createAcuerdo,
  updateAcuerdo,
  registrarPago,
  marcarIncumplido,
  createNotaAcuerdo,
} from '../controllers/acuerdos.controller';

const router = Router();

// /resumen tiene que registrarse ANTES de /:id porque /:id captura cualquier
// path de un solo segmento (atraparía /resumen si fuera primero).
router.get('/resumen', getResumen);

router.get('/', listAcuerdos);
router.post('/', createAcuerdo);

router.get('/:id', getAcuerdo);
router.put('/:id', updateAcuerdo);
router.post('/:id/pagos', registrarPago);
router.post('/:id/incumplir', marcarIncumplido);
router.post('/:id/notas', createNotaAcuerdo);

export default router;

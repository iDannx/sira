import { Router } from 'express';
import {
  getPerfilamiento,
  getRecuperacion,
  generar,
  aplicar,
} from '../controllers/estrategias.controller';

const router = Router();

router.get('/perfilamiento', getPerfilamiento);
router.get('/recuperacion', getRecuperacion);
router.post('/generar', generar);
router.post('/:id/aplicar', aplicar);

export default router;

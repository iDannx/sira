import { Router } from 'express';
import {
  listAutomatizaciones,
  getAutomatizacion,
  ejecutarAutomatizacion,
  toggleAutomatizacion,
} from '../controllers/automatizaciones.controller';

const router = Router();

router.get('/', listAutomatizaciones);
router.get('/:id', getAutomatizacion);
router.post('/:id/ejecutar', ejecutarAutomatizacion);
router.put('/:id/toggle', toggleAutomatizacion);

export default router;

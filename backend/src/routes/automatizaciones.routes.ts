import { Router } from 'express';
import {
  listAutomatizaciones,
  getAutomatizacion,
  ejecutarAutomatizacion,
  toggleAutomatizacion,
  updateAutomatizacion,
  deleteAutomatizacion,
  publicarAutomatizacion,
  cerrarAutomatizacion,
  createAccion,
  updateAccion,
  deleteAccion,
} from '../controllers/automatizaciones.controller';

const router = Router();

router.get('/', listAutomatizaciones);
router.get('/:id', getAutomatizacion);
router.put('/:id', updateAutomatizacion);
router.delete('/:id', deleteAutomatizacion);

router.post('/:id/ejecutar', ejecutarAutomatizacion);
router.put('/:id/toggle', toggleAutomatizacion);
router.post('/:id/publicar', publicarAutomatizacion);
router.post('/:id/cerrar', cerrarAutomatizacion);

router.post('/:id/acciones', createAccion);
router.put('/:id/acciones/:accionId', updateAccion);
router.delete('/:id/acciones/:accionId', deleteAccion);

export default router;

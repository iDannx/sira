import { Router } from 'express';
import {
  getResumen,
  listGestiones,
  listPromesas,
  listJuridica,
  getGestion,
  createGestion,
} from '../controllers/gestiones.controller';

const router = Router();

// Rutas específicas antes de /:id para que no las absorba el param route.
router.get('/resumen', getResumen);
router.get('/promesas', listPromesas);
router.get('/juridica', listJuridica);

router.get('/', listGestiones);
router.post('/', createGestion);

router.get('/:id', getGestion);

export default router;

import { Router } from 'express';
import { getResumen, generarCampana } from '../controllers/campanas.controller';

const router = Router();

router.get('/resumen', getResumen);
router.post('/generar', generarCampana);

export default router;

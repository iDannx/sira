import { Router } from 'express';
import { getEstudiantesRiesgo, getProgramas } from '../controllers/prediccion.controller';

const router = Router();

router.get('/estudiantes-riesgo', getEstudiantesRiesgo);
router.get('/programas', getProgramas);

export default router;

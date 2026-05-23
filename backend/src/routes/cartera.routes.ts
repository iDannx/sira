import { Router } from 'express';
import { listCartera, getHistorialCliente } from '../controllers/cartera.controller';

const router = Router();

router.get('/', listCartera);
router.get('/:estudianteId', getHistorialCliente);

export default router;

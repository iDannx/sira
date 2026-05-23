import { Router } from 'express';
import {
  listEstudiantes,
  getEstudiante,
  updateEstudiante,
} from '../controllers/estudiantes.controller';

const router = Router();

router.get('/', listEstudiantes);
router.get('/:id', getEstudiante);
router.put('/:id', updateEstudiante);

export default router;

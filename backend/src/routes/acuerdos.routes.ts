import { Router } from 'express';
import {
  listAcuerdos,
  getAcuerdo,
  createAcuerdo,
  updateAcuerdo,
  deleteAcuerdo,
} from '../controllers/acuerdos.controller';

const router = Router();

router.get('/', listAcuerdos);
router.post('/', createAcuerdo);
router.get('/:id', getAcuerdo);
router.put('/:id', updateAcuerdo);
router.delete('/:id', deleteAcuerdo);

export default router;

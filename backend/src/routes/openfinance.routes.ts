import { Router } from 'express';
import {
  listInstituciones,
  listConsentimientos,
  createConsentimiento,
  revokeConsentimiento,
  getPerfil,
  getCuentas,
  listPropuestas,
  createPropuesta,
  aceptarPropuesta,
  getInversiones,
  getSeguros,
  getPagosIniciados,
} from '../controllers/openfinance.controller';

const router = Router();

router.get('/instituciones', listInstituciones);

router.get('/consentimientos', listConsentimientos);
router.post('/consentimientos', createConsentimiento);
router.put('/consentimientos/:id/revocar', revokeConsentimiento);

router.get('/perfil/:id_cliente', getPerfil);
router.get('/cuentas/:id_cliente', getCuentas);

router.get('/propuestas', listPropuestas);
router.post('/propuestas', createPropuesta);
router.put('/propuestas/:id/aceptar', aceptarPropuesta);

router.get('/inversiones/:id_cliente', getInversiones);
router.get('/seguros/:id_cliente', getSeguros);
router.get('/pagos-iniciados/:id_cliente', getPagosIniciados);

export default router;

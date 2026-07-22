import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  downloadChallanPDF,
} from '../controllers/challan.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getChallans);
router.get('/:id', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getChallanById);
router.get('/:id/pdf', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), downloadChallanPDF);
router.post('/', requireRoles(['ADMIN', 'SALES']), createChallan);
router.patch('/:id/status', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), updateChallanStatus);

export default router;

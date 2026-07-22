import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote,
} from '../controllers/customer.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', requireRoles(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomers);
router.get('/:id', requireRoles(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomerById);
router.post('/', requireRoles(['ADMIN', 'SALES']), createCustomer);
router.put('/:id', requireRoles(['ADMIN', 'SALES']), updateCustomer);
router.post('/:id/follow-up', requireRoles(['ADMIN', 'SALES']), addFollowUpNote);

export default router;

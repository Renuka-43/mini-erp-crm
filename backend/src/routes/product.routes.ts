import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getStockMovements,
} from '../controllers/product.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/movements/log', requireRoles(['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS']), getStockMovements);
router.get('/', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getProducts);
router.get('/:id', requireRoles(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']), getProductById);
router.post('/', requireRoles(['ADMIN', 'WAREHOUSE']), createProduct);
router.put('/:id', requireRoles(['ADMIN', 'WAREHOUSE']), updateProduct);
router.post('/:id/stock-adjustment', requireRoles(['ADMIN', 'WAREHOUSE']), adjustStock);

export default router;

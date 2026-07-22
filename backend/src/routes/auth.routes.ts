import { Router } from 'express';
import { login, getMe, switchRole } from '../controllers/auth.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateJwt, getMe);
router.post('/switch-role', authenticateJwt, requireRoles(['ADMIN']), switchRole);

export default router;

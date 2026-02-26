import { Router } from 'express';
import * as controller from './auth.controller';
import { validateRequest } from '../../middleware/validateRequest';
import {
  registerSchema,
  loginSchema,
  requestResetSchema,
  resetPasswordSchema,
} from './auth.schema';

const router = Router();

router.post('/register', validateRequest(registerSchema), controller.register);
router.post('/login', validateRequest(loginSchema), controller.login);
router.post('/request-password-reset', validateRequest(requestResetSchema), controller.requestPasswordReset);
router.post('/reset-password', validateRequest(resetPasswordSchema), controller.resetPassword);

export default router;

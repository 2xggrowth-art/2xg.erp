import { Router } from 'express';
import * as mobileAuthController from '../controllers/mobile-auth.controller';

const router = Router();

// Public routes (no auth required)
router.post('/login', mobileAuthController.mobileLogin);
router.get('/verify', mobileAuthController.verifyMobileToken);

// Admin routes (should be protected in production)
router.get('/users', mobileAuthController.getMobileUsers);
router.post('/users', mobileAuthController.createMobileUser);
router.put('/users/:id/pin', mobileAuthController.updateMobileUserPin);

export default router;

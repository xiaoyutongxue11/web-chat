import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// 用户注册
router.post('/register', authController.register);

// 用户登录
router.post('/login', authController.login);

export default router;

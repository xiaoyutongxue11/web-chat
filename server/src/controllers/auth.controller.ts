import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRegisterDTO, UserLoginDTO } from '../types/user.types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // 用户注册
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: UserRegisterDTO = req.body;

      const result = await this.authService.register(userData);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '注册失败'
      });
    }
  };

  // 用户登录
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: UserLoginDTO = req.body;

      const result = await this.authService.login(loginData);

      res.status(200).json({
        success: true,
        message: '登录成功',
        data: result
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || '登录失败'
      });
    }
  };
}

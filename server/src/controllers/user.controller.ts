import { Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../types/express';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // 获取当前用户信息
  getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;

      const user = await this.userService.getUserInfo(userId);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || '获取用户信息失败'
      });
    }
  };

  // 更新用户信息
  updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const updates = req.body;

      const user = await this.userService.updateUserInfo(userId, updates);

      res.status(200).json({
        success: true,
        message: '更新成功',
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || '更新失败'
      });
    }
  };
}

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { verifyToken } from '../utils/jwt.util';

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
      return;
    }

    const token = authHeader.substring(7); // 移除 "Bearer " 前缀

    // 验证token
    const decoded = verifyToken(token);
    
    // 将用户信息附加到请求对象
    req.user = decoded;
    
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: '认证失败，令牌无效或已过期'
    });
  }
};

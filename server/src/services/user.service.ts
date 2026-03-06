import { UserDAO } from '../dao/user.dao';
import { UserResponseDTO } from '../types/user.types';

export class UserService {
  private userDAO: UserDAO;

  constructor() {
    this.userDAO = new UserDAO();
  }

  // 获取用户信息
  async getUserInfo(userId: number): Promise<UserResponseDTO> {
    const user = await this.userDAO.findById(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }

    // 移除敏感信息
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // 更新用户信息
  async updateUserInfo(
    userId: number,
    updates: Partial<UserResponseDTO>
  ): Promise<UserResponseDTO> {
    // 不允许更新的字段
    const { id, username, email, created_at, ...allowedUpdates } = updates as any;

    await this.userDAO.update(userId, allowedUpdates);

    // 返回更新后的用户信息
    return this.getUserInfo(userId);
  }
}

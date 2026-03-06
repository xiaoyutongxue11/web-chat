import { UserDAO } from '../dao/user.dao';
import { UserRegisterDTO, UserLoginDTO, UserResponseDTO } from '../types/user.types';
import { hashPassword, comparePassword } from '../utils/bcrypt.util';
import { generateToken } from '../utils/jwt.util';

export class AuthService {
  private userDAO: UserDAO;

  constructor() {
    this.userDAO = new UserDAO();
  }

  // 用户注册
  async register(userData: UserRegisterDTO): Promise<{ user: UserResponseDTO; token: string }> {
    // 检查用户名是否已存在
    const existingUser = await this.userDAO.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userDAO.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }

    // 密码加密
    const password_hash = await hashPassword(userData.password);

    // 创建用户
    const userId = await this.userDAO.create({
      ...userData,
      password_hash
    });

    // 获取完整用户信息
    const user = await this.userDAO.findById(userId);
    if (!user) {
      throw new Error('用户创建失败');
    }

    // 生成JWT Token
    const token = generateToken({
      userId: user.id,
      username: user.username
    });

    // 返回用户信息（不包含密码）
    const userResponse = this.formatUserResponse(user);

    return { user: userResponse, token };
  }

  // 用户登录
  async login(loginData: UserLoginDTO): Promise<{ user: UserResponseDTO; token: string }> {
    // 查找用户
    const user = await this.userDAO.findByUsername(loginData.username);
    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await comparePassword(loginData.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    // 检查账号状态
    if (user.status !== 0) {
      throw new Error('账号已被禁用或注销');
    }

    // 更新最后登录时间
    await this.userDAO.updateLastLogin(user.id);

    // 生成JWT Token
    const token = generateToken({
      userId: user.id,
      username: user.username
    });

    // 返回用户信息
    const userResponse = this.formatUserResponse(user);

    return { user: userResponse, token };
  }

  // 格式化用户响应（移除敏感信息）
  private formatUserResponse(user: any): UserResponseDTO {
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

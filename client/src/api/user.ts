import request from './request';

// 用户注册数据类型
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

// 用户登录数据类型
export interface LoginData {
  username: string;
  password: string;
}

// 用户信息类型
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  nickname: string | null;
  avatar: string | null;
  gender: number;
  birthday: Date | null;
  phone: string | null;
  signature: string | null;
  status: number;
  created_at: Date;
  last_login_at: Date | null;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// 用户注册
export const register = (data: RegisterData) => {
  return request.post<any, ApiResponse<{ user: UserInfo; token: string }>>(
    '/auth/register',
    data
  );
};

// 用户登录
export const login = (data: LoginData) => {
  return request.post<any, ApiResponse<{ user: UserInfo; token: string }>>(
    '/auth/login',
    data
  );
};

// 获取当前用户信息
export const getUserInfo = () => {
  return request.get<any, ApiResponse<UserInfo>>('/users/me');
};

// 更新用户信息
export const updateUserInfo = (data: Partial<UserInfo>) => {
  return request.put<any, ApiResponse<UserInfo>>('/users/me', data);
};

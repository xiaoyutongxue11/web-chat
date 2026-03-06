export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  nickname: string | null;
  avatar: string | null;
  gender: number;
  birthday: Date | null;
  phone: string | null;
  signature: string | null;
  status: number;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

export interface UserRegisterDTO {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

export interface UserLoginDTO {
  username: string;
  password: string;
}

export interface UserResponseDTO {
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

export interface JWTPayload {
  userId: number;
  username: string;
}

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/database';
import { User, UserRegisterDTO } from '../types/user.types';

export class UserDAO {
  // 根据用户名查找用户
  async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM user WHERE username = ?',
      [username]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // 根据邮箱查找用户
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // 根据ID查找用户
  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM user WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as User) : null;
  }

  // 创建用户
  async create(userData: UserRegisterDTO & { password_hash: string }): Promise<number> {
    const { username, email, password_hash, nickname } = userData;
    
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO user (username, email, password_hash, nickname) 
       VALUES (?, ?, ?, ?)`,
      [username, email, password_hash, nickname || username]
    );
    
    return result.insertId;
  }

  // 更新最后登录时间
  async updateLastLogin(userId: number): Promise<void> {
    await pool.query(
      'UPDATE user SET last_login_at = NOW() WHERE id = ?',
      [userId]
    );
  }

  // 更新用户信息
  async update(userId: number, updates: Partial<User>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(userId);
    await pool.query(
      `UPDATE user SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }
}

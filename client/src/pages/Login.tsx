import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/user';
import type { LoginData } from '../api/user';
import './Login.css';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginData) => {
    setLoading(true);
    try {
      const response = await login(values);
      if (response.success && response.data) {
        // 保存token
        localStorage.setItem('token', response.data.token);
        // 保存用户信息
        localStorage.setItem('userInfo', JSON.stringify(response.data.user));
        message.success('登录成功！');
        // 跳转到首页
        navigate('/');
      }
    } catch (error: any) {
      message.error(error.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Web Chat</h1>
          <p>欢迎回来</p>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              className="login-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              className="login-input"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="login-button"
              block
            >
              登录
            </Button>
          </Form.Item>

          <div className="login-footer">
            <span>还没有账号？</span>
            <a onClick={() => navigate('/register')}>立即注册</a>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;

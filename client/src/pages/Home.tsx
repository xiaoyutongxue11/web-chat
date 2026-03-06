import { useEffect, useState } from 'react';
import { Card, Button, message, Avatar, Descriptions } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUserInfo } from '../api/user';
import type { UserInfo } from '../api/user';
import './Home.css';

const Home = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await getUserInfo();
      if (response.success && response.data) {
        setUserInfo(response.data);
      }
    } catch (error: any) {
      message.error('获取用户信息失败');
      // 如果获取失败，可能是token过期，跳转到登录页
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    message.success('退出登录成功');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <Card className="user-card">
          <div className="user-header">
            <Avatar size={80} icon={<UserOutlined />} className="user-avatar" />
            <h2>{userInfo?.nickname || userInfo?.username}</h2>
            <p className="user-email">{userInfo?.email}</p>
          </div>

          <Descriptions column={1} className="user-info">
            <Descriptions.Item label="用户名">
              {userInfo?.username}
            </Descriptions.Item>
            <Descriptions.Item label="昵称">
              {userInfo?.nickname || '未设置'}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              {userInfo?.email}
            </Descriptions.Item>
            <Descriptions.Item label="个性签名">
              {userInfo?.signature || '这个人很懒，什么都没留下'}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {userInfo?.created_at ? new Date(userInfo.created_at).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {userInfo?.last_login_at ? new Date(userInfo.last_login_at).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
          </Descriptions>

          <Button
            type="primary"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="logout-button"
            block
          >
            退出登录
          </Button>
        </Card>

        <div className="welcome-message">
          <h1>欢迎使用 Web Chat</h1>
          <p>这是一个功能完整的即时通讯系统</p>
          <div className="features">
            <div className="feature-item">✅ 用户注册登录</div>
            <div className="feature-item">✅ JWT 身份认证</div>
            <div className="feature-item">🚧 好友系统（开发中）</div>
            <div className="feature-item">🚧 私聊功能（开发中）</div>
            <div className="feature-item">🚧 群聊功能（开发中）</div>
            <div className="feature-item">🚧 音视频通话（开发中）</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

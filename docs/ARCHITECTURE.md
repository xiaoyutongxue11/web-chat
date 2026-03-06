# Web聊天系统架构设计文档

## 目录
1. [系统整体架构](#1-系统整体架构)
2. [前端架构](#2-前端架构)
3. [后端架构](#3-后端架构)
4. [WebSocket通信架构](#4-websocket通信架构)
5. [WebRTC信令服务器设计](#5-webrtc信令服务器设计)
6. [Redis在系统中的作用](#6-redis在系统中的作用)
7. [数据流设计](#7-数据流设计)
8. [项目目录结构](#8-项目目录结构)

---

## 1. 系统整体架构

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                          客户端层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web浏览器   │  │   移动端H5    │  │   桌面应用    │          │
│  │  React+Vite  │  │  React+Vite  │  │   Electron   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────────────────────────────────▼─────────────────┐
│                        负载均衡层 (Nginx)                         │
│  - SSL终止                                                       │
│  - 反向代理                                                       │
│  - 负载均衡                                                       │
│  - 静态资源服务                                                   │
└─────────┬─────────────────────────────────────┬─────────────────┘
          │                                     │
    ┌─────▼─────┐                         ┌─────▼─────┐
    │  HTTP/API │                         │ WebSocket │
    │   Gateway │                         │  Gateway  │
    └─────┬─────┘                         └─────┬─────┘
          │                                     │
┌─────────▼─────────────────────────────────────▼─────────────────┐
│                        应用服务层                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  API服务器1   │  │  API服务器2   │  │  API服务器N   │          │
│  │ Express+Node │  │ Express+Node │  │ Express+Node │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────┐         │
│  │           Socket.IO 集群 (Redis Adapter)            │         │
│  └──────┬──────────────────┬──────────────────┬───────┘         │
│         │                  │                  │                  │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐          │
│  │ WebRTC信令1  │  │ WebRTC信令2  │  │ WebRTC信令N  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────┬─────────────────────────────────────┬─────────────────┘
          │                                     │
┌─────────▼─────────────────────────────────────▼─────────────────┐
│                        缓存层 (Redis)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Redis Master │  │ Redis Slave1 │  │ Redis Slave2 │          │
│  │  - 在线状态   │  │   (只读)     │  │   (只读)     │          │
│  │  - 会话管理   │  └──────────────┘  └──────────────┘          │
│  │  - 消息队列   │                                               │
│  │  - 离线消息   │  ┌──────────────┐                            │
│  │  - 分布式锁   │  │Redis Sentinel│                            │
│  └──────────────┘  │  (高可用)     │                            │
│                    └──────────────┘                             │
└─────────┬──────────────────────────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────────────────────────┐
│                      持久化层 (MySQL)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ MySQL Master │  │ MySQL Slave1 │  │ MySQL Slave2 │         │
│  │  - 用户信息   │  │   (只读)     │  │   (只读)     │         │
│  │  - 好友关系   │  └──────────────┘  └──────────────┘         │
│  │  - 群组信息   │                                              │
│  │  - 聊天记录   │                                              │
│  │  - 文件元数据 │                                              │
│  └──────────────┘                                              │
└────────────────────────────────────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────────────────────────┐
│                      存储层                                      │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │  对象存储     │  │  CDN加速     │                           │
│  │  (OSS/S3)    │  │              │                           │
│  │  - 文件存储   │  │  - 静态资源   │                           │
│  │  - 图片存储   │  │  - 媒体文件   │                           │
│  │  - 语音视频   │  └──────────────┘                           │
│  └──────────────┘                                              │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 架构层次说明

#### 客户端层
- **作用**: 用户交互界面，处理用户输入和展示
- **技术**: React + Vite + TypeScript + Ant Design
- **职责**: 
  - UI渲染和交互
  - WebSocket连接管理
  - WebRTC音视频处理
  - 本地状态管理

#### 负载均衡层
- **作用**: 流量分发和SSL终止
- **技术**: Nginx
- **职责**:
  - HTTP/HTTPS请求分发
  - WebSocket连接升级和分发
  - SSL/TLS加密
  - 静态资源服务

#### 应用服务层
- **作用**: 业务逻辑处理
- **技术**: Node.js + Express + Socket.IO
- **职责**:
  - RESTful API处理
  - WebSocket实时通信
  - WebRTC信令处理
  - 业务逻辑实现

#### 缓存层
- **作用**: 高速数据访问和临时存储
- **技术**: Redis (主从+哨兵)
- **职责**:
  - 在线状态管理
  - 会话存储
  - 消息队列
  - 分布式锁

#### 持久化层
- **作用**: 数据持久化存储
- **技术**: MySQL (主从复制)
- **职责**:
  - 用户数据存储
  - 关系数据存储
  - 历史消息存储

#### 存储层
- **作用**: 文件和媒体存储
- **技术**: 对象存储 + CDN
- **职责**:
  - 文件存储
  - 媒体文件存储
  - 内容分发

---

## 2. 前端架构

### 2.1 前端架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端应用架构                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    展示层 (View)                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │ 登录注册  │  │ 聊天界面  │  │ 音视频界面 │            │    │
│  │  │ 页面组件  │  │ 页面组件  │  │ 页面组件  │            │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │    │
│  │       │             │             │                   │    │
│  │  ┌────▼─────────────▼─────────────▼─────┐            │    │
│  │  │         通用UI组件库                   │            │    │
│  │  │  - 消息气泡  - 用户卡片  - 文件预览    │            │    │
│  │  │  - 表情选择  - 音视频控制  - 通知提示  │            │    │
│  │  └────────────────────────────────────┘            │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                  状态管理层 (State)                       │   │
│  │  ┌──────────────────────────────────────────────────┐  │   │
│  │  │              Redux Toolkit Store                 │  │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │  │   │
│  │  │  │ User   │  │ Chat   │  │ Friend │  │ Group  │ │  │   │
│  │  │  │ Slice  │  │ Slice  │  │ Slice  │  │ Slice  │ │  │   │
│  │  │  └────────┘  └────────┘  └────────┘  └────────┘ │  │   │
│  │  │  ┌────────┐  ┌────────┐  ┌────────┐            │  │   │
│  │  │  │ Call   │  │ File   │  │ UI     │            │  │   │
│  │  │  │ Slice  │  │ Slice  │  │ Slice  │            │  │   │
│  │  │  └────────┘  └────────┘  └────────┘            │  │   │
│  │  └──────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                  服务层 (Service)                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │ API服务  │  │ Socket服务│  │ WebRTC服务│             │   │
│  │  │          │  │          │  │          │             │   │
│  │  │ - 用户API │  │ - 连接管理│  │ - P2P通话 │             │   │
│  │  │ - 好友API │  │ - 消息收发│  │ - 多人会议│             │   │
│  │  │ - 群组API │  │ - 事件监听│  │ - 屏幕共享│             │   │
│  │  │ - 文件API │  │ - 心跳保活│  │ - 媒体控制│             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                  工具层 (Utils)                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │ 请求封装  │  │ 本地存储  │  │ 消息处理  │             │   │
│  │  │ (Axios)  │  │(LocalStorage)│ (格式化) │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │ 时间处理  │  │ 文件处理  │  │ 加密解密  │             │   │
│  │  │ (dayjs)  │  │          │  │          │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 前端技术栈

```typescript
// 核心框架
- React 18.x
- TypeScript 5.x
- Vite 5.x

// UI框架
- Ant Design 5.x
- Ant Design Icons
- styled-components / CSS Modules

// 状态管理
- Redux Toolkit
- Redux Persist (持久化)
- RTK Query (API缓存)

// 路由
- React Router v6

// 实时通信
- Socket.IO Client
- WebRTC API

// HTTP请求
- Axios
- SWR / React Query (可选)

// 工具库
- dayjs (时间处理)
- lodash-es (工具函数)
- crypto-js (加密)
- file-saver (文件下载)

// 开发工具
- ESLint
- Prettier
- Husky
- lint-staged
```

### 2.3 前端核心模块

#### 2.3.1 认证模块
```typescript
// 功能
- 用户注册
- 用户登录
- Token管理
- 自动登录
- 登出

// 状态
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}
```

#### 2.3.2 聊天模块
```typescript
// 功能
- 消息发送/接收
- 消息列表展示
- 消息已读/未读
- 消息撤回
- 消息转发
- 表情发送
- 图片/文件发送

// 状态
interface ChatState {
  conversations: Conversation[];
  currentConversation: string | null;
  messages: Record<string, Message[]>;
  unreadCount: Record<string, number>;
}
```

#### 2.3.3 好友模块
```typescript
// 功能
- 好友列表
- 添加好友
- 删除好友
- 好友搜索
- 好友分组
- 在线状态

// 状态
interface FriendState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  onlineStatus: Record<string, boolean>;
}
```

#### 2.3.4 群组模块
```typescript
// 功能
- 群组列表
- 创建群组
- 加入群组
- 退出群组
- 群成员管理
- 群公告

// 状态
interface GroupState {
  groups: Group[];
  groupMembers: Record<string, Member[]>;
  currentGroup: string | null;
}
```

#### 2.3.5 音视频模块
```typescript
// 功能
- 发起通话
- 接听/拒绝
- 挂断通话
- 音视频切换
- 屏幕共享
- 多人会议

// 状态
interface CallState {
  currentCall: Call | null;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected';
}
```

---

## 3. 后端架构

### 3.1 后端架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         后端应用架构                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                    路由层 (Routes)                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │ 用户路由  │  │ 好友路由  │  │ 群组路由  │            │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │    │
│  │  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐            │    │
│  │  │ 消息路由  │  │ 文件路由  │  │ 通话路由  │            │    │
│  │  └──────────┘  └──────────┘  └──────────┘            │    │
│  └────────────────────────────────────────────────────────┘    │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                  中间件层 (Middleware)                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │ 认证中间件 │  │ 日志中间件 │  │ 错误处理  │             │   │
│  │  │ (JWT)    │  │ (Morgan) │  │ 中间件    │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │ 限流中间件 │  │ CORS中间件│  │ 压缩中间件 │             │   │
│  │  │(Rate Limit)│ │          │  │ (Gzip)   │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                  控制器层 (Controllers)                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │用户控制器 │  │好友控制器 │  │群组控制器 │             │   │
│  │  │          │  │          │  │          │             │   │
│  │  │ - 注册   │  │ - 添加   │  │ - 创建   │             │   │
│  │  │ - 登录   │  │ - 删除   │  │ - 加入   │             │   │
│  │  │ - 更新   │  │ - 查询   │  │ - 管理   │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │消息控制器 │  │文件控制器 │  │通话控制器 │             │   │
│  │  │          │  │          │  │          │             │   │
│  │  │ - 发送   │  │ - 上传   │  │ - 发起   │             │   │
│  │  │ - 接收   │  │ - 下载   │  │ - 信令   │             │   │
│  │  │ - 历史   │  │ - 删除   │  │ - 管理   │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                  服务层 (Services)                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │用户服务   │  │好友服务   │  │群组服务   │             │   │
│  │  │          │  │          │  │          │             │   │
│  │  │ - 业务逻辑│  │ - 业务逻辑│  │ - 业务逻辑│             │   │
│  │  │ - 数据验证│  │ - 数据验证│  │ - 数据验证│             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │消息服务   │  │文件服务   │  │通知服务   │             │   │
│  │  │          │  │          │  │          │             │   │
│  │  │ - 消息处理│  │ - 文件处理│  │ - 推送通知│             │   │
│  │  │ - 离线存储│  │ - OSS上传 │  │ - 邮件通知│             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                  数据访问层 (DAL)                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │用户模型   │  │好友模型   │  │群组模型   │             │   │
│  │  │(User)    │  │(Friend)  │  │(Group)   │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │消息模型   │  │文件模型   │  │通话模型   │             │   │
│  │  │(Message) │  │(File)    │  │(Call)    │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────▼────────────────────────────────┐   │
│  │                  工具层 (Utils)                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │ JWT工具  │  │ 加密工具  │  │ 日志工具  │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │ 验证工具  │  │ 文件工具  │  │ Redis工具 │             │   │
│  │  └──────────┘  └──────────┘  └──────────┘             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 后端技术栈

```javascript
// 核心框架
- Node.js 18.x+
- Express 4.x
- TypeScript 5.x

// 实时通信
- Socket.IO 4.x
- Socket.IO Redis Adapter

// 数据库
- MySQL 8.x
- Sequelize ORM
- Redis 7.x
- ioredis

// 认证授权
- jsonwebtoken (JWT)
- bcrypt (密码加密)
- passport (可选)

// 文件处理
- multer (文件上传)
- sharp (图片处理)
- ali-oss / aws-sdk (对象存储)

// 工具库
- joi / yup (数据验证)
- winston (日志)
- morgan (HTTP日志)
- dotenv (环境变量)
- compression (压缩)
- helmet (安全)
- cors (跨域)
- express-rate-limit (限流)

// 开发工具
- nodemon
- ts-node
- ESLint
- Prettier
```

### 3.3 数据库设计

#### 3.3.1 用户表 (users)
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  avatar VARCHAR(255),
  status ENUM('online', 'offline', 'busy', 'away') DEFAULT 'offline',
  signature VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.2 好友关系表 (friendships)
```sql
CREATE TABLE friendships (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  friend_id BIGINT NOT NULL,
  status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
  remark VARCHAR(50),
  group_name VARCHAR(50) DEFAULT '我的好友',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_friend (user_id, friend_id),
  INDEX idx_user_id (user_id),
  INDEX idx_friend_id (friend_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.3 群组表 (groups)
```sql
CREATE TABLE groups (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(255),
  description TEXT,
  owner_id BIGINT NOT NULL,
  max_members INT DEFAULT 500,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner_id (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.4 群成员表 (group_members)
```sql
CREATE TABLE group_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  group_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role ENUM('owner', 'admin', 'member') DEFAULT 'member',
  nickname VARCHAR(50),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_group_user (group_id, user_id),
  INDEX idx_group_id (group_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.5 消息表 (messages)
```sql
CREATE TABLE messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id VARCHAR(100) NOT NULL,
  conversation_type ENUM('private', 'group') NOT NULL,
  sender_id BIGINT NOT NULL,
  receiver_id BIGINT,
  group_id BIGINT,
  content TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file', 'audio', 'video', 'system') DEFAULT 'text',
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  file_size BIGINT,
  is_read BOOLEAN DEFAULT FALSE,
  is_recalled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  INDEX idx_conversation (conversation_id, created_at),
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.6 文件表 (files)
```sql
CREATE TABLE files (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size BIGINT,
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  storage_key VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3.3.7 通话记录表 (calls)
```sql
CREATE TABLE calls (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  call_type ENUM('audio', 'video', 'conference') NOT NULL,
  initiator_id BIGINT NOT NULL,
  receiver_id BIGINT,
  group_id BIGINT,
  status ENUM('calling', 'connected', 'ended', 'missed', 'rejected') DEFAULT 'calling',
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  duration INT DEFAULT 0,
  FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
  INDEX idx_initiator (initiator_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 4. WebSocket通信架构

### 4.1 Socket.IO架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      客户端 (Socket.IO Client)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  const socket = io('wss://api.example.com', {            │  │
│  │    auth: { token: 'JWT_TOKEN' },                         │  │
│  │    transports: ['websocket', 'polling']                  │  │
│  │  });                                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ WebSocket/Long Polling
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    Nginx (负载均衡 + SSL)                        │
│  - WebSocket升级                                                │
│  - Sticky Session (基于IP或Cookie)                             │
│  - 健康检查                                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
┌─────────▼─────┐ ┌───────▼─────┐ ┌──────▼──────┐
│ Socket服务器1  │ │ Socket服务器2│ │ Socket服务器N│
│               │ │              │ │             │
│ ┌───────────┐ │ │ ┌──────────┐ │ │ ┌─────────┐ │
│ │Socket.IO  │ │ │ │Socket.IO │ │ │ │Socket.IO│ │
│ │Server     │ │ │ │Server    │ │ │ │Server   │ │
│ └─────┬─────┘ │ │ └────┬─────┘ │ │ └────┬────┘ │
│       │       │ │      │       │ │      │      │
│ ┌─────▼─────┐ │ │ ┌────▼─────┐ │ │ ┌────▼────┐ │
│ │Redis      │ │ │ │Redis     │ │ │ │Redis    │ │
│ │Adapter    │ │ │ │Adapter   │ │ │ │Adapter  │ │
│ └─────┬─────┘ │ │ └────┬─────┘ │ │ └────┬────┘ │
└───────┼───────┘ └──────┼───────┘ └──────┼──────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Redis Pub/Sub (消息总线)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Channel: socket.io#/#                                   │  │
│  │  - 跨服务器消息广播                                        │  │
│  │  - 房间管理                                               │  │
│  │  - 在线状态同步                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Socket.IO事件设计

#### 4.2.1 连接事件
```typescript
// 客户端连接
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// 认证
socket.emit('authenticate', { token: 'JWT_TOKEN' });

// 认证成功
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.userId);
});

// 断开连接
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

// 重连
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected:', attemptNumber);
});
```

#### 4.2.2 消息事件
```typescript
// 发送私聊消息
socket.emit('message:send', {
  receiverId: 123,
  content: 'Hello',
  type: 'text'
});

// 接收私聊消息
socket.on('message:receive', (message) => {
  console.log('New message:', message);
});

// 发送群聊消息
socket.emit('group:message:send', {
  groupId: 456,
  content: 'Hello group',
  type: 'text'
});

// 接收群聊消息
socket.on('group:message:receive', (message) => {
  console.log('New group message:', message);
});

// 消息已读回执
socket.emit('message:read', {
  messageIds: [1, 2, 3]
});

// 对方已读通知
socket.on('message:read:notify', (data) => {
  console.log('Messages read:', data.messageIds);
});

// 正在输入
socket.emit('typing:start', { conversationId: 'user_123' });
socket.emit('typing:stop', { conversationId: 'user_123' });

// 对方正在输入
socket.on('typing:notify', (data) => {
  console.log('User typing:', data.userId);
});
```

#### 4.2.3 在线状态事件
```typescript
// 用户上线
socket.on('user:online', (data) => {
  console.log('User online:', data.userId);
});

// 用户下线
socket.on('user:offline', (data) => {
  console.log('User offline:', data.userId);
});

// 批量查询在线状态
socket.emit('users:status:query', {
  userIds: [1, 2, 3, 4, 5]
});

socket.on('users:status:response', (data) => {
  console.log('Users status:', data.statuses);
});
```

#### 4.2.4 好友事件
```typescript
// 好友请求
socket.on('friend:request', (data) => {
  console.log('Friend request from:', data.fromUser);
});

// 好友请求被接受
socket.on('friend:accepted', (data) => {
  console.log('Friend request accepted:', data.friend);
});

// 好友删除
socket.on('friend:removed', (data) => {
  console.log('Friend removed:', data.userId);
});
```

#### 4.2.5 群组事件
```typescript
// 加入群组房间
socket.emit('group:join', { groupId: 456 });

// 离开群组房间
socket.emit('group:leave', { groupId: 456 });

// 群成员加入通知
socket.on('group:member:joined', (data) => {
  console.log('Member joined:', data.user);
});

// 群成员离开通知
socket.on('group:member:left', (data) => {
  console.log('Member left:', data.userId);
});
```

### 4.3 Socket.IO服务器实现

```typescript
// server/socket/index.ts
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';

export function initializeSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Redis适配器 - 支持多服务器
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
  });

  // 认证中间件
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // 连接处理
  io.on('connection', async (socket) => {
    const userId = socket.data.userId;
    
    // 加入用户专属房间
    socket.join(`user:${userId}`);
    
    // 更新在线状态
    await updateUserStatus(userId, 'online');
    
    // 通知好友上线
    await notifyFriendsOnline(io, userId);

    // 注册事件处理器
    registerMessageHandlers(io, socket);
    registerFriendHandlers(io, socket);
    registerGroupHandlers(io, socket);
    registerCallHandlers(io, socket);

    // 断开连接
    socket.on('disconnect', async () => {
      await updateUserStatus(userId, 'offline');
      await notifyFriendsOffline(io, userId);
    });
  });

  return io;
}
```

### 4.4 消息可靠性保证

#### 4.4.1 消息确认机制
```typescript
// 客户端发送消息带确认
socket.emit('message:send', messageData, (response) => {
  if (response.success) {
    console.log('Message sent:', response.messageId);
  } else {
    console.error('Message failed:', response.error);
  }
});

// 服务器端
socket.on('message:send', async (data, callback) => {
  try {
    const message = await saveMessage(data);
    await deliverMessage(io, message);
    callback({ success: true, messageId: message.id });
  } catch (error) {
    callback({ success: false, error: error.message });
  }
});
```

#### 4.4.2 离线消息处理
```typescript
// 用户上线时拉取离线消息
socket.on('connection', async (socket) => {
  const userId = socket.data.userId;
  const offlineMessages = await getOfflineMessages(userId);
  
  if (offlineMessages.length > 0) {
    socket.emit('messages:offline', offlineMessages);
    await markMessagesAsDelivered(offlineMessages.map(m => m.id));
  }
});
```

#### 4.4.3 消息重试机制
```typescript
// 客户端消息队列
class MessageQueue {
  private queue: Message[] = [];
  private retryCount = 3;
  
  async send(message: Message) {
    this.queue.push(message);
    await this.procesQueue();
  }
  
  private async procesQueue() {
    while (this.queue.length > 0) {
      const message = this.queue[0];
      
      for (let i = 0; i < this.retryCount; i++) {
        try {
          await this.sendMessage(message);
          this.queue.shift();
          break;
        } catch (error) {
          if (i === this.retryCount - 1) {
            // 保存到本地，等待网络恢复
            await this.saveToLocal(message);
            this.queue.shift();
          }
          await this.delay(1000 * (i + 1));
        }
      }
    }
  }
}
```

---

## 5. WebRTC信令服务器设计

### 5.1 WebRTC架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         客户端A                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  WebRTC PeerConnection                                   │  │
│  │  - getUserMedia (获取媒体流)                              │  │
│  │  - createOffer/createAnswer                              │  │
│  │  - setLocalDescription/setRemoteDescription              │  │
│  │  - addIceCandidate                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────┘
              │ 信令 (Socket.IO)
              │
┌─────────────▼───────────────────────────────────────────────────┐
│                    WebRTC信令服务器                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  信令处理                                                 │  │
│  │  - call:offer (转发Offer)                                │  │
│  │  - call:answer (转发Answer)                              │  │
│  │  - call:ice-candidate (转发ICE候选)                      │  │
│  │  - call:hangup (挂断通知)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  房间管理                                                 │  │
│  │  - 创建通话房间                                           │  │
│  │  - 管理参与者                                             │  │
│  │  - 多人会议协调                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────┘
              │ 信令 (Socket.IO)
              │
┌─────────────▼───────────────────────────────────────────────────┐
│                         客户端B                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  WebRTC PeerConnection                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
              │
              │ P2P媒体流 (STUN/TURN)
              │
┌─────────────▼───────────────────────────────────────────────────┐
│                    STUN/TURN服务器                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  STUN Server (NAT穿透)                                   │  │
│  │  - 获取公网IP和端口                                       │  │
│  │  - 协助P2P连接建立                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TURN Server (中继服务)                                  │  │
│  │  - P2P失败时中继媒体流                                    │  │
│  │  - 保证连接可靠性                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 一对一通话信令流程

```
客户端A                信令服务器              客户端B
   │                      │                      │
   │  1. call:initiate    │                      │
   ├─────────────────────>│                      │
   │                      │  2. call:incoming    │
   │                      ├─────────────────────>│
   │                      │                      │
   │                      │  3. call:accept      │
   │                      │<─────────────────────┤
   │  4. call:accepted    │                      │
   │<─────────────────────┤                      │
   │                      │                      │
   │  5. call:offer       │                      │
   │  (SDP Offer)         │                      │
   ├─────────────────────>│  6. call:offer       │
   │                      ├─────────────────────>│
   │                      │                      │
   │                      │  7. call:answer      │
   │                      │  (SDP Answer)        │
   │  8. call:answer      │<─────────────────────┤
   │<─────────────────────┤                      │
   │                      │                      │
   │  9. call:ice-candidate                      │
   ├─────────────────────>├─────────────────────>│
   │<─────────────────────┤<─────────────────────┤
   │                      │                      │
   │         P2P媒体流建立 (直连或TURN中继)        │
   │<═══════════════════════════════════════════>│
   │                      │                      │
   │  10. call:hangup     │                      │
   ├─────────────────────>│  11. call:hangup     │
   │                      ├─────────────────────>│
   │                      │                      │
```

### 5.3 WebRTC信令事件

```typescript
// 发起通话
socket.emit('call:initiate', {
  callType: 'video', // 'audio' | 'video'
  receiverId: 123
});

// 接收来电
socket.on('call:incoming', (data) => {
  // data: { callId, caller, callType }
  showIncomingCallUI(data);
});

// 接受通话
socket.emit('call:accept', { callId: 'xxx' });

// 拒绝通话
socket.emit('call:reject', { callId: 'xxx' });

// 发送Offer
socket.emit('call:offer', {
  callId: 'xxx',
  sdp: peerConnection.localDescription
});

// 接收Offer
socket.on('call:offer', async (data) => {
  await peerConnection.setRemoteDescription(data.sdp);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('call:answer', {
    callId: data.callId,
    sdp: answer
  });
});

// 接收Answer
socket.on('call:answer', async (data) => {
  await peerConnection.setRemoteDescription(data.sdp);
});

// ICE候选交换
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('call:ice-candidate', {
      callId: 'xxx',
      candidate: event.candidate
    });
  }
};

socket.on('call:ice-candidate', async (data) => {
  await peerConnection.addIceCandidate(data.candidate);
});

// 挂断通话
socket.emit('call:hangup', { callId: 'xxx' });

socket.on('call:hangup', (data) => {
  closePeerConnection();
  showCallEndedUI();
});
```

### 5.4 多人会议信令

```typescript
// 创建会议室
socket.emit('conference:create', {
  groupId: 456,
  maxParticipants: 9
});

// 加入会议室
socket.emit('conference:join', {
  conferenceId: 'xxx'
});

// 会议室成员列表
socket.on('conference:participants', (data) => {
  // data: { participants: [{ userId, stream }] }
  data.participants.forEach(participant => {
    createPeerConnection(participant.userId);
  });
});

// 新成员加入
socket.on('conference:participant:joined', (data) => {
  createPeerConnection(data.userId);
  sendOffer(data.userId);
});

// 成员离开
socket.on('conference:participant:left', (data) => {
  removePeerConnection(data.userId);
});

// Mesh架构 - 每个客户端与其他所有客户端建立P2P连接
// SFU架构 - 所有客户端连接到中央服务器，服务器转发流
```

### 5.5 WebRTC客户端实现

```typescript
// services/webrtc.service.ts
export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  
  private config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:your-turn-server.com:3478',
        username: 'username',
        credential: 'password'
      }
    ]
  };

  async startCall(isVideo: boolean): Promise<MediaStream> {
    // 获取本地媒体流
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideo
    });

    // 创建PeerConnection
    this.peerConnection = new RTCPeerConnection(this.config);

    // 添加本地流到连接
    this.localStream.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, this.localStream!);
    });

    // 监听远程流
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStream(this.remoteStream);
    };

    // 监听ICE候选
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(event.candidate);
      }
    };

    // 监听连接状态
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection!.connectionState);
    };

    return this.localStream;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.peerConnection!.setRemoteDescription(offer);
    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.peerConnection!.setRemoteDescription(answer);
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.peerConnection!.addIceCandidate(candidate);
  }

  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  async shareScreen(): Promise<MediaStream> {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true
    });

    const videoTrack = screenStream.getVideoTracks()[0];
    const sender = this.peerConnection!.getSenders().find(s => 
      s.track?.kind === 'video'
    );

    if (sender) {
      sender.replaceTrack(videoTrack);
    }

    return screenStream;
  }

  close(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
  }

  // 回调函数
  onRemoteStream: (stream: MediaStream) => void = () => {};
  onIceCandidate: (candidate: RTCIceCandidate) => void = () => {};
}
```

---

## 6. Redis在系统中的作用

### 6.1 Redis数据结构设计

#### 6.1.1 在线状态管理
```redis
# 用户在线状态 (String)
Key: user:status:{userId}
Value: online|offline|busy|away
TTL: 300秒 (5分钟，需要心跳续期)

# 在线用户集合 (Set)
Key: users:online
Members: userId1, userId2, userId3...

# 用户Socket映射 (Hash)
Key: user:sockets:{userId}
Fields: 
  socketId1: serverInstance1
  socketId2: serverInstance2
```

#### 6.1.2 会话管理
```redis
# 用户会话 (Hash)
Key: session:{sessionId}
Fields:
  userId: 123
  token: JWT_TOKEN
  loginTime: timestamp
  lastActivity: timestamp
TTL: 7天

# 用户Token映射 (String)
Key: user:token:{userId}
Value: sessionId
TTL: 7天
```

#### 6.1.3 离线消息队列
```redis
# 用户离线消息队列 (List)
Key: offline:messages:{userId}
Value: [messageId1, messageId2, messageId3...]
操作: LPUSH添加, RPOP获取

# 消息详情 (Hash)
Key: message:{messageId}
Fields:
  senderId: 123
  content: "Hello"
  type: text
  timestamp: 1234567890
TTL: 7天
```

#### 6.1.4 未读消息计数
```redis
# 用户未读消息计数 (Hash)
Key: unread:count:{userId}
Fields:
  conversation_user_456: 5
  conversation_group_789: 3
  
# 会话最后消息 (Hash)
Key: conversation:last:{conversationId}
Fields:
  messageId: 123
  content: "Last message"
  timestamp: 1234567890
```

#### 6.1.5 分布式锁
```redis
# 分布式锁 (String)
Key: lock:{resource}
Value: lockId (UUID)
TTL: 30秒
操作: SET NX EX

# 使用场景:
- 防止重复消息发送
- 群组操作互斥
- 文件上传去重
```

#### 6.1.6 限流控制
```redis
# 用户操作限流 (String)
Key: ratelimit:{userId}:{action}
Value: count
TTL: 60秒

# 示例:
ratelimit:123:send_message -> 每分钟最多100条
ratelimit:123:add_friend -> 每分钟最多10次
```

### 6.2 Redis使用场景

#### 6.2.1 在线状态管理
```typescript
// 用户上线
async function setUserOnline(userId: number): Promise<void> {
  await redis.setex(`user:status:${userId}`, 300, 'online');
  await redis.sadd('users:online', userId);
}

// 用户下线
async function setUserOffline(userId: number): Promise<void> {
  await redis.del(`user:status:${userId}`);
  await redis.srem('users:online', userId);
}

// 批量查询在线状态
async function getUsersStatus(userIds: number[]): Promise<Record<number, string>> {
  const pipeline = redis.pipeline();
  userIds.forEach(id => {
    pipeline.get(`user:status:${id}`);
  });
  const results = await pipeline.exec();
  
  const statuses: Record<number, string> = {};
  userIds.forEach((id, index) => {
    statuses[id] = results[index][1] || 'offline';
  });
  return statuses;
}

// 心跳续期
async function heartbeat(userId: number): Promise<void> {
  await redis.expire(`user:status:${userId}`, 300);
}
```

#### 6.2.2 离线消息处理
```typescript
// 保存离线消息
async function saveOfflineMessage(userId: number, message: Message): Promise<void> {
  const messageKey = `message:${message.id}`;
  await redis.hmset(messageKey, {
    senderId: message.senderId,
    content: message.content,
    type: message.type,
    timestamp: message.timestamp
  });
  await redis.expire(messageKey, 7 * 24 * 3600);
  await redis.lpush(`offline:messages:${userId}`, message.id);
}

// 获取离线消息
async function getOfflineMessages(userId: number): Promise<Message[]> {
  const messageIds = await redis.lrange(`offline:messages:${userId}`, 0, -1);
  if (messageIds.length === 0) return [];
  
  const pipeline = redis.pipeline();
  messageIds.forEach(id => {
    pipeline.hgetall(`message:${id}`);
  });
  const results = await pipeline.exec();
  
  // 清空离线消息队列
  await redis.del(`offline:messages:${userId}`);
  
  return results.map(([err, data]) => data as Message);
}
```

#### 6.2.3 分布式锁实现
```typescript
class RedisLock {
  private redis: Redis;
  private lockKey: string;
  private lockValue: string;
  private ttl: number;

  constructor(redis: Redis, resource: string, ttl: number = 30) {
    this.redis = redis;
    this.lockKey = `lock:${resource}`;
    this.lockValue = uuidv4();
    this.ttl = ttl;
  }

  async acquire(): Promise<boolean> {
    const result = await this.redis.set(
      this.lockKey,
      this.lockValue,
      'EX',
      this.ttl,
      'NX'
    );
    return result === 'OK';
  }

  async release(): Promise<void> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await this.redis.eval(script, 1, this.lockKey, this.lockValue);
  }

  async extend(additionalTime: number): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;
    const result = await this.redis.eval(
      script,
      1,
      this.lockKey,
      this.lockValue,
      additionalTime
    );
    return result === 1;
  }
}

// 使用示例
async function sendMessageWithLock(message: Message): Promise<void> {
  const lock = new RedisLock(redis, `send:${message.id}`);
  
  if (await lock.acquire()) {
    try {
      await saveMessage(message);
      await deliverMessage(message);
    } finally {
      await lock.release();
    }
  } else {
    throw new Error('Message is being processed');
  }
}
```

#### 6.2.4 限流实现
```typescript
async function checkRateLimit(
  userId: number,
  action: string,
  limit: number,
  window: number = 60
): Promise<boolean> {
  const key = `ratelimit:${userId}:${action}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  return current <= limit;
}

// 使用示例
async function sendMessage(userId: number, message: Message): Promise<void> {
  if (!await checkRateLimit(userId, 'send_message', 100)) {
    throw new Error('Rate limit exceeded');
  }
  
  await saveMessage(message);
  await deliverMessage(message);
}
```

### 6.3 Redis高可用方案

#### 6.3.1 主从复制配置
```bash
# Master配置 (redis-master.conf)
bind 0.0.0.0
port 6379
requirepass your_password
masterauth your_password

# Slave配置 (redis-slave.conf)
bind 0.0.0.0
port 6380
replicaof redis-master 6379
requirepass your_password
masterauth your_password
replica-read-only yes
```

#### 6.3.2 哨兵配置
```bash
# sentinel.conf
port 26379
sentinel monitor mymaster redis-master 6379 2
sentinel auth-pass mymaster your_password
sentinel down-after-milliseconds mymaster 5000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 10000
```

#### 6.3.3 客户端连接配置
```typescript
import Redis from 'ioredis';

// 哨兵模式连接
const redis = new Redis({
  sentinels: [
    { host: 'sentinel1', port: 26379 },
    { host: 'sentinel2', port: 26379 },
    { host: 'sentinel3', port: 26379 }
  ],
  name: 'mymaster',
  password: 'your_password',
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// 集群模式连接
const cluster = new Redis.Cluster([
  { host: 'redis1', port: 6379 },
  { host: 'redis2', port: 6379 },
  { host: 'redis3', port: 6379 }
], {
  redisOptions: {
    password: 'your_password'
  }
});
```

---

## 7. 数据流设计

### 7.1 用户注册登录流程

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
│ 客户端  │         │ API服务 │         │  MySQL  │         │  Redis  │
└────┬────┘         └────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │                   │
     │ 1. POST /register │                   │                   │
     ├──────────────────>│                   │                   │
     │                   │ 2. 验证数据        │                   │
     │                   │                   │                   │
     │                   │ 3. 检查用户名      │                   │
     │                   ├──────────────────>│                   │
     │                   │ 4. 用户名可用      │                   │
     │                   │<──────────────────┤                   │
     │                   │                   │                   │
     │                   │ 5. 加密密码        │                   │
     │                   │                   │                   │
     │                   │ 6. 创建用户        │                   │
     │                   ├──────────────────>│                   │
     │                   │ 7. 返回用户ID      │                   │
     │                   │<──────────────────┤                   │
     │                   │                   │                   │
     │                   │ 8. 生成JWT Token   │                   │
     │                   │                   │                   │
     │                   │ 9. 保存会话        │                   │
     │                   ├──────────────────────────────────────>│
     │                   │ 10. 会话已保存     │                   │
     │                   │<──────────────────────────────────────┤
     │                   │                   │                   │
     │ 11. 返回Token     │                   │                   │
     │<──────────────────┤                   │                   │
     │                   │                   │                   │
```

### 7.2 消息发送流程

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 发送方  │    │ Socket  │    │  MySQL  │    │  Redis  │    │ 接收方  │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
     │              │              │              │              │
     │ 1. 发送消息   │              │              │              │
     ├─────────────>│              │              │              │
     │              │ 2. 验证权限   │              │              │
     │              │              │              │              │
     │              │ 3. 保存消息   │              │              │
     │              ├─────────────>│              │              │
     │              │ 4. 消息ID     │              │              │
     │              │<─────────────┤              │              │
     │              │              │              │              │
     │              │ 5. 检查接收方在线状态          │              │
     │              ├─────────────────────────────>│              │
     │              │ 6. 在线状态   │              │              │
     │              │<─────────────────────────────┤              │
     │              │              │              │              │
     │ 7. 发送确认   │              │              │              │
     │<─────────────┤              │              │              │
     │              │              │              │              │
     │              │ 8. 推送消息(如果在线)          │              │
     │              ├──────────────────────────────────────────>│
     │              │              │              │              │
     │              │ 9. 保存离线消息(如果离线)      │              │
     │              ├─────────────────────────────>│              │
     │              │              │              │              │
     │              │              │              │ 10. 已读回执  │
     │              │<──────────────────────────────────────────┤
     │              │              │              │              │
     │              │ 11. 更新已读状态              │              │
     │              ├─────────────>│              │              │
     │              │              │              │              │
     │ 12. 已读通知  │              │              │              │
     │<─────────────┤              │              │              │
     │              │              │              │              │
```

### 7.3 音视频通话流程

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 呼叫方  │    │ 信令服务 │    │  STUN   │    │ 被叫方  │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
     │              │              │              │
     │ 1. 发起通话   │              │              │
     ├─────────────>│              │              │
     │              │ 2. 来电通知   │              │
     │              ├─────────────────────────────>│
     │              │              │              │
     │              │ 3. 接受通话   │              │
     │              │<─────────────────────────────┤
     │ 4. 接受通知   │              │              │
     │<─────────────┤              │              │
     │              │              │              │
     │ 5. 创建Offer  │              │              │
     │              │              │              │
     │ 6. 发送Offer  │              │              │
     ├─────────────>│              │              │
     │              │ 7. 转发Offer  │              │
     │              ├─────────────────────────────>│
     │              │              │              │
     │              │              │ 8. 创建Answer │
     │              │              │              │
     │              │ 9. 发送Answer │              │
     │              │<─────────────────────────────┤
     │ 10. 转发Answer│              │              │
     │<─────────────┤              │              │
     │              │              │              │
     │ 11. ICE候选交换              │              │
     ├─────────────>├─────────────────────────────>│
     │<─────────────┤<─────────────────────────────┤
     │              │              │              │
     │ 12. STUN请求  │              │              │
     ├──────────────────────────────>              │
     │ 13. 公网地址  │              │              │
     │<──────────────────────────────              │
     │              │              │              │
     │ 14. P2P媒体流建立             │              │
     │<═════════════════════════════════════════════>│
     │              │              │              │
```

### 7.4 文件上传流程

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 客户端  │    │ API服务 │    │   OSS   │    │  MySQL  │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
     │              │              │              │
     │ 1. 请求上传凭证              │              │
     ├─────────────>│              │              │
     │              │ 2. 生成签名   │              │
     │              │              │              │
     │ 3. 返回凭证   │              │              │
     │<─────────────┤              │              │
     │              │              │              │
     │ 4. 直传文件   │              │              │
     ├──────────────────────────────>              │
     │              │              │              │
     │ 5. 上传进度   │              │              │
     │<──────────────────────────────              │
     │              │              │              │
     │ 6. 上传完成   │              │              │
     │<──────────────────────────────              │
     │              │              │              │
     │ 7. 通知服务器 │              │              │
     ├─────────────>│              │              │
     │              │ 8. 保存文件元数据            │
     │              ├─────────────────────────────>│
     │              │              │              │
     │ 9. 返回文件信息              │              │
     │<─────────────┤              │              │
     │              │              │              │
```

---

## 8. 项目目录结构

### 8.1 前端项目结构

```
web-chat-client/
├── public/                      # 静态资源
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── assets/                  # 资源文件
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   │       ├── global.css
│   │       └── variables.css
│   ├── components/              # 通用组件
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── Loading/
│   │   ├── chat/
│   │   │   ├── MessageBubble/
│   │   │   ├── MessageInput/
│   │   │   ├── MessageList/
│   │   │   └── EmojiPicker/
│   │   ├── user/
│   │   │   ├── UserCard/
│   │   │   ├── UserAvatar/
│   │   │   └── UserStatus/
│   │   └── call/
│   │       ├── VideoPlayer/
│   │       ├── AudioControls/
│   │       └── CallNotification/
│   ├── pages/                   # 页面组件
│   │   ├── Auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── Chat/
│   │   │   ├── index.tsx
│   │   │   ├── ChatList.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   └── ChatSidebar.tsx
│   │   ├── Friends/
│   │   │   ├── index.tsx
│   │   │   ├── FriendList.tsx
│   │   │   └── AddFriend.tsx
│   │   ├── Groups/
│   │   │   ├── index.tsx
│   │   │   ├── GroupList.tsx
│   │   │   └── CreateGroup.tsx
│   │   └── Call/
│   │       ├── VideoCall.tsx
│   │       └── AudioCall.tsx
│   ├── store/                   # Redux状态管理
│   │   ├── index.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── chatSlice.ts
│   │   │   ├── friendSlice.ts
│   │   │   ├── groupSlice.ts
│   │   │   ├── callSlice.ts
│   │   │   └── uiSlice.ts
│   │   └── middleware/
│   │       └── socketMiddleware.ts
│   ├── services/                # 服务层
│   │   ├── api/
│   │   │   ├── auth.api.ts
│   │   │   ├── user.api.ts
│   │   │   ├── friend.api.ts
│   │   │   ├── group.api.ts
│   │   │   ├── message.api.ts
│   │   │   └── file.api.ts
│   │   ├── socket/
│   │   │   ├── socket.service.ts
│   │   │   └── socketEvents.ts
│   │   └── webrtc/
│   │       ├── webrtc.service.ts
│   │       └── mediaDevices.ts
│   ├── hooks/                   # 自定义Hooks
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   ├── useWebRTC.ts
│   │   ├── useChat.ts
│   │   └── useNotification.ts
│   ├── utils/                   # 工具函数
│   │   ├── request.ts
│   │   ├── storage.ts
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── crypto.ts
│   ├── types/                   # TypeScript类型定义
│   │   ├── user.types.ts
│   │   ├── message.types.ts
│   │   ├── friend.types.ts
│   │   ├── group.types.ts
│   │   └── call.types.ts
│   ├── constants/               # 常量定义
│   │   ├── api.ts
│   │   ├── socket.ts
│   │   └── config.ts
│   ├── router/                  # 路由配置
│   │   └── index.tsx
│   ├── App.tsx                  # 根组件
│   └── main.tsx                 # 入口文件
├── .env.development             # 开发环境变量
├── .env.production              # 生产环境变量
├── .eslintrc.js                 # ESLint配置
├── .prettierrc                  # Prettier配置
├── tsconfig.json                # TypeScript配置
├── vite.config.ts               # Vite配置
└── package.json                 # 项目依赖
```

### 8.2 后端项目结构

```
web-chat-server/
├── src/
│   ├── config/                  # 配置文件
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── jwt.ts
│   │   └── oss.ts
│   ├── controllers/             # 控制器
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── friend.controller.ts
│   │   ├── group.controller.ts
│   │   ├── message.controller.ts
│   │   └── file.controller.ts
│   ├── services/                # 服务层
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── friend.service.ts
│   │   ├── group.service.ts
│   │   ├── message.service.ts
│   │   ├── file.service.ts
│   │   └── notification.service.ts
│   ├── models/                  # 数据模型
│   │   ├── user.model.ts
│   │   ├── friendship.model.ts
│   │   ├── group.model.ts
│   │   ├── groupMember.model.ts
│   │   ├── message.model.ts
│   │   ├── file.model.ts
│   │   └── call.model.ts
│   ├── routes/                  # 路由
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── friend.routes.ts
│   │   ├── group.routes.ts
│   │   ├── message.routes.ts
│   │   └── file.routes.ts
│   ├── middleware/              # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── logger.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── validation.middleware.ts
│   ├── socket/                  # Socket.IO
│   │   ├── index.ts
│   │   ├── handlers/
│   │   │   ├── message.handler.ts
│   │   │   ├── friend.handler.ts
│   │   │   ├── group.handler.ts
│   │   │   └── call.handler.ts
│   │   └── middleware/
│   │       └── auth.middleware.ts
│   ├── utils/                   # 工具函数
│   │   ├── jwt.util.ts
│   │   ├── bcrypt.util.ts
│   │   ├── redis.util.ts
│   │   ├── logger.util.ts
│   │   └── validator.util.ts
│   ├── types/                   # TypeScript类型
│   │   ├── user.types.ts
│   │   ├── message.types.ts
│   │   ├── socket.types.ts
│   │   └── express.d.ts
│   ├── constants/               # 常量
│   │   ├── errors.ts
│   │   ├── events.ts
│   │   └── status.ts
│   ├── database/                # 数据库
│   │   ├── connection.ts
│   │   └── migrations/
│   │       └── init.sql
│   ├── app.ts                   # Express应用
│   └── server.ts                # 服务器入口
├── tests/                       # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── logs/                        # 日志文件
├── .env.development             # 开发环境变量
├── .env.production              # 生产环境变量
├── .eslintrc.js                 # ESLint配置
├── .prettierrc                  # Prettier配置
├── tsconfig.json                # TypeScript配置
├── nodemon.json                 # Nodemon配置
└── package.json                 # 项目依赖
```

### 8.3 环境变量配置

#### 前端 (.env)
```bash
# API配置
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=ws://localhost:3000

# WebRTC配置
VITE_STUN_SERVER=stun:stun.l.google.com:19302
VITE_TURN_SERVER=turn:your-turn-server.com:3478
VITE_TURN_USERNAME=username
VITE_TURN_CREDENTIAL=password

# OSS配置
VITE_OSS_BUCKET=your-bucket
VITE_OSS_REGION=your-region
VITE_OSS_ENDPOINT=https://your-endpoint.com
```

#### 后端 (.env)
```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=web_chat
DB_USER=root
DB_PASSWORD=password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=password
REDIS_DB=0

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OSS配置
OSS_ACCESS_KEY_ID=your-access-key
OSS_ACCESS_KEY_SECRET=your-secret-key
OSS_BUCKET=your-bucket
OSS_REGION=your-region
OSS_ENDPOINT=https://your-endpoint.com

# 日志配置
LOG_LEVEL=info
LOG_DIR=./logs
```

---

## 总结

这个Web聊天系统架构设计涵盖了：

1. **系统整体架构**: 采用分层架构，包括客户端层、负载均衡层、应用服务层、缓存层、持久化层和存储层

2. **前端架构**: 基于React + Vite + TypeScript，使用Redux Toolkit进行状态管理，模块化设计

3. **后端架构**: 基于Node.js + Express，采用MVC模式，分层清晰，职责明确

4. **WebSocket通信**: 使用Socket.IO实现实时通信，支持集群部署，消息可靠性保证

5. **WebRTC音视频**: P2P通信架构，支持一对一通话和多人会议

6. **Redis应用**: 在线状态管理、会话管理、离线消息、分布式锁、限流控制

7. **数据流设计**: 详细的业务流程图，包括注册登录、消息发送、音视频通话、文件上传

8. **项目结构**: 清晰的目录组织，便于开发和维护

该架构具有以下特点：
- **可扩展性**: 支持水平扩展，可以轻松添加更多服务器
- **高可用性**: Redis主从+哨兵，MySQL主从复制
- **高性能**: Redis缓存，CDN加速，负载均衡
- **可维护性**: 模块化设计，代码结构清晰

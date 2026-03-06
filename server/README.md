# Web Chat Server

基于 Node.js + Express + TypeScript 的 IM 系统后端服务

## 技术栈

- **运行环境**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **实时通信**: Socket.IO
- **音视频**: WebRTC
- **认证**: JWT
- **密码加密**: bcrypt

## 项目结构

```
server/
├── src/
│   ├── config/          # 配置文件
│   │   └── database.ts  # 数据库连接配置
│   ├── controllers/     # 控制器层
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   ├── dao/            # 数据访问层
│   │   └── user.dao.ts
│   ├── middleware/     # 中间件
│   │   └── auth.middleware.ts
│   ├── routes/         # 路由
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   ├── services/       # 业务逻辑层
│   │   ├── auth.service.ts
│   │   └── user.service.ts
│   ├── types/          # 类型定义
│   │   ├── express.d.ts
│   │   └── user.types.ts
│   ├── utils/          # 工具函数
│   │   ├── bcrypt.util.ts
│   │   └── jwt.util.ts
│   ├── app.ts          # Express应用配置
│   └── server.ts       # 服务器启动文件
├── .env.example        # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=web_chat

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. 创建数据库

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE web_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入数据库结构
USE web_chat;
source ../docs/database.sql;
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动

### 5. 构建生产版本

```bash
npm run build
npm start
```

## API 文档

### 认证相关

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "nickname": "测试用户"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

### 用户相关

#### 获取当前用户信息
```
GET /api/users/me
Authorization: Bearer <token>
```

#### 更新用户信息
```
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "新昵称",
  "signature": "个性签名"
}
```

## 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建
npm run build

# 生产模式
npm start

# 类型检查
npm run type-check

# 代码格式化
npm run format
```

## 架构说明

### 分层架构

1. **Controller 层**: 处理 HTTP 请求和响应
2. **Service 层**: 业务逻辑处理
3. **DAO 层**: 数据库访问
4. **Middleware 层**: 请求拦截和处理

### 认证流程

1. 用户登录/注册
2. 服务器生成 JWT Token
3. 客户端在请求头中携带 Token
4. 服务器验证 Token 并提取用户信息

### 数据库设计

详见 `../docs/DATABASE_DESIGN.md`

## 环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0

## 注意事项

1. 生产环境请修改 JWT_SECRET 为强密码
2. 配置合适的 CORS 策略
3. 启用 HTTPS
4. 配置数据库连接池大小
5. 设置合理的请求限流

## 后续开发

- [ ] 好友系统
- [ ] 私聊功能
- [ ] 群聊功能
- [ ] Socket.IO 集成
- [ ] WebRTC 信令服务器
- [ ] Redis 缓存集成
- [ ] 文件上传
- [ ] 消息推送

## License

MIT

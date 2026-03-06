# Web Chat - 企业级IM即时通讯系统

一个功能完整的Web即时通讯系统，类似腾讯QQ，支持私聊、群聊、音视频通话等功能。

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Ant Design
- React Router
- Socket.IO Client
- Axios

### 后端
- Node.js 18+
- Express
- TypeScript
- Socket.IO
- MySQL 8.0
- Redis
- JWT认证
- bcrypt密码加密

### 实时通信
- Socket.IO（文字消息）
- WebRTC（音视频通话）

## 功能特性

- ✅ 用户注册登录
- ✅ 好友系统
- ✅ 私聊功能
- ✅ 群聊功能
- ✅ 1对1音视频通话
- ✅ 多人音视频会议
- ✅ 在线状态显示
- ✅ 离线消息
- ✅ 文件传输

## 项目结构

```
web-chat/
├── docs/                      # 文档
│   ├── ARCHITECTURE.md        # 系统架构设计
│   ├── DATABASE_DESIGN.md     # 数据库设计文档
│   ├── MYSQL_SETUP.md         # MySQL配置指南
│   ├── database.sql           # 数据库建表脚本
│   └── quick-setup.sql        # 快速配置脚本
├── server/                    # 后端服务
│   ├── src/
│   │   ├── config/           # 配置文件
│   │   ├── controllers/      # 控制器层
│   │   ├── dao/             # 数据访问层
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑层
│   │   ├── types/           # 类型定义
│   │   └── utils/           # 工具函数
│   └── README.md
└── client/                   # 前端应用
    ├── src/
    └── package.json
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/xiaoyutongxue11/web-chat.git
cd web-chat
```

### 2. 配置MySQL数据库

#### 方法一：使用Windows批处理脚本（最简单，推荐）

在项目根目录双击运行 `setup-database.bat`，或在命令提示符中执行：

```bash
setup-database.bat
```

脚本会自动完成：
1. 创建数据库和用户
2. 导入表结构
3. 验证配置

#### 方法二：使用命令行（CMD）

```bash
# 在项目根目录的CMD中执行
mysql -u root -p < docs\quick-setup.sql

# 然后导入表结构
mysql -u root -p web_chat < docs\database.sql
```

注意：PowerShell不支持 `<` 重定向，请使用CMD或批处理脚本

#### 方法二：手动配置

详细步骤请查看：[MySQL配置指南](docs/MYSQL_SETUP.md)

```bash
# 1. 登录MySQL
mysql -u root -p

# 2. 创建数据库
CREATE DATABASE web_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. 退出并导入SQL
exit
mysql -u root -p web_chat < docs/database.sql
```

### 3. 配置后端

```bash
cd server

# 复制环境变量文件
cp .env.example .env

# 编辑.env文件，配置数据库连接
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=web_chat
# JWT_SECRET=your_secret_key

# 安装依赖（已完成）
npm install

# 启动开发服务器
npm run dev
```

服务器将在 http://localhost:3000 启动

### 4. 配置前端

```bash
cd client

# 安装依赖（已完成）
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:5173 启动

## 开发命令

### 后端

```bash
cd server

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 生产模式运行
npm start

# 类型检查
npm run type-check
```

### 前端

```bash
cd client

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## API文档

### 认证接口

#### 用户注册
```http
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
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

### 用户接口

#### 获取当前用户信息
```http
GET /api/users/me
Authorization: Bearer <token>
```

#### 更新用户信息
```http
PUT /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "新昵称",
  "signature": "个性签名"
}
```

## 架构设计

### 系统架构

采用分层架构设计：

1. **表现层**：React前端应用
2. **网关层**：Nginx反向代理
3. **应用层**：Express API服务器
4. **业务层**：Service业务逻辑
5. **数据层**：MySQL数据库
6. **缓存层**：Redis缓存
7. **存储层**：文件存储服务

详细架构设计请查看：[系统架构文档](docs/ARCHITECTURE.md)

### 数据库设计

包含9个核心数据表：

- user（用户表）
- friend（好友关系表）
- friend_request（好友请求表）
- conversation（会话表）
- message（消息表）
- group_info（群组信息表）
- group_member（群成员表）
- file（文件表）
- user_status（用户状态表）

详细设计请查看：[数据库设计文档](docs/DATABASE_DESIGN.md)

## 环境要求

- Node.js >= 20.19.0（推荐使用 Node.js 20 LTS）
- MySQL >= 8.0
- Redis >= 6.0
- npm >= 9.0.0

**重要**：Vite 7+ 需要 Node.js 20.19+ 或 22.12+

## 开发进度

- [x] 项目初始化
- [x] 数据库设计
- [x] 后端基础架构
- [x] 用户认证系统
- [ ] 好友系统
- [ ] 私聊功能
- [ ] 群聊功能
- [ ] Socket.IO集成
- [ ] WebRTC音视频
- [ ] Redis缓存
- [ ] 文件上传
- [ ] 前端UI开发

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请提交Issue或联系项目维护者。

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！

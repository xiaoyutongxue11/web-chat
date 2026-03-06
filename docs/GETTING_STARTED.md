# Web Chat 快速启动指南

本指南将帮助你快速启动和运行 Web Chat 项目。

## 前置要求

确保你的系统已安装：

- Node.js >= 20.19.0（推荐使用 Node.js 20 LTS）
- MySQL >= 8.0
- npm >= 9.0.0

**重要**：Vite 7+ 需要 Node.js 20.19+ 或 22.12+。如果你使用的是 Node.js 18，请升级到 Node.js 20。

## 第一步：配置数据库

### 方法一：使用批处理脚本（推荐）

在项目根目录双击运行 `setup-database.bat`，或在CMD中执行：

```bash
setup-database.bat
```

输入MySQL root密码，脚本会自动：
1. 创建 `web_chat` 数据库
2. 创建专用用户 `webchat`
3. 导入所有数据表
4. 验证配置

### 方法二：手动配置

```bash
# 1. 登录MySQL
mysql -u root -p

# 2. 创建数据库
CREATE DATABASE web_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. 退出MySQL
exit

# 4. 导入SQL脚本
mysql -u root -p web_chat < docs\database.sql
```

详细配置请查看：[MySQL配置指南](MYSQL_SETUP.md)

## 第二步：配置后端

### 1. 安装依赖

后端依赖已经安装完成。如需重新安装：

```bash
cd server
npm install
```

### 2. 配置环境变量

编辑 `server/.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=web_chat

# JWT配置
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**重要**：请修改 `DB_PASSWORD` 为你的MySQL密码！

### 3. 启动后端服务器

```bash
cd server
npm run dev
```

成功启动后会看到：

```
✅ Database connected successfully
🚀 Server is running on port 3000
📍 Health check: http://localhost:3000/health
```

## 第三步：配置前端

### 1. 安装依赖

双击运行 `install-client-deps.bat`，或在CMD中执行：

```bash
cd client
npm install react-router-dom @types/react @types/react-dom axios
```

### 2. 启动前端开发服务器

```bash
cd client
npm run dev
```

前端将在 http://localhost:5173 启动

## 第四步：访问应用

打开浏览器访问：http://localhost:5173

### 注册新用户

1. 点击"立即注册"
2. 填写用户信息：
   - 用户名（3-20个字符）
   - 邮箱
   - 昵称（可选）
   - 密码（至少6个字符）
3. 点击"注册"按钮
4. 注册成功后自动跳转到登录页

### 登录

1. 输入用户名和密码
2. 点击"登录"按钮
3. 登录成功后跳转到首页

### 首页功能

- 查看个人信息
- 退出登录

## API 接口测试

### 使用 Postman 或 curl 测试

#### 1. 用户注册

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"123456\",\"nickname\":\"测试用户\"}"
```

#### 2. 用户登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"123456\"}"
```

返回示例：

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "nickname": "测试用户"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. 获取用户信息（需要token）

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 项目结构

```
web-chat/
├── server/                    # 后端服务
│   ├── src/
│   │   ├── config/           # 配置文件
│   │   ├── controllers/      # 控制器
│   │   ├── dao/             # 数据访问层
│   │   ├── middleware/      # 中间件
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑
│   │   ├── types/           # 类型定义
│   │   └── utils/           # 工具函数
│   ├── .env                 # 环境变量
│   └── package.json
│
├── client/                   # 前端应用
│   ├── src/
│   │   ├── api/            # API接口
│   │   ├── pages/          # 页面组件
│   │   ├── App.tsx         # 应用入口
│   │   └── main.tsx        # 主入口
│   └── package.json
│
├── docs/                     # 文档
│   ├── ARCHITECTURE.md       # 架构设计
│   ├── DATABASE_DESIGN.md    # 数据库设计
│   ├── MYSQL_SETUP.md        # MySQL配置
│   ├── GETTING_STARTED.md    # 快速开始
│   ├── database.sql          # 数据库脚本
│   └── quick-setup.sql       # 快速配置脚本
│
├── setup-database.bat        # 数据库配置脚本
├── install-client-deps.bat   # 前端依赖安装脚本
└── README.md                 # 项目说明
```

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

## 常见问题

### 1. 后端启动失败

**问题**：数据库连接失败

**解决方案**：
- 检查MySQL服务是否启动
- 确认 `server/.env` 中的数据库配置正确
- 确认数据库 `web_chat` 已创建

### 2. 前端无法连接后端

**问题**：API请求失败

**解决方案**：
- 确认后端服务器已启动（http://localhost:3000）
- 检查浏览器控制台的错误信息
- 确认 `client/src/api/request.ts` 中的 baseURL 正确

### 3. TypeScript 编译错误

**问题**：找不到模块声明

**解决方案**：
```bash
cd client
npm install @types/react @types/react-dom
```

### 4. 登录后token失效

**问题**：频繁要求重新登录

**解决方案**：
- 检查 `server/.env` 中的 `JWT_SECRET` 是否设置
- 确认 `JWT_EXPIRES_IN` 设置合理（默认7天）

## 下一步

现在你已经成功启动了 Web Chat 项目！

接下来可以：

1. 查看 [系统架构文档](ARCHITECTURE.md) 了解系统设计
2. 查看 [数据库设计文档](DATABASE_DESIGN.md) 了解数据结构
3. 开始开发新功能（好友系统、聊天功能等）

## 技术支持

如有问题，请：

1. 查看项目文档
2. 提交 Issue
3. 联系项目维护者

---

祝你使用愉快！🎉

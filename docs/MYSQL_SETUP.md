# MySQL 数据库配置指南

本指南将帮助你在Windows系统上创建MySQL数据库并导入SQL脚本。

## 前置条件

确保你已经安装了MySQL 8.0或更高版本。如果没有安装，请访问：
https://dev.mysql.com/downloads/mysql/

## 方法一：使用命令行（推荐）

### 1. 打开命令提示符（CMD）

按 `Win + R`，输入 `cmd`，按回车

### 2. 登录MySQL

```bash
mysql -u root -p
```

输入你的MySQL root密码

### 3. 创建数据库

```sql
CREATE DATABASE web_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 选择数据库

```sql
USE web_chat;
```

### 5. 导入SQL脚本

退出MySQL命令行（输入 `exit`），然后执行：

```bash
mysql -u root -p web_chat < "D:\web-chat\web-chat\docs\database.sql"
```

注意：请根据你的实际路径修改上面的路径。

### 6. 验证导入

重新登录MySQL：

```bash
mysql -u root -p
```

查看数据库和表：

```sql
USE web_chat;
SHOW TABLES;
```

你应该看到9个表：
- user
- friend
- friend_request
- conversation
- message
- group_info
- group_member
- file
- user_status

### 7. 查看表结构（可选）

```sql
DESC user;
DESC message;
```

## 方法二：使用MySQL Workbench（图形界面）

### 1. 打开MySQL Workbench

启动MySQL Workbench并连接到你的MySQL服务器

### 2. 创建数据库

点击工具栏的 SQL 图标，输入：

```sql
CREATE DATABASE web_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

点击闪电图标执行

### 3. 导入SQL脚本

1. 在左侧导航栏选择 `web_chat` 数据库
2. 点击菜单：`Server` → `Data Import`
3. 选择 `Import from Self-Contained File`
4. 点击 `...` 浏览并选择 `D:\web-chat\web-chat\docs\database.sql`
5. 在 `Default Target Schema` 选择 `web_chat`
6. 点击 `Start Import`

### 4. 验证导入

在左侧导航栏刷新 `web_chat` 数据库，展开 `Tables`，应该看到9个表。

## 方法三：使用Navicat（如果已安装）

### 1. 创建连接

打开Navicat，创建MySQL连接

### 2. 创建数据库

右键点击连接 → `新建数据库`
- 数据库名：web_chat
- 字符集：utf8mb4
- 排序规则：utf8mb4_unicode_ci

### 3. 导入SQL

1. 双击打开 `web_chat` 数据库
2. 点击菜单：`工具` → `执行SQL文件`
3. 选择 `D:\web-chat\web-chat\docs\database.sql`
4. 点击 `开始`

## 创建MySQL用户（可选但推荐）

为了安全，建议创建专门的数据库用户而不是使用root：

```sql
-- 创建用户
CREATE USER 'webchat'@'localhost' IDENTIFIED BY 'your_strong_password';

-- 授予权限
GRANT ALL PRIVILEGES ON web_chat.* TO 'webchat'@'localhost';

-- 刷新权限
FLUSH PRIVILEGES;
```

然后在 `server/.env` 文件中使用这个用户：

```env
DB_USER=webchat
DB_PASSWORD=your_strong_password
```

## 配置后端连接

编辑 `server/.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root              # 或你创建的用户名
DB_PASSWORD=your_password  # 你的MySQL密码
DB_NAME=web_chat
```

## 测试连接

启动后端服务器测试数据库连接：

```bash
cd server
npm run dev
```

如果看到 `✅ Database connected successfully`，说明连接成功！

## 常见问题

### 1. 找不到mysql命令

**解决方案**：将MySQL的bin目录添加到系统环境变量PATH中

通常路径为：`C:\Program Files\MySQL\MySQL Server 8.0\bin`

### 2. Access denied错误

**解决方案**：
- 检查用户名和密码是否正确
- 确保用户有足够的权限

### 3. 字符集问题

**解决方案**：
确保创建数据库时指定了正确的字符集：
```sql
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
```

### 4. 连接超时

**解决方案**：
- 检查MySQL服务是否启动
- 检查防火墙设置
- 确认端口3306未被占用

## 快速命令参考

```bash
# 登录MySQL
mysql -u root -p

# 查看所有数据库
SHOW DATABASES;

# 选择数据库
USE web_chat;

# 查看所有表
SHOW TABLES;

# 查看表结构
DESC table_name;

# 查看表数据
SELECT * FROM user LIMIT 10;

# 删除数据库（谨慎使用）
DROP DATABASE web_chat;
```

## 下一步

数据库配置完成后，你可以：

1. 启动后端服务器：`cd server && npm run dev`
2. 测试API接口
3. 开始前端开发

如有问题，请查看 `server/README.md` 获取更多帮助。

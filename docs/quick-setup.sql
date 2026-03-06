-- Web Chat 数据库快速配置脚本
-- 使用方法：mysql -u root -p < quick-setup.sql

-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS web_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 创建专用用户（可选，推荐）
CREATE USER IF NOT EXISTS 'webchat'@'localhost' IDENTIFIED BY 'WebChat@2024';

-- 3. 授予权限
GRANT ALL PRIVILEGES ON web_chat.* TO 'webchat'@'localhost';
FLUSH PRIVILEGES;

-- 4. 使用数据库
USE web_chat;

-- 提示信息
SELECT '✅ 数据库 web_chat 创建成功！' AS status;
SELECT '✅ 用户 webchat 创建成功！' AS status;
SELECT '📝 下一步：导入表结构' AS next_step;
SELECT 'mysql -u root -p web_chat < database.sql' AS command;

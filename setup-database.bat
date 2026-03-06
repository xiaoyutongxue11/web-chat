@echo off
chcp 65001 >nul
echo ========================================
echo Web Chat 数据库配置脚本
echo ========================================
echo.

echo 请输入MySQL root密码：
set /p password=

echo.
echo [1/3] 正在创建数据库和用户...
mysql -u root -p%password% < docs\quick-setup.sql

if %errorlevel% neq 0 (
    echo ❌ 创建数据库失败，请检查MySQL是否已启动
    pause
    exit /b 1
)

echo ✅ 数据库创建成功
echo.

echo [2/3] 正在导入表结构...
mysql -u root -p%password% web_chat < docs\database.sql

if %errorlevel% neq 0 (
    echo ❌ 导入表结构失败
    pause
    exit /b 1
)

echo ✅ 表结构导入成功
echo.

echo [3/3] 验证数据库...
mysql -u root -p%password% -e "USE web_chat; SHOW TABLES;"

echo.
echo ========================================
echo ✅ 数据库配置完成！
echo ========================================
echo.
echo 下一步：
echo 1. 编辑 server\.env 文件，配置数据库密码
echo 2. 运行 cd server
echo 3. 运行 npm run dev 启动后端服务器
echo.
pause

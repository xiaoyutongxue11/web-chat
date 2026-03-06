@echo off
chcp 65001 >nul
echo ========================================
echo 正在安装前端依赖...
echo ========================================
echo.

cd client

echo [1/3] 清理旧的依赖...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ 已删除旧的 node_modules
)

if exist package-lock.json (
    del package-lock.json
    echo ✅ 已删除旧的 package-lock.json
)

echo.
echo [2/3] 安装依赖包...
npm install

if %errorlevel% neq 0 (
    echo.
    echo ❌ 依赖安装失败
    echo.
    echo 可能的原因：
    echo 1. 网络连接问题
    echo 2. npm 配置问题
    echo.
    echo 建议：
    echo 1. 检查网络连接
    echo 2. 尝试使用淘宝镜像：npm config set registry https://registry.npmmirror.com
    echo 3. 手动执行：cd client && npm install
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] 验证安装...
if exist node_modules\react (
    echo ✅ React 安装成功
) else (
    echo ❌ React 安装失败
)

if exist node_modules\vite (
    echo ✅ Vite 安装成功
) else (
    echo ❌ Vite 安装失败
)

if exist node_modules\antd (
    echo ✅ Ant Design 安装成功
) else (
    echo ❌ Ant Design 安装失败
)

echo.
echo ========================================
echo ✅ 前端依赖安装完成！
echo ========================================
echo.
echo 下一步：
echo 1. 运行 cd client
echo 2. 运行 npm run dev 启动前端服务器
echo.
pause

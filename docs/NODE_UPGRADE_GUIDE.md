# Node.js 升级指南 - 从 18 升级到 20

本指南将帮助你在 Windows 系统上将 Node.js 从 18 升级到 20。

## 为什么需要升级？

Vite 7+ 需要 Node.js 20.19+ 或 22.12+。如果你使用 Node.js 18，前端将无法启动。

## 方法一：使用 nvm-windows（强烈推荐）⭐

nvm-windows 是 Node.js 版本管理工具，可以轻松管理和切换不同版本。

### 优点
- ✅ 可以同时保留多个 Node.js 版本
- ✅ 随时切换版本，不需要卸载重装
- ✅ 不同项目可以使用不同版本
- ✅ 方便测试和开发

### 安装步骤

#### 方式 1：使用安装程序（推荐）

1. 访问：https://github.com/coreybutler/nvm-windows/releases
2. 下载最新的 `nvm-setup.exe`（通常是第一个文件）
3. 双击 `nvm-setup.exe`
4. 按照安装向导完成安装
5. 默认安装路径即可

#### 方式 2：使用 Chocolatey 安装

如果你已经安装了 Chocolatey：

```bash
# 以管理员身份打开 PowerShell
choco install nvm

# 验证安装
nvm version
```

#### 方式 3：使用 Scoop 安装

如果你已经安装了 Scoop：

```bash
# 在 PowerShell 中执行
scoop install nvm

# 验证安装
nvm version
```

#### 方式 4：使用 winget 安装（Windows 10/11）

Windows 10/11 自带的包管理器：

```bash
# 在 PowerShell 或 CMD 中执行
winget install CoreyButler.NVMforWindows

# 验证安装
nvm version
```

#### 方式 5：手动安装（不推荐）

1. 下载 `nvm-noinstall.zip`
2. 解压到指定目录（如 `C:\nvm`）
3. 手动配置环境变量：
   - 添加 `NVM_HOME` = `C:\nvm`
   - 添加 `NVM_SYMLINK` = `C:\Program Files\nodejs`
   - 在 `Path` 中添加 `%NVM_HOME%` 和 `%NVM_SYMLINK%`
4. 重启命令提示符

#### 3. 验证安装

打开新的命令提示符（CMD）或 PowerShell：

```bash
nvm version
```

如果显示版本号，说明安装成功。

#### 4. 安装 Node.js 20

```bash
# 查看可安装的版本列表
nvm list available

# 安装 Node.js 20 LTS（推荐）
nvm install 20.19.0

# 或者安装最新的 20.x 版本
nvm install 20
```

#### 5. 切换到 Node.js 20

```bash
# 使用 Node.js 20
nvm use 20.19.0

# 或者
nvm use 20
```

**重要提示**：
- 如果提示"Access is denied"，请以**管理员身份**运行命令提示符
- 每次打开新的命令提示符窗口都需要运行 `nvm use 20`
- 要避免每次都手动切换，请设置默认版本（见下一步）

#### 6. 验证版本

```bash
node -v
# 应该显示：v20.19.0

npm -v
# 应该显示 npm 版本（通常是 10.x）
```

#### 7. 设置默认版本（可选）

```bash
# 设置 Node.js 20 为默认版本
nvm alias default 20.19.0
```

### 常用 nvm 命令

```bash
# 查看已安装的版本
nvm list

# 查看可安装的版本
nvm list available

# 安装指定版本
nvm install 20.19.0

# 切换版本
nvm use 20.19.0

# 卸载指定版本
nvm uninstall 18.17.0

# 查看当前使用的版本
nvm current
```

## 方法二：直接下载安装 Node.js 20

如果你不需要管理多个版本，可以直接安装。

### 步骤

#### 1. 卸载当前的 Node.js 18

- 按 `Win + R`，输入 `appwiz.cpl`，回车
- 找到 "Node.js"
- 右键点击，选择"卸载"
- 按照提示完成卸载

#### 2. 下载 Node.js 20

访问 Node.js 官网：https://nodejs.org/

或直接下载 Windows 安装包：
- 64位：https://nodejs.org/dist/v20.19.0/node-v20.19.0-x64.msi
- 32位：https://nodejs.org/dist/v20.19.0/node-v20.19.0-x86.msi

#### 3. 安装 Node.js 20

- 双击下载的 `.msi` 文件
- 点击 "Next"
- 接受许可协议
- 选择安装路径（默认即可）
- 选择组件（默认全选）
- 勾选 "Automatically install the necessary tools"（可选）
- 点击 "Install"
- 等待安装完成

#### 4. 重启命令提示符

关闭所有打开的命令提示符或 PowerShell 窗口，然后重新打开。

#### 5. 验证安装

```bash
node -v
# 应该显示：v20.19.0

npm -v
# 应该显示 npm 版本
```

## 方法三：使用 Chocolatey

如果你已经安装了 Chocolatey 包管理器。

### 步骤

```bash
# 以管理员身份打开 PowerShell

# 卸载旧版本
choco uninstall nodejs

# 安装 Node.js 20 LTS
choco install nodejs-lts --version=20.19.0

# 验证
node -v
```

## 升级完成后的操作

### 1. 验证 Node.js 版本

```bash
node -v
# 应该显示 v20.x.x
```

### 2. 清理并重新安装项目依赖

```bash
# 进入项目目录
cd d:\web-chat\web-chat

# 清理前端依赖
cd client
rmdir /s /q node_modules
del package-lock.json

# 重新安装
npm install

# 启动前端
npm run dev
```

### 3. 清理后端依赖（可选）

```bash
# 进入后端目录
cd ..\server
rmdir /s /q node_modules
del package-lock.json

# 重新安装
npm install

# 启动后端
npm run dev
```

## 常见问题

### Q1: nvm 命令不识别

**原因**：环境变量未生效

**解决方案**：
1. 重启命令提示符或 PowerShell
2. 如果还不行，重启电脑
3. 检查环境变量中是否有 nvm 的路径

### Q2: 切换版本后 node 命令不识别

**原因**：需要重新打开命令提示符

**解决方案**：
1. 关闭所有命令提示符窗口
2. 重新打开
3. 运行 `nvm use 20.19.0`

### Q3: npm install 报错

**原因**：缓存问题

**解决方案**：
```bash
# 清理 npm 缓存
npm cache clean --force

# 重新安装
npm install
```

### Q4: 权限错误

**原因**：需要管理员权限

**解决方案**：
1. 右键点击命令提示符
2. 选择"以管理员身份运行"
3. 重新执行命令

## 推荐配置

安装完 Node.js 20 后，建议配置：

```bash
# 设置 npm 镜像为淘宝镜像（加速下载）
npm config set registry https://registry.npmmirror.com

# 查看配置
npm config get registry

# 如果需要恢复官方镜像
npm config set registry https://registry.npmjs.org
```

## 验证清单

升级完成后，请确认：

- [ ] `node -v` 显示 v20.x.x
- [ ] `npm -v` 显示版本号
- [ ] 前端项目可以正常启动（`npm run dev`）
- [ ] 后端项目可以正常启动（`npm run dev`）

## 需要帮助？

如果遇到问题：

1. 查看本文档的"常见问题"部分
2. 查看 [快速启动指南](GETTING_STARTED.md)
3. 提交 Issue

---

升级完成后，你就可以使用最新的 Vite 7 和其他需要 Node.js 20 的工具了！🎉

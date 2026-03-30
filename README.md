# 好感度管理系统

一款手机好感度管理 App，支持创建人物档案、快捷调整好感度、记录事件历史。后台部署在自有云服务器上。

## 项目结构

```
favorabilityApp/
├── server/   # 后台服务（Node.js + Express + SQLite）
└── app/      # 移动端 App（React Native + Expo）
```

## 后台服务

### 环境要求

- Node.js >= 18.0.0
- npm

### 本地开发

```bash
cd server
npm install
npm run dev        # 启动开发服务器（热重载），默认端口 3000
```

### 运行测试

```bash
cd server
npm test
```

### 生产部署

**1. 编译**

```bash
cd server
npm install
npm run build      # 编译 TypeScript 到 dist/
```

**2. 启动服务**

```bash
npm start          # 运行 dist/index.js
```

支持通过环境变量配置端口：

```bash
PORT=8080 npm start
```

数据库文件默认保存在 `server/data/affinity.db`，首次启动时自动创建。

**3. 使用 PM2 守护进程（推荐）**

```bash
npm install -g pm2
pm2 start dist/index.js --name affinity-server
pm2 save
pm2 startup        # 设置开机自启
```

**4. Nginx 反向代理（可选）**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 移动端 App

### 环境要求

- Node.js >= 18.0.0
- npm
- [Expo Go](https://expo.dev/go) App（手机端预览）或 Android Studio / Xcode（模拟器）

### 配置后台地址

在 `app/` 目录下创建 `.env` 文件：

```env
EXPO_PUBLIC_API_URL=http://your-server-ip:3000
```

> 本地开发时将 `your-server-ip` 替换为电脑的局域网 IP（如 `192.168.1.100`），不能使用 `localhost`（手机无法访问）。

### 安装依赖

```bash
cd app
npm install
```

### 启动开发预览

```bash
npm start          # 启动 Expo 开发服务器
npm run android    # 在 Android 模拟器/设备上运行
npm run ios        # 在 iOS 模拟器/设备上运行（需要 macOS）
```

扫描终端中的二维码，用 Expo Go App 在手机上预览。

### 打包发布

**Android APK**

```bash
npx expo build:android    # 云端构建（需要 Expo 账号）
# 或使用本地构建：
npx expo run:android --variant release
```

**iOS IPA**

```bash
npx expo build:ios        # 云端构建（需要 Apple 开发者账号）
```

> 推荐使用 [EAS Build](https://docs.expo.dev/build/introduction/) 进行生产构建：
> ```bash
> npm install -g eas-cli
> eas build --platform android
> eas build --platform ios
> ```

---

## API 接口

后台服务提供以下 RESTful API：

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/characters` | 获取人物列表（按好感度降序） |
| POST | `/api/characters` | 创建人物 |
| GET | `/api/characters/:id` | 获取人物详情 |
| PUT | `/api/characters/:id` | 更新人物信息 |
| DELETE | `/api/characters/:id` | 删除人物 |
| POST | `/api/characters/:id/affinity` | 调整好感度 |
| GET | `/api/characters/:id/events` | 获取好感度事件列表 |

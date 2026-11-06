# 键走如飞 · KeyFly

LINUX DO 社区微应用：中英文打字练习与多人实时竞速。

## 开发

Node.js 24+，使用 PowerShell 7：

```powershell
npm ci
npm run dev
```

`npm run check` 类型检查，`npm test` 核心回归，`npm run build` 生成单 IIFE/CSS。官方示例采用 Bun 1.4.3+；本项目使用兼容官方 SDK 的 Node 24 工具链。

## 社区包

复制 `.env.example` 为 `.env`，填入自己运营的 `KEYFLY_WSS_URL` 后运行 `npm run package`。应用 ID 已设置为用户提供的值。运行包为 `dist/package/app.zip`，仅包含规范中的五个基础文件；无需也不得上传整个项目或环境配置。

指南：[开发规范](https://github.com/linux-do/mapp-developer-guide/blob/master/docs/developer-guide.md)、[服务端鉴权](https://github.com/linux-do/mapp-developer-guide/blob/master/docs/server-auth.md)。SDK 来源记录见 `vendor/README.md`。

## 里程碑

1. 工程、官方 SDK、主题和发布打包。
2. 中英文练习、输入法兼容、计时挑战与个人记录。
3. 多人实时房间、平台 JWT 鉴权、断线恢复和部署说明。

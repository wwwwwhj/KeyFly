# 键走如飞 · KeyFly

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
用户同意推荐方案：React、TypeScript、Vite；使用社区官方 SDK 打包与接入。多人实时竞速需要自有 WebSocket 服务。

## Users
社区中希望练习打字、与其他成员实时竞速的用户。

## Product Purpose
从练习到比赛，提供准确、直接的输入反馈。首版包含中英文练习、计时挑战、个人记录与多人实时房间。

## Operating Context
作为 LINUX DO 社区微应用运行；本地开发可独立预览。用户选择专注练习的使用体验：宽阔题面，竞速时显示选手进度。

## Capabilities and Constraints
社区 SDK 提供用户、主题、浏览器存储与鉴权网络。运行包使用单 IIFE、单 CSS 与 HTML 正文片段，不加载外部脚本和字体。服务端验证平台 JWT。首版后端部署域名尚未提供。

## Brand Commitments
中文名「键走如飞」，英文名「KeyFly」。

## Evidence on Hand
开发规范：https://github.com/linux-do/mapp-developer-guide 。旧版参考：E:/codespace/self/tauri-test/Universal-Toolbox/src/modules/typing，仅参考交互与规则。

## Product Principles
先提供可操作的练习题面；真实选手与真实成绩；中文输入法可用；失败和断线有可恢复的明确反馈。

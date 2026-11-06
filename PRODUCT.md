# 键走如飞 · KeyFly

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
用户同意推荐方案：React、TypeScript、Vite；使用社区官方 SDK 打包与接入。

## Users
社区中希望练习打字、提高速度与准确率的用户。

## Product Purpose
提供准确、直接的输入反馈。首版包含中英文练习、计时挑战、个人记录与本地成绩排行。用户已取消多人实时通信；社区共享榜暂未接入。

## Operating Context
作为 LINUX DO 社区微应用运行，以 app.zip 上传；本地开发可独立预览。用户选择专注练习的使用体验：宽阔题面。

## Capabilities and Constraints
社区 SDK 提供用户、主题与浏览器存储。运行包使用单 IIFE、单 CSS 与 HTML 正文片段，不加载外部脚本和字体，不申请网络权限。自动取得已登录社区用户资料；本地记录不跨设备、不与其他用户共享。

## Brand Commitments
中文名「键走如飞」，英文名「KeyFly」。
用户明确指定键盘反馈为重中之重：必须有跟手的按键反馈，打字越快，特效和动效越强。速度分级、光波、粒子拖尾、流光属于核心功能；输入顺畅、错误可辨与减少动态效果不可牺牲。

## Evidence on Hand
开发规范：https://github.com/linux-do/mapp-developer-guide 。旧版参考：E:/codespace/self/tauri-test/Universal-Toolbox/src/modules/typing，仅参考交互与规则。

## Product Principles
先提供可操作的练习题面；真实成绩；中文输入法可用；保存失败有明确反馈，不伪造社区数据。

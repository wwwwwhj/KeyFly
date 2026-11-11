# 官方 SDK

sdk/ 原样取自 [linux-do/mapp-developer-guide](https://github.com/linux-do/mapp-developer-guide/tree/ae0b523297a8c25314304f2cd92270badc0ac629/sdk)，固定提交 `ae0b523297a8c25314304f2cd92270badc0ac629`（2026-11-11，包版本 0.3.0；2026-11-12 同步）。全部 22 个文件的 Git blob SHA 与上游一致，保留官方接口、类型与打包器，不自行重写协议。

官方示例推荐 Bun 1.4.3+。本项目采用 Node 24 与 npm，SDK 使用标准 Node API；通过构建、打包及鉴权测试验证兼容性。发布前仍须在社区 sandbox 验证实际运行。

此次升级未增加应用权限。用户、主题与存储接口继续兼容；存储由平台容器的 IndexedDB 代管，应用仍按账号 ID 分键。头像 Blob URL 仅用于本次显示，不写入成绩。新版网络、媒体、设备、通知等可选能力未接入，避免干扰打字或增加权限。

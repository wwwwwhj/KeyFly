# 本地验收记录

## 2026-11-12 · 桌面专注体验

- TypeScript、5 项核心规则与生产构建通过。
- Playwright 桌面回归通过：校验后单次光波及错误色、Home/方向键/选区替换、可见选区、尾部保留、暂停/恢复焦点、极速粒子、设置开关、深色与减少动态效果；无页面异常。
- 检查 1280×720、1440×900、1920×1080，题面光标居中、无横向溢出，紧凑桌面完整显示键盘；已查看浅色、紧凑和深色截图。
- 设置与说明移入键盘下方折叠区，移除重复图例、题目标题和页脚标语；释义与原词保留，当前词释义加深。
- 浏览器回归源码：tests/desktop.check.js。截图：output/playwright/focus-*.png（不进入 Git）。最初采样按时间戳分帧会把连续回调误归一帧，改为回调序号后用全新浏览器重试通过。

本轮未扩展或测试移动端，未上传真实社区 sandbox；真实输入法与低端设备帧率仍需现场验证。

## 2026-11-12 · 官方 SDK 0.3.0

- 固定上游 ae0b523297a8c25314304f2cd92270badc0ac629，22 个 SDK 文件逐一通过 Git blob SHA 校验，package-lock.json 同步 0.3.0。
- npm run package 通过，app.zip 为 84,317 字节；ZIP 根目录严格为五个规定文件，权限仍为 user.read、theme.read、storage.read、storage.write。
- tests/production.check.js 通过：加载实际生产 IIFE，禁止原生 localStorage，模拟 SDK 用户、主题订阅、生命周期、账号分键存储、30 秒截止且不重复保存、访客及存储拒绝降级，无页面异常。
- 首次计时探针在应用挂载后才安装虚拟时钟，未接管既有 interval；调整为挂载前安装并等待渲染及保存后，用新浏览器重试通过。
- 新版可选网络、媒体、设备、通知等能力与当前打字主流程无直接必要关系，未额外接入或申请权限。真实社区 sandbox 尚未验证。

## 早期验收

日期：2026-11-06。环境：Windows 11 / Node 24.19.0 / Vite 7.3.7 / Playwright Chromium。

## 已完成

- TypeScript 检查与生产 IIFE/CSS 构建成功。
- 官方 SDK pack 生成 app.zip，根目录只有 manifest.json、index.html、app.js、app.css、strings.json；应用 ID 与用户提供值一致。
- 4 项核心回归：中文组合输入与中间纠错计数；暂停/截止计时；Shift 键位和热度升级/衰减；记录校验、4 KiB 存储预算与排行分组。
- 浏览器交互：模拟 compositionstart/input/compositionend，纠错与全文完成、成绩排行、刷新恢复；桌面 1440px 和窄屏 390px，无横向溢出；深色与减少动态效果。
- 键盘：正确/错键反馈，下一键和 Shift 提示，快速输入达到第 4 级，Canvas 确有非透明粒子绘制，关闭特效与减少动态效果时停止运动，重置后热度归零，切页暂停并保留输入。
- 生产脚本以模拟 SDK 运行：自动用户信息、主题订阅、按用户 ID 保存、真实 DOM 挂载后 lifecycle.ready、30 秒准确截止、访客/存储拒绝降级。测试中原生 localStorage 被禁止访问。
- 生产 bundle 静态检查：未发现开发存储 key 前缀、WebSocket 或未替换的 process.env。
- 已查看实际桌面、窄屏、暗色和高速键盘截图。设计检测器只报导航下划线误报；实际导航圆角为 0。

## 边界

未上传真实社区 sandbox，未完成权限审批或发布；真实 Windows 中文输入法候选窗口、社区加载器兼容性与低端设备帧率仍需现场验证。当前为个人本地榜，不是跨用户共享榜。

独立只读复审子代理连续两次无法正常接收任务，未产生审查结果；由主代理直接检查收尾，不能视为独立复审通过。

浏览器验证脚本和截图保存在本地 output/playwright/（不进入 Git 或 app.zip）。核心回归源码在 tests/typing.test.ts。

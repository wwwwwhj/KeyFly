# 键走如飞 · KeyFly

LINUX DO 社区微应用。核心是跟手的键盘反馈：键程回弹、对错亮键、下一键提示，以及随敲击速度升级的光波、粒子拖尾和流光。

## 当前功能

- 英文原创短文；30 / 60 / 120 秒和全文练习，以分段按钮切换时长。
- 题面与输入合为单行：未输入文字浅色、已正确输入文字深色；输入、退格和方向键编辑都保持真实光标居中，选区同步高亮。
- 鼠标点击、Shift 点击和拖选按可见字符准确定位；拖选时题面固定，释放后光标重新居中。
- 每个英文单词顶部附内置中文释义，颜色柔和，字号比英文小 2px；释义与单词同步滚动，不参与输入或计分。
- 屏幕键盘：准备、节奏、疾速、超频四级反馈；可隐藏键盘或关闭速度特效，支持系统减少动态效果。
- 实时速度、准确率、完成进度；切到后台或查看排行时暂停并保留输入。
- 最近 20 次练习记录与英文个人排行，以弹窗展示，按设定时长分组；旧中文记录仍可查看。
- 自动获取社区当前用户的名称和头像，跟随社区深浅主题。访客也可练习。
- 键盘设置与操作说明折叠在练习区下方；桌面 1280×720 起可同时查看题面和完整键盘。

用户已取消多人实时通信。当前版本不包含共享社区排行榜，不申请网络权限，不需要部署服务器。个人记录仅存于当前浏览器，按账号 ID 分键，不跨设备同步；最近 20 次以外的记录不保留。

## 本地开发

需要 Node.js 24+，PowerShell 7：

```powershell
npm ci
npm run dev
```

打开 http://127.0.0.1:5173 。本地开发使用浏览器存储，不伪造社区用户。正式构建会移除本地存储分支，只调用社区 SDK。

```powershell
npm test           # 5 项核心规则回归
npm run check      # TypeScript 检查
npm run package    # 类型检查、Vite 构建、官方 SDK 打包
```

桌面浏览器回归使用已安装的 Playwright CLI：打开开发地址后运行 `playwright-cli run-code --filename tests/desktop.check.js`。覆盖光波次数与对错颜色、真实选区编辑、暂停恢复、速度分级、设置、桌面布局、深色与减少动态效果；截图写入 output/playwright/。

打包后运行 `playwright-cli run-code --filename tests/production.check.js`，验证实际生产 IIFE 的 SDK 用户、主题、存储、生命周期、截止计时与权限降级；此项使用模拟 SDK，不替代社区沙箱验收。

官方示例推荐 Bun 1.4.3+；本项目使用 Node 24 与 npm，SDK 打包器使用标准 Node API。依赖由 package-lock.json 固定，官方 SDK 0.3.0 源码与类型保存在 vendor/sdk，并固定上游提交；不额外申请新版设备、网络或通知权限。

## 上传社区

应用 ID 已设为 `01a1afee-b107-7509-aca8-736dfe02f6cc`。

运行 `npm run package` 后上传 **dist/package/app.zip**，无需上传源码、package.json 或 .env。ZIP 根目录严格包含五个文件：manifest.json、index.html、app.js、app.css、strings.json。HTML 为正文片段，JS 为单 IIFE，不加载外部代码或字体。

`.env` 可选；需要改版本时可复制 `.env.example`，或在 PowerShell 中设置 `$env:MINI_APP_VERSION='0.1.1'` 后重新打包。`MINI_APP_DEBUG=1` 会生成含内联 source map 的调试包；提审前清除该变量后重新打包。

提审说明与沙箱验收步骤见 [docs/submission.md](docs/submission.md)，图标为 [docs/icon.png](docs/icon.png)。本地通过不代表已通过社区沙箱或审核。

## 规则

英文 WPM = 当前正确字符数 / 用时分钟数 / 5。准确率按累计输入尝试计算，退格修正不会抹除原错误。全文完全正确才提前完成；计时模式到点结束。粘贴和拖入文字被禁用。

键盘热度取最近 2.4 秒的实体击键密度，长按自动重复不增加热度；它只控制视觉效果，不参与成绩计算。粒子最多 180 个、光波最多 12 个，画布像素比上限 2；停止输入后衰减，隐藏或关闭时取消动画。

## 来源

- [社区开发规范](https://github.com/linux-do/mapp-developer-guide/blob/master/docs/developer-guide.md)
- [SDK API 与存储限制](https://github.com/linux-do/mapp-developer-guide/blob/master/sdk/README.md)
- 官方 SDK 来源见 [vendor/README.md](vendor/README.md)。
- 旧版参考：Universal-Toolbox/src/modules/typing 的键位、纠错和计时交互；本项目移除了 Tauri 依赖。

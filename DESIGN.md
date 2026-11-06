---
name: 键走如飞 KeyFly
description: 以键盘反馈为核心的打字练习工作台
colors:
  primary: "#21684b"
  ground: "#edf3f0"
  surface: "#fcfefd"
  ink: "#203b32"
  muted: "#566e63"
  line: "#cbd9d0"
  error: "#a43243"
  keyboard: "#13291f"
  spark: "#a6e7ba"
  fast: "#68e8e4"
  overdrive: "#f6d879"
typography:
  body:
    fontFamily: "Segoe UI, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "16px"
  passage:
    fontFamily: "Cascadia Code, Consolas, Microsoft YaHei, monospace"
    fontSize: "25px"
    lineHeight: 1.65
rounded:
  control: "8px"
  surface: "16px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "9px 16px"
---

# Design System: 键走如飞

## Overview
以专注练习为基础，以跟手的键盘反馈为核心。视觉承诺来自用户：键盘反馈是重中之重，速度越快，特效越强。深绿键盘区提供稳定的视觉承载，练习区跟随平台深浅主题。

## Colors
绿色承担品牌、正确状态与选中状态；红色只表示输入错误。键盘特效从薄荷绿过渡到青色、金色，颜色等级代表击键热度，不代表成绩。暗色主题由 src/styles.css 中 data-theme 变量覆盖，错误依然保留红色与下划线双重提示。

## Typography
界面使用系统字体，满足微应用不加载外部字体的限制。题面用等宽字体呈现字符与空格，中文回退到系统中文字体。速度、时间和表格使用等宽数字。

## Layout
单列工作台，最大内容宽 1120px。上方是语言、时长、实时统计与两行滚动题面，下方为输入区和完整实体键盘映射。导航保持常规按钮结构。700px 以下缩小键帽，键盘只做反馈展示，不承担触摸输入任务。

## Elevation & Depth
普通内容用细边界，不叠加阴影。键盘独立抬起，键帽下缘与按下位移提供键程感；高速亮键、光波和粒子由真实击键触发。

## Shapes
输入与按钮为 8px 圆角，工作区为 16px。键帽为 5px，移动端 4px。导航下划线不是圆角卡片强调边。

## Components
- 题面：正确字符绿色、错误字符红色加下划线，光标与下一键提示同步。
- 屏幕键盘：按下 2px 位移，释放采用回弹曲线；空闲时没有自行播放的粒子。最近 2.4 秒实体击键决定四级热度，长按重复不刷热度。
- 速度特效：有上限的 Canvas 粒子与扩散椭圆光波；高速出现跨键流光。减少动态效果时保留静态对错反馈，禁用运动。
- 记录：本地个人成绩表格，按语言与设定时长过滤，不添加虚构用户或榜单。

## Do's and Don'ts
保持输入、统计与动画解耦；核心交互必须支持键盘和中文输入法。任何新增效果都需要在隐藏、暂停、重置、卸载与减少动态效果时正确停止。不要为了特效打断输入焦点，不要把本地成绩称为社区排名。

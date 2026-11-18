# 环京雪况 · 效果图 v1

这是正式开发前的设计稿，不是最终 App。  
目标是先确认**信息层级、视觉风格、交互方式**，确认后再进入 PWA 开发并部署 GitHub Pages。

## 先看哪张

1. **总览**：`screens/00-overview.png`（6 个界面并排）
2. **首页**：`screens/01-home.png`
3. **首页完整长图**：`screens/02-home-full.png`
4. **风力详情**：`screens/03-wind.png`
5. **未来 7 天**：`screens/04-week.png`
6. **切换雪场**：`screens/05-switch.png`
7. **建议依据**：`screens/06-why.png`
8. **四档状态 / 加载 / 离线 / 失败**：`screens/07-states.png`

也可以直接打开可点击版：

```bash
open mockups/index.html
```

支持这些地址参数：

```text
mockups/index.html?screen=home
mockups/index.html?screen=home-full
mockups/index.html?screen=wind
mockups/index.html?screen=week
mockups/index.html?screen=switch
mockups/index.html?screen=why&day=4
mockups/index.html?screen=states
mockups/index.html?screen=home&resort=jinshanling
```

## 本次调整

按你的要求：

- 新增 **雪如意滑雪场**（崇礼古杨树，约 1600–1800m）
- 新增 **金山岭银河滑雪场**（承德滦平，约 1150–1679m）
- 删除 **长城岭滑雪场**
- 现在共 **8 家**：万龙、云顶、太舞、富龙、银河、多乐、雪如意、金山岭

## 设计说明

- 暗色苹果天气风格：全屏大气渐变、白色大字号、半透明卡片、底部抽屉。
- 右下角三条横线是雪场切换入口；切换后首页背景渐变会跟着变。
- 首页信息顺序：雪场名 → 当前温度/天气 → **今日建议** → 8 项指标 → 风力小时图 → 逐小时 → 未来 7 天。
- 风力是重点：
  - 首页一张 24 小时图；
  - 风力详情页 24/48/72 小时，柱子=持续风，虚线=阵风，箭头=风向；
  - 6 级“缆车可能降速”和 8 级“可能停运”两条警戒线。
- 建议等级严格用 : 非常建议 / 一般建议 / 不太建议 / 地狱难度。
- 建议依据页把风力、能见度、体感、缆车风险拆成四个因素条，并给出“更好时段”。
- 7 天页每天一行，另加“本周最佳”。

## 数据说明

- 主界面使用 **2026-11-18 09:54 的真实 Open-Meteo 预报快照**，不是手写假数据。
- 当天崇礼受强风影响，7 家崇礼雪场都是“地狱难度”，金山岭是“一般建议”，所以切换面板会看到 7 红 1 蓝；这是真实预报结果，不是配色错误。
- 四档状态板里的绿/蓝/橙/红卡片是为了展示组件，标注了“组件示意，非真实预报”。
- 山顶/山底温度是按海拔订正的估算；能见度、体感、风都取山顶，原因写在方案里。
- 效果图里的 iPhone 状态栏、灵动岛、底部横条是模拟的，正式 App 用 iOS 系统状态栏。
- 天气数据：Open-Meteo（CC BY 4.0）。正式版页脚会保留署名。

## 设计 token

| 用途 | 值 |
|---|---|
| 非常建议 | `#30D158` |
| 一般建议 | `#0A84FF` |
| 不太建议 | `#FF9F0A` |
| 地狱难度 | `#FF453A` |
| 卡片圆角 | 17–22px |
| 页面左右边距 | 20px |
| 大温度 | 94px / 细字重 |
| 玻璃模糊 | 仅底部抽屉 + 悬浮按钮 |

## 重新生成

```bash
# 1. 重新拉取真实预报快照（需要网络）
node mockups/fetch-data.mjs

# 2. 重新截图（需要本机 Google Chrome）
node mockups/shoot.mjs
```

## 确认清单

请重点看：

- [ ] 首页的信息顺序和密度是否合适（是否要把风力图再提前）
- [ ] 右下角三条横线的位置和大小
- [ ] 风力详情的 48 小时图是否够直观
- [ ] 四档建议的颜色和文案是否够清楚
- [ ] 7 天页是否要展示更多/更少字段
- [ ] 雪如意、金山岭的命名和区域文案
- [ ] 是否需要把“现在建议”和“今日整体建议”分开显示

确认后我再写正式版：Vite + React + TypeScript + PWA，部署到：

```text
https://dong20000817-cmd.github.io/chongli-snow/
```

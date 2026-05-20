# x.com 网页结构分析

## 概述

Twitter/x.com 使用 React 渲染，所有 class 名经过 CSS-in-JS 混淆（如 `r-1pi2tsx`、`r-9aw3ui`），不可作为稳定选择器。稳定的锚点是 `data-testid` 和 `aria-*` 属性。

## 推文 DOM 层级

```
<div data-testid="cellInnerDiv">                         ← 虚拟列表单元格
  <article aria-labelledby="..." data-testid="tweet">    ← 推文根节点
    ├── 头像区域 [data-testid="Tweet-User-Avatar"]
    ├── 内容区域
    │   ├── 用户名/时间行
    │   ├── 推文文本 [data-testid="tweetText"]
    │   ├── 媒体区域 div[aria-labelledby]               ← ★ 媒体容器
    │   └── 操作栏（回复/转推/点赞/分享）
```

## 媒体区域结构

媒体区域是 `article[data-testid="tweet"]` 的子节点中的一个 `div[aria-labelledby]`，它：
- **没有** `role` 属性（区别于 `article[role="article"]`）
- **没有** `data-testid` 属性
- **有** 唯一的动态 `id`（如 `id="id__pvrrnt9ipqc"`）

### 纯图片推文

```
div[aria-labelledby] (媒体区域)
└── div.r-9aw3ui
    └── div
        └── div (无 max-width，或有)
            └── div.r-1ets6dv.r-1phboty (边框/圆角容器)
                └── div
                    └── div.r-16y2uox (网格容器，多图时排列)
                        ├── a[href*="/photo/1"] (图片链接)
                        │   └── div.r-1adg3ll (aspect-ratio wrapper)
                        │       ├── div[style="padding-bottom: XX%"]  ← 占位高度
                        │       └── div (absolute positioned)
                        │           └── div[aria-label="图像"][data-testid="tweetPhoto"]
                        │               └── img[src="https://pbs.twimg.com/..."]
                        ├── a[href*="/photo/2"] ...
                        └── ...
```

**关键点：** `tweetPhoto` 是绝对定位的，`display:none` 不会折叠父级的 `padding-bottom` 占位。

### 视频推文

```
div[aria-labelledby] (媒体区域)
└── div.r-9aw3ui
    └── div
        └── div[style="max-width: Xpx"]
            └── div.r-1ets6dv.r-1phboty (边框/圆角容器)
                └── div
                    └── div[data-testid="tweetPhoto"] (容器，非绝对定位)
                        └── div
                            └── div.r-1adg3ll (aspect-ratio wrapper)
                                ├── div[style="padding-bottom: 56.25%"]  ← 占位
                                └── div (absolute)
                                    └── div[data-testid="placementTracking"]
                                        └── div[data-testid="videoPlayer"]
                                            └── div[data-testid="videoComponent"]
                                                └── video[aria-label="嵌入式视频"]
```

**关键点：** 视频的 `tweetPhoto` 虽非绝对定位，但父级边框容器仍有视觉占位。

## 稳定 data-testid 清单

| data-testid | 用途 |
|---|---|
| `tweet` | 推文根 article |
| `tweetText` | 推文文字内容 |
| `tweetPhoto` | 媒体容器（图片和视频共用） |
| `videoPlayer` | 视频播放器 |
| `videoComponent` | 视频组件 |
| `placementTracking` | 广告追踪包裹层 |
| `card.layoutLarge.media` | 大卡片媒体（链接预览） |
| `card.layoutSmall.media` | 小卡片媒体 |
| `imageWrapper` | 图片包裹器 |
| `testCondensedMedia` | 精简媒体视图 |
| `cellInnerDiv` | 虚拟列表单元格 |

## 区分图片和视频的方法

| 条件 | 图片 | 视频 |
|---|---|---|
| `tweetPhoto` 内含 `videoPlayer` | ✗ | ✓ |
| `tweetPhoto` 有 `aria-label="图像"` | ✓ | ✗ |
| 父级 `<a>` 的 href 含 `/photo/` | ✓ | ✗ |

## CSS 选择器策略

由于 class 名不稳定，应基于 `data-testid`、`aria-*`、语义标签选择：

```css
/* 隐藏图片媒体区域（完全折叠） */
div[aria-labelledby]:not([role]):not([data-testid]):has([data-testid="tweetPhoto"]):not(:has([data-testid="videoPlayer"])) {
  display: none !important;
}

/* 隐藏视频媒体区域（完全折叠） */
div[aria-labelledby]:not([role]):not([data-testid]):has([data-testid="videoPlayer"]) {
  display: none !important;
}
```

选择器解释：
- `div[aria-labelledby]` — 匹配媒体区域容器
- `:not([role])` — 排除 `article[role="article"]`（推文根节点）
- `:not([data-testid])` — 排除带 testid 的其他组件
- `:has(...)` — 根据内部子元素判断类型

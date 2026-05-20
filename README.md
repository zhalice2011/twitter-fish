# Twitter Media Toggle

Chrome 扩展，控制 Twitter(x.com) 时间线中图片和视频的显示与隐藏。

## 功能

- 独立开关：分别控制图片和视频的可见性
- 完全折叠：隐藏后不留任何占位空间
- 实时生效：切换开关无需刷新页面
- 设置持久化：通过 `chrome.storage.sync` 跨会话保存

## 安装

1. 打开 `chrome://extensions`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本项目文件夹

## 使用

点击浏览器工具栏中的扩展图标，在弹出面板中切换：

- **隐藏图片** — 折叠时间线中的纯图片内容
- **隐藏视频** — 折叠时间线中的视频内容

## 文件结构

```
├── manifest.json   # Chrome Extension MV3 配置
├── content.js      # 内容脚本（注入隐藏 CSS）
├── popup.html      # Popup 界面
├── popup.js        # Popup 逻辑
└── icons/          # 扩展图标
```

## 技术原理

通过 CSS `:has()` 选择器精准区分图片和视频容器，在推文的媒体区域容器层级注入 `display: none`，确保完全折叠无占位。

## 兼容性

- Chrome 105+（需要 CSS `:has()` 支持）
- 匹配域名：`x.com`、`twitter.com`

![alt text](<Kapture 2026-05-20 at 20.29.08.gif>)

![alt text](<Kapture 2026-05-20 at 20.31.11.gif>)
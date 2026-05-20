# Twitter Fish

> Disguise X/Twitter as VSCode — or just hide media from your timeline.

> 把 X/Twitter 伪装成 VSCode —— 或者只是隐藏时间线里的图片和视频。

![Tutorial](image1.png)
![Tutorial](image2.png)
![Tutorial](tutorial.gif)

---

## Features / 功能

- **VSCode Mode** — Transform Twitter into a VSCode-like interface. Browse tweets disguised as code.
- **Hide Images** — Collapse all image content from your timeline with zero leftover space.
- **Hide Videos** — Collapse all video content from your timeline with zero leftover space.
- **Instant Toggle** — All changes take effect immediately, no page refresh needed.
- **Persistent Settings** — Your preferences sync across sessions via `chrome.storage.sync`.

---

- **VSCode 模式** — 将 Twitter 变身为 VSCode 界面，推文伪装成代码。
- **隐藏图片** — 折叠时间线中所有图片，不留任何占位空间。
- **隐藏视频** — 折叠时间线中所有视频，不留任何占位空间。
- **即时生效** — 切换开关无需刷新页面。
- **设置持久化** — 通过 `chrome.storage.sync` 跨会话同步保存。

## Menu / 菜单

![Menu](menu.gif)

## Install / 安装

### From Release / 从 Release 下载

1. Go to [Releases](../../releases) and download the latest zip / 前往 [Releases](../../releases) 页面下载最新 zip
2. Unzip to any folder / 解压到任意文件夹
3. Open `chrome://extensions` / 打开 `chrome://extensions`
4. Enable **Developer mode** (top-right toggle) / 开启右上角「开发者模式」
5. Click **Load unpacked** / 点击「加载已解压的扩展程序」
6. Select the unzipped folder / 选择解压后的文件夹

### From Source / 从源码安装

1. Clone this repository / 克隆本仓库
2. Open `chrome://extensions` / 打开 `chrome://extensions`
3. Enable **Developer mode** / 开启「开发者模式」
4. Click **Load unpacked** / 点击「加载已解压的扩展程序」
5. Select the project folder / 选择项目文件夹

## Usage / 使用

Click the extension icon in your browser toolbar to open the popup panel:

点击浏览器工具栏中的扩展图标，打开弹出面板：

- **VSCode Mode** — Toggle the full VSCode disguise / 开启完整 VSCode 伪装
- **Hide Images** — Toggle image visibility / 切换图片显示
- **Hide Videos** — Toggle video visibility / 切换视频显示

## How It Works / 技术原理

Uses CSS `:has()` selectors to precisely distinguish image and video containers within tweets, injecting `display: none` at the media area container level to ensure complete collapse with no residual space. VSCode mode overlays a full IDE shell (activity bar, sidebar, tabs, status bar) and transforms tweets into syntax-highlighted code blocks.

通过 CSS `:has()` 选择器精准区分推文中的图片和视频容器，在媒体区域容器层级注入 `display: none`，确保完全折叠无占位。VSCode 模式覆盖完整的 IDE 外壳（活动栏、侧边栏、标签页、状态栏），并将推文转换为语法高亮的代码块。

## Compatibility / 兼容性

- Chrome 105+ (requires CSS `:has()` support)
- Matches: `x.com`, `twitter.com`

## License

MIT


## Acknowledgments

- [LinuxDo](https://linux.do) — 学 AI，上 L 站

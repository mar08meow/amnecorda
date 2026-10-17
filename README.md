# AMNE CORDA — 个人主页

蓝白极简的单页个人介绍：白色纸面、深蓝文字、蓝色强调，名字用蓝色。没有博客、文章归档或虚构履历，只介绍我自己和做过的小工具。

- 线上：`https://amnecorda.com`
- 本地：`D:\AI\workspace\personal-blog`
- GitHub：`https://github.com/mar08meow/amnecorda`

## 页面

- **`index.html`**：单页个人介绍
  - Hero：`你好，我是 AmneCorda。`
  - About me：一个普通人的简短自述
  - Things I made：AppPantry、HyperOS Workbench Blur Fix
  - Find me at：GitHub、X、Email
- **`404.html`**：精简错误页
- **`admin/index.html`**：受 Cloudflare Access 保护的后台，包含「站点文件」「内容」「外观」

## 文件结构

```
personal-blog/
├─ index.html                 单页个人介绍
├─ 404.html                   404 页面
├─ admin/index.html           管理后台
├─ functions/
│  ├─ _lib/                   Access JWT、GitHub App token、GitHub API
│  └─ admin/api/              me / file / commit API
├─ assets/
│  ├─ css/main.css            布局、组件与默认样式
│  ├─ css/theme.css           蓝白主题变量（后台可覆盖）
│  ├─ css/dark.css            夜间模式（跟随系统）
│  ├─ css/admin.css           后台样式
│  ├─ js/main.js              菜单、时钟、滚动淡入、复制邮箱
│  ├─ js/releases.js          AppPantry 最新 Release 下载按钮
│  ├─ js/admin.js             后台文件编辑与外观面板
│  └─ favicon.svg             蓝色 A 字标
├─ robots.txt
├─ sitemap.xml
├─ _headers                   Cloudflare Pages 响应头
└─ README.md
```

## 更新方式

GitHub 仓库 `mar08meow/amnecorda` 已连接 Cloudflare Pages，`main` 分支每次 push 会自动部署，约 1–2 分钟。

- 在 GitHub 网页直接改文件
- 本地 `git push`
- 或登录 `https://amnecorda.com/admin/`，用「站点文件」编辑 `index.html`、`404.html`、CSS 等

后台登录使用 Cloudflare Access，只允许 `wen18792247083@gmail.com`。GitHub 私钥保存在 Cloudflare Pages 的加密环境变量里，浏览器不接触 Token。

## 后台内容编辑

登录 `/admin/` 后打开 **内容**，可以直接修改：

- 页面标题、SEO 描述
- 首页名字、一句话介绍、介绍段落
- About me 两段文字
- 联系区文字、GitHub / X / Email 链接
- 项目的添加、删除和编辑：名称、平台/年份、描述、标签、GitHub 链接、Release 仓库、下载类型
- AppPantry 与 HyperOS 的下载按钮会自动跟随各自最新 Release

保存后会重写 `index.html`、创建 GitHub commit，并自动触发 Cloudflare 部署。新增或删除项目可以直接在「内容」页完成；更复杂的结构再使用「站点文件」。

## 外观

- 蓝白主题默认值在 `assets/css/theme.css`：`--paper: #ffffff`、`--ink: #0b1220`、`--accent: #6b86f0`
- 名字颜色来自 `.hero-title em { color: var(--accent); }`
- 夜间模式在 `assets/css/dark.css`，跟随手机/系统的 `prefers-color-scheme`
- 后台「外观」可以调整颜色、字体、字号、字重和预设；保存后写入 `theme.css` 并触发部署

## 项目下载按钮

`assets/js/releases.js` 会分别读取两个仓库的最新 Release：

- `mar08meow/AppPantry`：匹配 `portable.exe` 与 `setup.exe`
- `mar08meow/HyperOS-Workbench-Blur-Fix`：匹配 `.apk`

它会自动更新版本号、下载链接和 Release notes；接口失败时保留当前静态链接作为回退。以后发布新版本，只要 Release 中的文件名仍然包含对应后缀，页面不需要修改。

## 部署

Cloudflare Pages 项目 `amnecorda`：

- Git 仓库：`mar08meow/amnecorda`
- 生产分支：`main`
- Build command：留空
- Output directory：`/`

`amnecorda.com` 与 `www.amnecorda.com` 已绑定。修改后 push 到 `main` 即可自动部署。

## 说明

- 页面手写 HTML / CSS / JS，没有框架和构建步骤。
- 字体为 Inter，中文回退到系统中无衬线字体。
- 站点不加载追踪脚本。
- 旧的博客文章、归档、RSS、搜索和虚构项目已经移除。

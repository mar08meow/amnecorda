# AMNE CORDA — 个人主页与博客

黑白极简的个人主页：纯白底、黑字、Inter 无衬线、左侧固定栏、细线分隔、大留白。首页以自我介绍为主，写作与项目作为独立入口；内容方向为设计系统、工程实践与产品思考。

- 本地目录：`D:\AI\workspace\personal-blog`
- 线上域名：`https://amnecorda.com`（已上线，Cloudflare Pages + GitHub 自动部署）
- 临时地址：`https://amnecorda.pages.dev`
- 部署包：`D:\AI\workspace\amnecorda-site.zip`
- 旧版暖色纸感备份：`D:\AI\workspace\personal-blog-warm-backup`

## 页面结构

- **首页 `index.html`**：个人主页。`你好，我是 AmneCorda` 大标题、角色行、简介与按钮，以及 `I am`、`About me`、`Selected writing`、`Now`、`Find me at` 五个信息区。
- **Writing `writing.html`**：文章存档，按年份分组，支持工程 / 设计 / 笔记筛选。
- **Projects `projects.html`**：作品列表，4 个示例项目与技术标签。
- **About `about.html`**：更完整的自述、时间线、Now 与联系方式。
- **文章 `posts/*.html`**：4 篇示例长文，含目录、阅读进度、代码块与上下篇导航。
- **404 `404.html`**：自定义错误页。

## 预览

不需要安装依赖，直接双击 `index.html` 即可。也可以用任意静态服务器打开此目录。

## 文件结构

```
personal-blog/
├─ index.html                 个人主页
├─ writing.html               文章存档（带分类筛选）
├─ projects.html              项目 / 作品
├─ about.html                 关于页
├─ 404.html                   404 页面
├─ posts/
│  ├─ design-systems-collapse.html
│  ├─ state-as-essay.html
│  ├─ whitespace-attention.html
│  └─ knowledge-pipeline.html
├─ assets/
│  ├─ css/main.css            全部样式（设计变量在 :root）
│  ├─ js/main.js              菜单、筛选、进度、目录高亮、复制邮箱
│  ├─ img/portrait.svg        黑白排版式肖像
│  └─ favicon.svg             黑白 A 字标
├─ robots.txt
├─ sitemap.xml
├─ _headers                   Cloudflare Pages 安全响应头
└─ README.md
```

## 设计系统

所有可调参数集中在 `assets/css/main.css` 顶部：

- 颜色：`--paper: #ffffff`、`--ink: #0a0a0a`、`--ink-soft: #4a4a4a`、`--muted: #8a8a8a`、`--line`。
- 字体：Inter（Google Fonts），中文回退到 PingFang SC / Microsoft YaHei。加载失败时仍保持系统无衬线。
- 布局：桌面为 264px 固定左侧栏；880px 以下变为顶部 sticky 导航，导航收进全屏抽屉。
- 首页信息区：`profile-grid` 采用 176px 标签列 + 内容列；移动端变为单列。
- 内容宽度：`--max: 1060px`；文章正文 680px，右侧可选目录。
- 页面不加载封面图，纯排版。
- 动效：标题升起、滚动淡入、状态点呼吸；全部遵循 `prefers-reduced-motion`。
- 无障碍：语义标签、skip link、aria 属性、`focus-visible`、移动菜单焦点管理。

## 上线前需要替换

1. **社交链接**：已指向 GitHub（`https://github.com/mar08meow`）与 X（`https://x.com/Amnecorda`）。如以后更换账号，记得同步首页、关于页和页脚。
2. **首页介绍**：`I am`、`About me`、`Now` 中的职位、经历与近况目前是示例，按实际情况修改。
3. **项目**：`projects.html` 中 4 个项目（Design System v3、Atlas、Marginalia、AMNE CORDA）为示例，替换成你的项目；不需要的项目直接删除 `<article class="project-item">` 整块。
4. **关于页**：时间线、Now、书单为示例内容。
5. **文章内容**：四篇文章为示例长文，可直接替换。
6. **品牌**：`AMNE CORDA` 出现在每个页面的字标、页脚大字、`<title>` 与 meta 中，可全局搜索替换。
7. **邮箱**：`hello@amnecorda.com` 出现在页头、页脚、关于页与 404 页。
8. **日期与 sitemap**：发布新文章或新项目后更新 `sitemap.xml` 的 `lastmod`。

## 新增一篇文章

1. 复制 `posts/design-systems-collapse.html`，重命名为 `posts/your-slug.html`。
2. 修改 `<title>`、`.article-meta`、`.article-title`、`.article-deck`、正文与文末上下篇链接。
3. 正文里的每个 `<h2 id="s1">` 要与右侧 `.toc` 的 `href="#s1"` 一一对应。
4. 在 `writing.html` 添加一条 `.archive-row`（`data-category` 取 `engineering` / `design` / `notes`）。
5. 如果希望它出现在首页 `Selected writing`，在 `index.html` 的 `.mini-list` 中加一条 `<li>`。
6. 更新上一篇的 `.next-post` 链接，并在 `sitemap.xml` 增加对应 URL。

## 新增一个项目

在 `projects.html` 的 `.project-list` 中复制一个 `<article class="project-item">`，修改标题、年份、描述和技术标签。项目列表会自动沿用现有两栏布局；不需要的字段可以删除。

## 部署到 Cloudflare Pages（GitHub 长期维护）

`amnecorda.com` 的 DNS 已经托管在 Cloudflare（`burt.ns.cloudflare.com` / `meera.ns.cloudflare.com`），根域名目前没有 A 记录。推荐使用 GitHub 仓库 + Cloudflare Pages：第一次配置稍多几步，之后每次 `git push` 都会自动部署。

### 1. 创建 GitHub 仓库

1. 登录 GitHub，新建仓库，名称填 `amnecorda`。
2. Public / Private 都可以。
3. **不要**勾选 “Add a README file”、“Add .gitignore” 或 “Choose a license”，保持空仓库，避免和本地首次提交冲突。
4. 仓库地址应为：`https://github.com/mar08meow/amnecorda`

### 2. 推送本地仓库

本地项目已经初始化 Git，并完成了首次提交。在 `D:\AI\workspace\personal-blog` 执行：

```bash
cd /d/AI/workspace/personal-blog
git remote add origin https://github.com/mar08meow/amnecorda.git
git push -u origin main
```

第一次 push 会弹出 GitHub 登录窗口。

如果出现 `Recv failure: Connection was reset`，说明本机到 GitHub 的网络不稳定。可以开启代理后重试，或改用 GitHub Desktop，或直接在 GitHub 网页上传文件（见下方“备用方案”）。

### 3. 连接 Cloudflare Pages

1. 登录 Cloudflare Dashboard。
2. 进入 **Workers & Pages → Create → Pages → Connect to Git**。
3. 选择 GitHub 仓库 `amnecorda`。
4. 框架预设选 **None / 无**。
5. Build command 留空。
6. Output directory 填 `/`。
7. 点击保存并部署，会得到一个 `*.pages.dev` 临时地址，先确认页面正常。

### 4. 绑定域名

1. 进入 Pages 项目 → **Custom domains → Set up a custom domain**，输入 `amnecorda.com`。
2. 因为 DNS 已在 Cloudflare，`A` / `CNAME` 记录会自动创建，证书自动签发。等待状态变为 Active 后访问 `https://amnecorda.com`。
3. 再添加 `www.amnecorda.com`，并用 **Rules → Redirect Rules** 把 `www` 301 重定向到根域。

### 以后的更新流程

```bash
cd /d/AI/workspace/personal-blog
git add -A
git commit -m "Update writing"
git push
```

Cloudflare Pages 会自动重新部署，通常一两分钟生效。

### 备用方案：直接上传 zip

如果暂时不想连接 GitHub，也可以在 Pages 中选择 **Upload assets**，上传 `D:\AI\workspace\amnecorda-site.zip`。每次更新都需要重新生成并上传一次。

## 配置 hello@amnecorda.com

免费方案（只收信、转发）：

1. Cloudflare Dashboard → 选择 `amnecorda.com` → **Email → Email Routing**。
2. 点击 **Enable Email Routing**，按提示添加 MX / TXT 记录。
3. 在 **Destination addresses** 添加你的常用邮箱，并到该邮箱点击验证链接。
4. 在 **Custom addresses** 添加 `hello@amnecorda.com`，转发到刚才验证的邮箱。

如果要能直接用该地址发信，需要 Google Workspace、Fastmail、Zoho Mail 等邮箱服务，并按服务商提供的 MX 记录配置。注意：更换邮件服务会覆盖 Cloudflare Email Routing 的 MX 记录。

## 说明

- 站点不加载追踪脚本，也没有第三方分析。
- Inter 通过 Google Fonts 加载；如果主要读者在国内，可考虑自托管字体或改回纯系统字体，以提升首屏速度。
- 首页的订阅表单已移除；如需 newsletter，可在页面底部重新加入表单并接入邮件服务。
- 旧的暖色纸感版本完整保留在 `personal-blog-warm-backup`，确认新版本后可以删除。

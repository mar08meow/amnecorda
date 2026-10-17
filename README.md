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
- **管理后台 `admin/index.html`**：`/admin` 登录后管理文章与站点文件。
- **404 `404.html`**：自定义错误页。

## 预览

不需要安装依赖，直接双击 `index.html` 即可。也可以用任意静态服务器打开此目录。

## 管理后台

- 地址：`https://amnecorda.com/admin/`
- 登录：Cloudflare Access（Sign in with Cloudflare），浏览器不保存任何 GitHub 凭据
- 服务端：Pages Functions 用 GitHub App 私钥换取 installation token，自动刷新（约 1 小时）
- 安全：`/admin/api/*` 会校验 `Cf-Access-Jwt-Assertion`，即使直接访问 `pages.dev` 的 API 也会被拒绝
- 发布/删除会创建一次 GitHub commit，Cloudflare 会自动部署

### 当前配置

- Access 应用：`AMNE CORDA Admin`（路径 `/admin`，同时覆盖 `/admin` 页面与 `/admin/api/*`）
- 策略：`Owner only`，只允许 `wen18792247083@gmail.com`
- 登录方式：Cloudflare Access 登录页中的 “Sign in with Cloudflare”
- Pages 环境变量：`GITHUB_APP_ID`、`GITHUB_APP_INSTALLATION_ID`、`GITHUB_APP_PRIVATE_KEY`（Secret）、`ACCESS_TEAM_DOMAIN`、`ACCESS_AUD`
- GitHub App：`amnecorda-admin`，只安装到 `mar08meow/amnecorda`，权限为 `Contents: Read and write`
- 旧的 `GITHUB_TOKEN` 不再使用，确认新链路正常后可以删除

### 一次性配置

1. **创建 GitHub App**：GitHub → Settings → Developer settings → GitHub Apps → New GitHub App：
   - Homepage URL 填 `https://amnecorda.com`
   - 关闭 Webhook
   - Repository permissions → Contents 设为 `Read and write`
   - 选择 `Only on this account`
2. **生成私钥并安装**：在 App 的 Credentials 页生成 private key；在 Install App 页只选择 `amnecorda` 仓库。
3. **转换私钥格式**：GitHub 下载的是 PKCS#1（`BEGIN RSA PRIVATE KEY`），Cloudflare Workers 需要 PKCS#8：
   ```bash
   openssl pkcs8 -topk8 -nocrypt -in private-key.pem -out private-key.pk8
   ```
4. **添加 Pages 环境变量**：Cloudflare Pages → 项目 `amnecorda` → Settings → Variables and Secrets：
   - `GITHUB_APP_ID`：GitHub App 的 App ID
   - `GITHUB_APP_INSTALLATION_ID`：安装到仓库后的 installation ID（安装页 URL 末尾的数字）
   - `GITHUB_APP_PRIVATE_KEY`：上一步生成的 PKCS#8 PEM，类型选 **Secret**
   - `ACCESS_TEAM_DOMAIN`：Zero Trust 团队域名
   - `ACCESS_AUD`：`AMNE CORDA Admin` 应用的 Audience Tag
5. **创建一个 Access 应用**（Zero Trust → Access → Applications → Add self-hosted）：
   - 域名 `amnecorda.com`，路径 `admin`，策略允许你的邮箱
   - 该路径同时覆盖 `/admin` 和 `/admin/api/*`
6. **重新部署**：`git push` 或 Dashboard 的 Retry deployment。
7. 打开 `https://amnecorda.com/admin/`，通过 Access 登录。

> GitHub App 的 installation token 由服务端自动获取并缓存，过期前刷新，不需要定时续期。
>
> 浏览器不接触私钥或 Token；`/admin/api/*` 即使绕过 Access 域名，也会因为缺少有效 JWT 返回 401。

### 发布与删除

在“写新文章”中填写标题、slug、日期、分类、摘要和 Markdown 正文，可以先预览。发布会生成 `posts/<slug>.html`，同时更新 `data/posts.json` 与 `sitemap.xml`。

在“文章”列表点删除，会删除文章文件并同步文章列表与 sitemap；其他文章的 “Next entry” 会由前台脚本按最新列表重新计算。

### 站点文件

“站点文件”可以直接编辑 `index.html`、`about.html`、`projects.html`、`writing.html`、`assets/css/main.css` 等文件。保存前建议先下载备份；直接改 HTML/CSS 有风险。

## 文件结构

```
personal-blog/
├─ index.html                 个人主页
├─ writing.html               文章存档（动态读取 posts.json）
├─ projects.html              项目 / 作品
├─ about.html                 关于页
├─ admin/index.html           管理后台
├─ 404.html                   404 页面
├─ functions/
│  ├─ _lib/                   Access JWT 校验、GitHub API
│  └─ api/admin/              me / posts / file / commit API
├─ data/
│  └─ posts.json              文章索引（后台发布/删除时更新）
├─ posts/
│  ├─ design-systems-collapse.html
│  ├─ state-as-essay.html
│  ├─ whitespace-attention.html
│  └─ knowledge-pipeline.html
├─ assets/
│  ├─ css/main.css            站点样式（设计变量在 :root）
│  ├─ css/admin.css           管理后台样式
│  ├─ js/main.js              菜单、动态列表、筛选、进度、目录高亮
│  ├─ js/admin.js             Access 后台、发布/删除文章、文件编辑
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
8. **日期与 sitemap**：通过 `/admin` 发布/删除会自动更新 `sitemap.xml`；手动新增文章时再更新。

## 新增一篇文章（手动方式）

推荐直接使用 `/admin` 发布；以下仅用于手动维护。

1. 复制 `posts/design-systems-collapse.html`，重命名为 `posts/your-slug.html`，修改标题、meta、正文与目录。
2. 在 `data/posts.json` 增加一条记录：`slug`、`title`、`category`（`engineering` / `design` / `notes`）、`categoryLabel`、`date`（YYYY-MM-DD）、`readingTime`、`excerpt`、`featured`。
3. 在 `sitemap.xml` 增加 `https://amnecorda.com/posts/your-slug.html`。
4. 首页精选和归档列表会自动从 `data/posts.json` 渲染，不需要再改 `writing.html` 或 `index.html`。
5. 文章页的 “Next entry” 会根据最新列表自动更新。

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

## hello@amnecorda.com 邮件路由（已配置）

当前配置：

- 目标地址：`wen18792247083@gmail.com`（已验证）
- 路由规则：`hello@amnecorda.com` → `wen18792247083@gmail.com`（活跃）
- MX、SPF、DKIM 记录由 Cloudflare Email Routing 自动添加并锁定

测试方式：从其他邮箱发送一封邮件到 `hello@amnecorda.com`，确认 Gmail 能收到（也检查一下垃圾邮件箱）。

如果要能直接用这个地址发信，需要 Google Workspace、Fastmail、Zoho Mail 等邮箱服务，并按服务商提供的 MX 记录配置。注意：更换邮件服务会覆盖 Cloudflare Email Routing 的 MX 记录。

## 说明

- 站点不加载追踪脚本，也没有第三方分析。
- Inter 通过 Google Fonts 加载；如果主要读者在国内，可考虑自托管字体或改回纯系统字体，以提升首屏速度。
- 首页的订阅表单已移除；如需 newsletter，可在页面底部重新加入表单并接入邮件服务。
- 旧的暖色纸感版本完整保留在 `personal-blog-warm-backup`，确认新版本后可以删除。

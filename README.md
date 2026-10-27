# Maple-Garden

Maple-Garden（枫叶花园）是一个静态、浏览器本地优先的个人数字花园。它把开发、诗歌散文、交易心得、写点什么和篮球等长期记录收纳在不同内容板块中，同时提供一组不上传用户输入的开发者工具。

最终站点：<https://zdqf.github.io/maple-garden/>

## 快速开始

```bash
npm ci
npm run dev
```

本地访问：`http://localhost:5173/maple-garden/`

生产检查：

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

项目要求 Node `>=22.12 <23`、npm `>=10 <11`。也可以运行 `npm run quality` 执行完整质量门禁。

## 内容板块

板块配置位于 `src/config/articleCategories.ts`，当前包括：

- `poetry`：诗歌散文
- `developer`：开发者
- `trader`：交易心得
- `calligraphy`：写点什么
- `basketball`：篮球

日志页会自动显示板块卡片、文章数量和分类筛选。新增板块时修改配置文件即可，不需要修改 Journal 页面布局。

## 个人配置

个人信息的唯一来源是 `src/config/personal.ts`：公开笔名、简介、技能、联系方式、站点标题/描述和 SEO 文案都集中在这里。当前公开署名为 `木有风`，版权标识使用 `Logan.Song / 木有风`；未提供的可选资料保持为空，不编造个人事实。

项目目录位于 `src/config/projects.ts`，工具元数据位于 `src/config/tools.ts`。

## 添加文章

文章按分类放在 `content/posts/` 下，诗集或系列内容再使用独立子目录。例如 `content/posts/poetry/shen-zai-han/` 存放《身在汉》的诗作，`content/posts/trader/` 存放交易记录。构建会递归读取这些目录中的 Markdown 文件。

Frontmatter 示例：

```yaml
---
title: "文章标题"
description: "列表和 SEO 摘要"
slug: "url-friendly-slug"
publishedAt: "2025-03-02T08:15:00+08:00"
category: "developer"
author: "木有风"
copyright: "© 2025 Logan.Song / 木有风. All rights reserved."
tags:
  - "example"
draft: false
---
```

`category` 使用 `src/config/articleCategories.ts` 中的 ID。`draft: true` 的文章不会出现在日志、首页、搜索或文章路由。文章详情会展示作者和版权信息。

文章正文使用 `react-markdown` 和 `remark-gfm`，没有启用 `rehype-raw`，raw HTML 不会执行。Frontmatter 在浏览器中使用安全的轻量解析器，不依赖 Node.js `Buffer`。

## 工具

当前 registry 包含 JSON、Base64 Unicode、URL、Timestamp、UUID v4、Text Statistics/Word Counter、Regex、SHA-256、line diff 和 Prompt Composer。Prompt Composer 同页包含 Markdown Preview。工具不 fetch、不调用远程服务、不写 Browser Storage。

## 版权和署名

项目版权声明和内容使用规则位于 [`COPYRIGHT.md`](./COPYRIGHT.md)。当前公开署名为 `木有风`，版权标识使用 `Logan.Song / 木有风`；不需要在网站公开真实姓名。授权申请和侵权联系邮箱为 `fengye78236402@gmail.com`。

发布新内容前请遵守：

1. 使用 `木有风` 作为文章 `author` 和公开署名。
2. 使用 `Logan.Song / 木有风` 作为版权字段中的双署名。
3. 不删除原文版权声明、Git 历史、发布日期和原始链接。
4. 允许分享原始链接和必要的短引用，但不允许未经许可转载全文、改编、翻译、批量抓取或商业使用。
5. 对引用、图片、字体、数据和代码片段保留原作者、来源和许可证。
6. 发现侵权时先保存截图、URL、时间和 Git 版本证据，再向平台提交版权投诉。
7. 不把真实姓名、身份证件、住址、密码、token 或其他敏感信息放进公开仓库。

GitHub 公开仓库默认不会自动授予别人复制、修改和再发布你作品的许可。当前项目没有为文章、诗歌散文、交易心得、个人记录和站点文案添加开源许可证；具体允许和禁止的使用方式以 [`COPYRIGHT.md`](./COPYRIGHT.md) 为准。

## 创建 GitHub Pages 仓库

1. 创建公开仓库 `zdqf/maple-garden`。
2. 将当前项目推送到该仓库的 `main` 分支。
3. 在 GitHub 仓库的 **Settings → Pages** 中将 Source 设置为 **GitHub Actions**。
4. `.github/workflows/deploy.yml` 会在 push 到 `main` 或手动 `workflow_dispatch` 时执行 `npm ci`、`npm run build`、上传 `dist` 并部署 Pages。
5. 站点地址是 <https://zdqf.github.io/maple-garden/>。

Vite 的 `base` 固定为 `/maple-garden/`，路由使用 HashRouter。部署此仓库不会修改现有用户站点 `zdqf/zdqf.github.io`。

## 安全与范围边界

这是一个无后端静态应用：不要在配置、文章或 issue 中放置密码、token、私钥、个人敏感数据或未公开资料。工具输入不会上传。第三方内容的权利归原权利人所有。

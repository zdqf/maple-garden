# Maple-Garden

Maple-Garden（枫叶花园）是一个静态、浏览器本地优先的个人数字花园。它把开发、诗歌、交易、书法和篮球等长期记录收纳在不同内容板块中，同时提供一组不上传用户输入的开发者工具。

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

- `poetry`：诗歌
- `developer`：开发者
- `trader`：交易员
- `calligraphy`：书法
- `basketball`：篮球

日志页会自动显示板块卡片、文章数量和分类筛选。新增板块时修改配置文件即可，不需要修改 Journal 页面布局。

## 个人配置

个人信息的唯一来源是 `src/config/personal.ts`：身份、简介、技能、经历、工作原则、联系方式、站点标题/描述和 SEO 文案都集中在这里。当前仓库保留 `TODO_REPLACE`，页面会用“待替换”标识显示它们；发布真实个人站点前请替换成自己的内容。

项目目录位于 `src/config/projects.ts`，工具元数据位于 `src/config/tools.ts`。

## 添加文章

把 `.md` 文件放进 `content/posts/`。Frontmatter 示例：

```yaml
---
title: "文章标题"
description: "列表和 SEO 摘要"
slug: "url-friendly-slug"
publishedAt: "2025-03-02T08:15:00+08:00"
category: "developer"
author: "Logan.Song"
copyright: "© 2025 Logan.Song. All rights reserved."
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

项目版权声明位于 [`COPYRIGHT.md`](./COPYRIGHT.md)。发布前请：

1. 将个人署名和文章 `author` 中的 `TODO_REPLACE` 替换为真实姓名或公开笔名。
2. 为每篇原创文章填写 `copyright` 字段。
3. 对引用、图片、字体和代码片段保留原作者、来源和许可证。
4. 不把未获授权的诗歌、图片、文章或交易资料复制进仓库。
5. 保留 Git 提交历史，并使用 GitHub Release 或带日期的 tag 保存重要版本。

GitHub 公开仓库默认不会自动授予别人复制、修改和再发布你作品的许可。未单独添加开源许可证的代码通常仍保留全部权利；如果未来希望开放代码，请为代码选择合适的开源许可证，但不要把文章、诗歌和个人记录自动包含进去。

## 创建 GitHub Pages 仓库

1. 创建公开仓库 `zdqf/maple-garden`。
2. 将当前项目推送到该仓库的 `main` 分支。
3. 在 GitHub 仓库的 **Settings → Pages** 中将 Source 设置为 **GitHub Actions**。
4. `.github/workflows/deploy.yml` 会在 push 到 `main` 或手动 `workflow_dispatch` 时执行 `npm ci`、`npm run build`、上传 `dist` 并部署 Pages。
5. 站点地址是 <https://zdqf.github.io/maple-garden/>。

Vite 的 `base` 固定为 `/maple-garden/`，路由使用 HashRouter。部署此仓库不会修改现有用户站点 `zdqf/zdqf.github.io`。

## 安全与范围边界

这是一个无后端静态应用：不要在配置、文章或 issue 中放置密码、token、私钥、个人敏感数据或未公开资料。工具输入不会上传。第三方内容的权利归原权利人所有。

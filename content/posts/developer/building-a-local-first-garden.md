---
title: "构建一个 Local-first Maple-Garden"
description: "用静态内容、浏览器本地工具和清晰边界搭建一个可持续的小型开发者花园。"
slug: "building-a-local-first-garden"
publishedAt: "2025-01-18T09:00:00+08:00"
category: "developer"
author: "木有风"
copyright: "© 2025 Logan.Song / 木有风. All rights reserved."
tags:
  - "architecture"
  - "local-first"
  - "Logan.Song"
draft: false
---

这是一个可替换的示例文章，用来展示 Maple-Garden 的内容管线。它不代表任何个人经历或真实成果。

## 为什么选择静态内容

静态构建让文章、项目和工具都能被版本控制，也让部署边界足够清晰。示例站点只在浏览器中运行，不连接后端服务。

### 先确定边界

内容应该是公开、可审阅的 Markdown；工具应该处理用户主动输入的本地数据。

## 一个简单的实现

```ts
const garden = { content: 'markdown', tools: 'browser-only' };
console.log(garden);
```

如果你要把这个项目换成真实个人站点，请先替换配置里的 `TODO_REPLACE`，再补充自己的文章和项目。

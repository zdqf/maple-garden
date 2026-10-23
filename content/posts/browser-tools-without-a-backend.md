---
title: "不依赖后端的浏览器工具"
description: "从 JSON、Base64 到 SHA-256，浏览器 API 足够支持一组实用的小工具。"
slug: "browser-tools-without-a-backend"
publishedAt: "2025-02-06T10:30:00+08:00"
category: "developer"
author: "Logan.Song"
copyright: "© 2025 Logan.Song. All rights reserved."
tags:
  - "web platform"
  - "privacy"
  - "Logan.Song"
draft: false
---

本篇是可替换的工具实践示例。输入只留在当前页面内，不会被上传，也不会写入浏览器存储。

## 组合原生能力

JSON 解析、URL 编解码、Unicode 文本处理和 Web Crypto 都可以由浏览器直接完成。界面只需要负责输入、操作、结果与错误状态。

### 错误也应该可读

用户输入非法 JSON 或正则时，页面保留原文并显示明确错误，而不是让整个页面崩溃。

## 用小模块保持可维护

```js
const result = await crypto.subtle.digest('SHA-256', data);
```

工具页面可以共享同一套表单与复制控件，同时按工具 ID 选择具体操作。

# 内容归档约定

内容只保留两层组织：**主题 → 合集（可选）→ 文章**。主题回答“写什么”，合集回答“属于哪一册或哪一系列”；标签用于交叉检索，年份由发布日期自动生成，不再建立年份、月份或标签文件夹。

```text
content/
├── README.md                       # 本说明，不参与文章索引
└── posts/
    ├── developer/                  # 独立文章直接放在主题下
    │   └── building-a-local-first-garden.md
    ├── poetry/
    │   ├── shen-zai-han/            # 合集 ID 与目录名相同
    │   │   └── shen-zai-han-li-bie.md
    │   └── zhu-zhang/
    │       ├── zhu-zhang-fu-qin.md
    │       └── zhu-zhang-chi-dun.md
    ├── trader/
    │   ├── a-share-tech-investing-drawdown-notes/
    │   │   └── a-share-tech-investing-drawdown-notes.md
    │   └── value-investing/
    │       └── wuhan-optical-communications-vs-suzhou-optical-modules.md
    └── basketball/
        └── tatum-reading-the-game.md
```

空主题不需要占位目录。当前主题定义于 `src/config/articleCategories.ts`，合集定义于 `src/config/contentCollections.ts`。页面、计数、搜索和时间归档均从 Markdown 元数据生成，无需手工维护文章列表。

## 新增文章

1. 选择一个已有主题；新主题先加入 `articleCategories.ts`。
2. 独立文章使用 `posts/{category}/{slug}.md`。系列作品先注册合集，再使用 `posts/{category}/{collection}/{slug}.md`。
3. 文件名与 `slug` 一致，使用英文小写和连字符。`slug` 是永久文章地址：文章发表后保留原 slug，即使将来移动主题或合集也不要重命名。
4. 填写 frontmatter 后写正文；发布日期保留时区。使用 `draft: true` 暂存未完成文章，草稿不进入公开列表、搜索或路由。
5. 发布前运行 `npm run test` 与 `npm run build`，检查主题、合集、文件位置和永久地址。

```yaml
---
title: "文章标题"
description: "一句清晰的内容摘要，用于列表和搜索。"
slug: "article-title"
publishedAt: "2026-11-16T20:00:00+08:00"
category: "poetry"
collection: "zhu-zhang"
author: "木有风"
copyright: "© 2026 Logan.Song / 木有风. All rights reserved."
tags:
  - "生活"
  - "诗歌"
draft: true
---
```

独立文章删除 `collection` 字段。标签只描述文章内容，不要将同义词反复建为新主题。正文按需使用 `##`、`###` 生成阅读目录，避免重复书写页面已有的一级标题。

## 归档一致性

已发表文章必须满足：主题已注册；合集已注册且属于该主题；路径与 `category`、`collection`、`slug` 一致；slug 全站唯一。索引会给出具体文章路径的错误，测试也会检查现有文章，避免出现文件已放进目录但页面无法归类的情况。草稿允许暂时调整目录结构，正式发布时再完成一致性检查。

归档整理只调整呈现与索引规则，不修改原文、发布日期、作者和版权。引用、图片与代码的来源和许可继续随正文保留；具体使用规则见根目录 `COPYRIGHT.md`。

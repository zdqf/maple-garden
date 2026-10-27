export type ArticleCategory = Readonly<{
  id: string;
  name: string;
  description: string;
}>;

/**
 * Maple-Garden 的内容板块。新增板块只需要在这里增加配置，Journal 页面会自动读取。
 */
export const articleCategories: readonly ArticleCategory[] = Object.freeze([
  {
    id: 'poetry',
    name: '诗歌散文',
    description: '收纳诗歌、散文与那些需要慢慢写下来的片段。',
  },
  {
    id: 'developer',
    name: '开发者',
    description: '代码、架构、工具和长期构建记录。',
  },
  {
    id: 'trader',
    name: '交易心得',
    description: '记录市场观察、交易复盘和真实的盈亏感受。',
  },
  {
    id: 'calligraphy',
    name: '写点什么',
    description: '不限定主题，写下此刻想写的字、句子和片段。',
  },
  {
    id: 'basketball',
    name: '篮球',
    description: '凯尔特人球迷，球员社区论坛讨论',
  },
]);

const categoryMap = new Map(
  articleCategories.map((category) => [category.id, category]),
);

export function getArticleCategory(categoryId: string): ArticleCategory | undefined {
  return categoryMap.get(categoryId);
}

export function getArticleCategoryName(categoryId: string): string {
  return getArticleCategory(categoryId)?.name ?? categoryId;
}

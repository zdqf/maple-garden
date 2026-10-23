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
    name: '诗歌',
    description: '记录诗句、感受与个人创作片段。',
  },
  {
    id: 'developer',
    name: '开发者',
    description: '代码、架构、工具和长期构建记录。',
  },
  {
    id: 'trader',
    name: '交易员',
    description: '交易观察、复盘方法与风险记录。',
  },
  {
    id: 'calligraphy',
    name: '书法',
    description: '临帖、笔法和书写练习记录。',
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

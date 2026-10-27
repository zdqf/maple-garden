export type ContentCollection = Readonly<{
  id: string;
  category: string;
  title: string;
  description: string;
}>;

/**
 * 作品和诗集的一级目录。具体内容通过文章 front matter 的 collection 关联。
 */
export const contentCollections: readonly ContentCollection[] = Object.freeze([
  {
    id: 'shen-zai-han',
    category: 'poetry',
    title: '身在汉',
    description: '一册仍在写作中的诗集，收纳离别、城市、湖水与北方来雪之间缓慢生长的回声。',
  },
  {
    id: 'a-share-tech-investing-drawdown-notes',
    category: 'trader',
    title: '大A科技股心事',
    description: '一个普通程序员从商业航天、存储芯片和光通信走过的盈亏起伏与交易反思。',
  },
  {
    id: 'value-investing',
    category: 'trader',
    title: '价值投资',
    description: '从产业链、现金流、竞争格局和估值纪律出发，记录科技资产的研究与交易心得。',
  },
  {
    id: 'zhu-zhang',
    category: 'poetry',
    title: '竹杖',
    description: '一册写给亲人、时间与沉默的诗集，从父亲开始，慢慢收纳生活留下的回声。',
  },
]);

const collectionMap = new Map(
  contentCollections.map((collection) => [collection.id, collection]),
);

export function getContentCollection(
  collectionId: string,
): ContentCollection | undefined {
  return collectionMap.get(collectionId);
}

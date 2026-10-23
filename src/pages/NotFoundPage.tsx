import { Link } from 'react-router-dom';

import { usePageMeta } from '../components/common/PageMeta';

type MissingResource = 'article' | 'tool' | 'route';

export type NotFoundPageProps = Readonly<{ resource?: MissingResource }>;

const missingMessages: Readonly<Record<MissingResource, string>> = {
  article: '这篇文章不存在、尚未发布或仍是草稿。',
  tool: '这个工具不存在或尚未提供。',
  route: '请求的页面不存在。',
};

export function NotFoundPage({ resource = 'route' }: NotFoundPageProps): React.JSX.Element {
  usePageMeta('页面未找到 · Maple-Garden', missingMessages[resource], true);
  return <section aria-labelledby="not-found-title" className="empty-page"><p className="eyebrow">404 / NOT FOUND</p><h1 id="not-found-title">页面未找到</h1><p>{missingMessages[resource]}</p><Link className="button button-primary" to="/">返回首页</Link></section>;
}

export default NotFoundPage;

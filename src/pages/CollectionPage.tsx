import { Link, useParams } from 'react-router-dom';

import { ArchivePostRow } from '../components/common/ArchivePostRow';
import { usePageMeta } from '../components/common/PageMeta';
import { getArticleCategoryName } from '../config/articleCategories';
import { getContentCollection } from '../config/contentCollections';
import { getPostsInCollection } from '../content/postRepository';
import NotFoundPage from './NotFoundPage';

export function CollectionPage(): React.JSX.Element {
  const { collection: collectionId } = useParams<{ collection?: string }>();
  const collection = collectionId === undefined ? undefined : getContentCollection(collectionId);
  const posts = collection === undefined ? [] : getPostsInCollection(collection.id);

  usePageMeta(collection ? `${collection.title} · Maple-Garden` : '文集未找到 · Maple-Garden', collection?.description ?? '请求的文集不存在。', collection === undefined || posts.length === 0);
  if (collection === undefined || posts.length === 0) return <NotFoundPage resource="route" />;

  const readingTime = posts.reduce((total, post) => total + post.readingTime, 0);
  const latestDate = posts[0]?.publishedAt.slice(0, 10).replaceAll('-', '.');
  return (
    <section aria-labelledby="collection-title" className="collection-page">
      <Link className="archive-back-link" to={`/journal/category/${collection.category}`}>← 返回{getArticleCategoryName(collection.category)}</Link>
      <div className="collection-intro">
        <div><p className="eyebrow">COLLECTION / {getArticleCategoryName(collection.category)}</p><h1 id="collection-title">{collection.title}</h1><p className="lede">{collection.description}</p><div className="collection-metadata"><span>{posts.length} 篇文字</span><span>约 {readingTime} 分钟阅读</span><span>更新于 {latestDate}</span></div></div>
        <span aria-hidden="true" className="collection-cover-mark">{collection.title.slice(0, 1)}</span>
      </div>
      <div className="collection-layout">
        <aside className="collection-index"><details open><summary>篇章目录 <span>INDEX</span></summary><ol>{posts.map((post, index) => <li key={post.slug}><Link to={`/journal/post/${post.slug}`}><span>{(index + 1).toString().padStart(2, '0')}</span>{post.title}</Link></li>)}</ol></details><Link className="archive-back-link" to={`/journal?collection=${collection.id}`}>在归档中浏览 ↗</Link></aside>
        <section aria-labelledby="collection-content-title" className="collection-content"><div className="archive-results-heading"><h2 id="collection-content-title">全部篇章</h2><span className="archive-order-note">按最近更新排列</span></div>{posts.map((post) => <ArchivePostRow key={post.slug} post={post} />)}<p className="archive-endnote">— 这一册，仍在继续。</p></section>
      </div>
    </section>
  );
}

export default CollectionPage;

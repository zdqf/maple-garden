import { Link } from 'react-router-dom';

import { getArticleCategoryName } from '../../config/articleCategories';
import { getContentCollection } from '../../config/contentCollections';
import type { PublishedPost } from '../../content/postRepository';

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai',
});

export function ArchivePostRow({ post }: { post: PublishedPost }): React.JSX.Element {
  const collection = post.collection ? getContentCollection(post.collection) : undefined;
  return (
    <article className="archive-post">
      <time className="archive-post-date" dateTime={post.publishedAt}>
        {dateFormatter.format(new Date(post.publishedAt)).replace('/', '.')}
      </time>
      <div className="archive-post-content">
        <h3 className="archive-post-title"><Link to={`/journal/post/${post.slug}`}>{post.title}</Link></h3>
        <p className="archive-post-description">{post.description}</p>
        <div className="archive-post-meta">
          <Link to={`/journal/category/${post.category}`}>{getArticleCategoryName(post.category)}</Link>
          {collection ? <Link to={`/journal/collection/${collection.id}`}>{collection.title}</Link> : null}
          <span>{post.readingTime} 分钟阅读</span>
        </div>
      </div>
      <Link aria-label={`阅读：${post.title}`} className="archive-post-arrow" to={`/journal/post/${post.slug}`}>
        <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}

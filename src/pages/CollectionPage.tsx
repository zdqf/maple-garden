import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { usePageMeta } from '../components/common/PageMeta';
import { getArticleCategoryName } from '../config/articleCategories';
import { getContentCollection } from '../config/contentCollections';
import { getPostsInCollection } from '../content/postRepository';
import NotFoundPage from './NotFoundPage';

export function CollectionPage(): React.JSX.Element {
  const { collection: collectionId } = useParams<{ collection?: string }>();
  const collection =
    collectionId === undefined ? undefined : getContentCollection(collectionId);
  const posts = collection === undefined ? [] : getPostsInCollection(collection.id);
  const [directoryOpen, setDirectoryOpen] = useState(false);

  usePageMeta(
    collection ? `${collection.title} · Maple-Garden` : '内容目录未找到 · Maple-Garden',
    collection?.description ?? '请求的内容目录不存在。',
    collection === undefined || posts.length === 0,
  );

  useEffect(() => {
    if (!directoryOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setDirectoryOpen(false);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [directoryOpen]);

  if (collection === undefined || posts.length === 0) {
    return <NotFoundPage resource="route" />;
  }

  return (
    <section aria-labelledby="collection-title" className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {getArticleCategoryName(collection.category)} / CONTENT COLLECTION
          </p>
          <div className="collection-title-row">
            <h1 id="collection-title">{collection.title}</h1>
            <button
              className="button button-ghost"
              type="button"
              onClick={() => setDirectoryOpen(true)}
            >
              目录
            </button>
          </div>
          <p className="lede">{collection.description}</p>
        </div>
        <Link
          className="button button-ghost"
          to={`/journal/category/${collection.category}`}
        >
          返回{getArticleCategoryName(collection.category)}
        </Link>
      </div>

      <section aria-labelledby="collection-content-title" className="stack-md">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CONTENT</p>
            <h2 id="collection-content-title">内容</h2>
          </div>
          <span className="result-count">{posts.length} 篇内容</span>
        </div>

        <div className="article-list">
          {posts.map((post) => (
            <article className="content-card" key={post.slug}>
              <div className="card-topline">
                <span className="tag">{getArticleCategoryName(post.category)}</span>
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
                </time>
              </div>
              <h3>
                <Link className="card-link" to={`/journal/post/${post.slug}`}>
                  {post.title}
                </Link>
              </h3>
              <p>{post.description}</p>
              <div className="tag-list">
                {post.tags.map((tag) => (
                  <Link
                    className="tag"
                    key={tag}
                    to={`/journal/tag/${encodeURIComponent(tag)}`}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {directoryOpen ? (
        <div
          aria-label={`${collection.title}目录`}
          className="collection-modal-backdrop"
          role="presentation"
        >
          <section
            aria-labelledby="collection-modal-title"
            aria-modal="true"
            className="collection-modal"
            role="dialog"
          >
            <div className="collection-modal-header">
              <div>
                <p className="eyebrow">TABLE OF CONTENTS</p>
                <h2 id="collection-modal-title">{collection.title} · 目录</h2>
              </div>
              <button
                aria-label="关闭目录"
                className="button button-ghost"
                type="button"
                onClick={() => setDirectoryOpen(false)}
              >
                关闭
              </button>
            </div>
            <ol className="collection-modal-list">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link to={`/journal/post/${post.slug}`}>
                    {post.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export default CollectionPage;

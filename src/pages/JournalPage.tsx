import { Link, useParams } from 'react-router-dom';

import { EmptyState } from '../components/common/forms';
import { usePageMeta } from '../components/common/PageMeta';
import {
  articleCategories,
  getArticleCategoryName,
} from '../config/articleCategories';
import { contentCollections } from '../config/contentCollections';
import {
  getPostCategories,
  getPostTags,
  publishedPosts,
} from '../content/postRepository';

export function JournalPage(): React.JSX.Element {
  const { category, tag } = useParams<{ category?: string; tag?: string }>();
  usePageMeta('日志 · Maple-Garden', '浏览 Maple-Garden 的分类文章和个人记录。');

  const decodedTag = tag === undefined ? undefined : decodeURIComponent(tag);
  const decodedCategory =
    category === undefined ? undefined : decodeURIComponent(category);
  const posts = publishedPosts.filter(
    (post) =>
      (!decodedTag || post.tags.includes(decodedTag)) &&
      (!decodedCategory || post.category === decodedCategory),
  );
  const filterLabel =
    decodedTag === undefined && decodedCategory === undefined
      ? ''
      : ` · ${decodedTag ?? getArticleCategoryName(decodedCategory ?? '')}`;
  const categoryCounts = new Map<string, number>();
  for (const post of publishedPosts) {
    categoryCounts.set(post.category, (categoryCounts.get(post.category) ?? 0) + 1);
  }

  const collectionEntries = contentCollections
    .filter((collection) => {
      if (decodedCategory !== undefined && collection.category !== decodedCategory) {
        return false;
      }
      return posts.some((post) => post.collection === collection.id);
    })
    .map((collection) => ({
      collection,
      posts: posts.filter((post) => post.collection === collection.id),
    }));
  const standalonePosts = posts.filter((post) => post.collection === undefined);

  return (
    <section aria-labelledby="journal-title" className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">JOURNAL / MAPLE-GRADEN</p>
          <h1 id="journal-title">日志</h1>
          <p className="filter-context">
            {filterLabel
              ? `当前筛选：${filterLabel.replace(' · ', '')}`
              : '先进入栏目，再浏览其中的内容目录。'}
          </p>
          <p className="lede">
            每个栏目可以包含书籍、系列或独立文章，进入目录后再快速定位具体内容。
          </p>
        </div>
        <Link className="button button-ghost" to="/journal">
          清除筛选
        </Link>
      </div>

      <section aria-labelledby="category-board-title" className="stack-md">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CONTENT AREAS</p>
            <h2 id="category-board-title">内容栏目</h2>
          </div>
          <span className="result-count">{articleCategories.length} 个栏目</span>
        </div>
        <div className="category-grid">
          {articleCategories.map((item) => (
            <Link
              className={
                item.id === decodedCategory
                  ? 'category-card active'
                  : 'category-card'
              }
              key={item.id}
              to={`/journal/category/${item.id}`}
            >
              <span className="tag">{item.name}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <strong>{categoryCounts.get(item.id) ?? 0} 篇内容</strong>
            </Link>
          ))}
        </div>
      </section>

      <div className="filter-links">
        <span>分类：</span>
        {getPostCategories().map((item) => (
          <Link
            className={item === decodedCategory ? 'active' : ''}
            key={item}
            to={`/journal/category/${encodeURIComponent(item)}`}
          >
            {getArticleCategoryName(item)}
          </Link>
        ))}
        <span>标签：</span>
        {getPostTags().map((item) => (
          <Link
            className={item === decodedTag ? 'active' : ''}
            key={item}
            to={`/journal/tag/${encodeURIComponent(item)}`}
          >
            {item}
          </Link>
        ))}
      </div>

      {collectionEntries.length > 0 ? (
        <section aria-labelledby="collection-list-title" className="stack-md">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CONTENT INDEX</p>
              <h2 id="collection-list-title">内容目录</h2>
            </div>
            <span className="result-count">{collectionEntries.length} 个内容集</span>
          </div>
          <div className="card-grid">
            {collectionEntries.map(({ collection, posts: collectionPosts }) => (
              <Link
                className="content-card card-link"
                key={collection.id}
                to={`/journal/collection/${collection.id}`}
              >
                <div className="card-topline">
                  <span className="tag">
                    {getArticleCategoryName(collection.category)}
                  </span>
                  <span>{collectionPosts.length} 篇内容</span>
                </div>
                <h3>{collection.title}</h3>
                <p>{collection.description}</p>
                <small>进入内容目录 →</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {standalonePosts.length > 0 ? (
        <section aria-labelledby="standalone-list-title" className="stack-md">
          <div className="section-heading">
            <div>
              <p className="eyebrow">STANDALONE NOTES</p>
              <h2 id="standalone-list-title">独立文章</h2>
            </div>
            <span className="result-count">{standalonePosts.length} 篇文章</span>
          </div>
          <div className="article-list">
            {standalonePosts.map((post) => (
              <article className="content-card" key={post.slug}>
                <div className="card-topline">
                  <span className="tag">{getArticleCategoryName(post.category)}</span>
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
                  </time>
                </div>
                <h2>
                  <Link to={`/journal/post/${post.slug}`}>{post.title}</Link>
                </h2>
                <p>{post.description}</p>
                <div className="tag-list">
                  {post.tags.map((item) => (
                    <Link
                      className="tag"
                      key={item}
                      to={`/journal/tag/${encodeURIComponent(item)}`}
                    >
                      {item}
                    </Link>
                  ))}
                  <span>{post.readingTime} min read</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {collectionEntries.length === 0 && standalonePosts.length === 0 ? (
        <EmptyState
          action={<Link to="/journal">查看全部内容</Link>}
          description="换一个栏目或返回全部内容。"
          title="没有匹配内容"
        />
      ) : null}
    </section>
  );
}

export default JournalPage;

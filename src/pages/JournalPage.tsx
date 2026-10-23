import { Link, useParams } from 'react-router-dom';

import { EmptyState } from '../components/common/forms';
import { usePageMeta } from '../components/common/PageMeta';
import {
  articleCategories,
  getArticleCategoryName,
} from '../config/articleCategories';
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

  return (
    <section aria-labelledby="journal-title" className="stack-lg">
      <div className="page-heading">
        <div>
          <p className="eyebrow">JOURNAL / MAPLE-GRADEN</p>
          <h1 id="journal-title">日志</h1>
          <p className="filter-context">
            {filterLabel
              ? `当前筛选：${filterLabel.replace(' · ', '')}`
              : '按兴趣板块收纳你的长期记录。'}
          </p>
          <p className="lede">
            每篇文章来自 content/posts，分类由 frontmatter 的 category 字段决定。
          </p>
        </div>
        <Link className="button button-ghost" to="/journal">
          清除筛选
        </Link>
      </div>

      <section aria-labelledby="category-board-title" className="stack-md">
        <div className="section-heading">
          <div>
            <p className="eyebrow">COLLECTIONS</p>
            <h2 id="category-board-title">兴趣板块</h2>
          </div>
          <span className="result-count">{articleCategories.length} 个板块</span>
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
              <strong>{categoryCounts.get(item.id) ?? 0} 篇文章</strong>
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

      {posts.length === 0 ? (
        <EmptyState
          action={<Link to="/journal">查看全部文章</Link>}
          description="换一个板块或返回全部日志。"
          title="没有匹配文章"
        />
      ) : (
        <div className="article-list">
          {posts.map((post) => (
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
      )}
    </section>
  );
}

export default JournalPage;

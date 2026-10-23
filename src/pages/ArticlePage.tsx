import { Children, useEffect, useRef, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { CopyButton } from '../components/common/forms';
import { usePageMeta } from '../components/common/PageMeta';
import { getArticleCategoryName } from '../config/articleCategories';
import { findPublishedPost, publishedPosts } from '../content/postRepository';
import NotFoundPage from './NotFoundPage';

function nodeText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) =>
      typeof child === 'string' || typeof child === 'number' ? String(child) : '',
    )
    .join('');
}

function headingSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

export function ArticlePage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const post = slug === undefined ? undefined : findPublishedPost(slug);
  const [searchParams] = useSearchParams();
  const headingRef = useRef<HTMLElement | null>(null);
  usePageMeta(
    post ? `${post.title} · Maple-Garden` : '文章未找到 · Maple-Garden',
    post?.description ?? '请求的文章不存在。',
    post === undefined,
  );

  useEffect(() => {
    const requested = searchParams.get('heading');
    if (!requested) return;
    const element = document.getElementById(requested);
    if (element instanceof HTMLElement) {
      headingRef.current = element;
      element.tabIndex = -1;
      element.focus({ preventScroll: true });
      element.scrollIntoView({ block: 'start' });
    }
  }, [searchParams]);

  if (post === undefined) return <NotFoundPage resource="article" />;
  const index = publishedPosts.findIndex((item) => item.slug === post.slug);
  const previous = index < publishedPosts.length - 1 ? publishedPosts[index + 1] : undefined;
  const next = index > 0 ? publishedPosts[index - 1] : undefined;
  const headingQueues = new Map<string, string[]>();
  for (const heading of post.headings) {
    const key = heading.text.toLowerCase();
    const queue = headingQueues.get(key) ?? [];
    queue.push(heading.id);
    headingQueues.set(key, queue);
  }
  const takeHeadingId = (children: React.ReactNode) => {
    const text = nodeText(children);
    const queue = headingQueues.get(text.toLowerCase());
    return queue?.shift() ?? headingSlug(text);
  };

  return (
    <article aria-labelledby="article-title" className="stack-lg">
      <header className="article-header">
        <p className="eyebrow">
          {getArticleCategoryName(post.category)} / {post.readingTime} MIN READ
        </p>
        <h1 id="article-title">{post.title}</h1>
        <p className="lede">{post.description}</p>
        <div className="tag-list">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('zh-CN')}
          </time>
          <span>作者：{post.author}</span>
          <Link className="tag" to={`/journal/category/${encodeURIComponent(post.category)}`}>
            {getArticleCategoryName(post.category)}
          </Link>
          {post.tags.map((tag) => (
            <Link className="tag" key={tag} to={`/journal/tag/${encodeURIComponent(tag)}`}>
              {tag}
            </Link>
          ))}
        </div>
      </header>

      <div className="article-layout">
        {post.headings.length > 0 ? (
          <aside aria-label="文章目录" className="toc">
            <strong>目录</strong>
            <ol>
              {post.headings.map((heading) => (
                <li className={heading.level === 3 ? 'toc-child' : undefined} key={heading.id}>
                  <a href={`?heading=${encodeURIComponent(heading.id)}`}>{heading.text}</a>
                </li>
              ))}
            </ol>
          </aside>
        ) : null}
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => <h2 id={takeHeadingId(children)}>{children}</h2>,
              h3: ({ children }) => <h3 id={takeHeadingId(children)}>{children}</h3>,
              pre: ({ children }) => <div className="code-block">{children}</div>,
              code: ({ children, className }) => (
                <div className="code-content">
                  <div className="code-label">
                    <span>{className?.replace('language-', '') ?? 'code'}</span>
                    <CopyButton label="复制" text={nodeText(children).replace(/\n$/, '')} />
                  </div>
                  <pre><code className={className}>{children}</code></pre>
                </div>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  target={href?.startsWith('http') ? '_blank' : undefined}
                >
                  {children}
                </a>
              ),
              img: ({ alt, src }) => <img alt={alt ?? ''} loading="lazy" src={src} />,
            }}
          >
            {post.body}
          </ReactMarkdown>
        </div>
      </div>

      <p className="article-rights">
        {post.copyright} · 作者：{post.author}
      </p>

      <nav aria-label="文章前后篇" className="article-nav">
        {previous ? (
          <Link className="content-card" to={`/journal/post/${previous.slug}`}>
            <small>上一篇</small>
            <strong>{previous.title}</strong>
          </Link>
        ) : <span />}
        {next ? (
          <Link className="content-card next" to={`/journal/post/${next.slug}`}>
            <small>下一篇</small>
            <strong>{next.title}</strong>
          </Link>
        ) : <span />}
      </nav>
    </article>
  );
}

export default ArticlePage;

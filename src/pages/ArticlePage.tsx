import { Children, isValidElement, memo, useEffect, useRef, useState, type ReactNode } from 'react';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { CopyButton } from '../components/common/forms';
import { usePageMeta } from '../components/common/PageMeta';
import { getArticleCategoryName } from '../config/articleCategories';
import { getContentCollection } from '../config/contentCollections';
import { findPublishedPost, publishedPosts, type PublishedPost } from '../content/postRepository';
import NotFoundPage from './NotFoundPage';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('python', python);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

function nodeText(children: ReactNode): string {
  return Children.toArray(children).map((child) => {
    if (typeof child === 'string' || typeof child === 'number') return String(child);
    return isValidElement<{ children?: ReactNode }>(child) ? nodeText(child.props.children) : '';
  }).join('');
}

function headingSlug(text: string): string {
  return text.toLowerCase().trim().replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, '-').replace(/^-+|-+$/g, '') || 'section';
}

function focusHeading(id: string): void {
  const element = document.getElementById(id);
  if (element instanceof HTMLElement) {
    element.tabIndex = -1;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: 'start' });
  }
}

function MarkdownCodeBlock({ children }: Readonly<{ children?: ReactNode }>): React.JSX.Element {
  const code = Children.toArray(children)[0];
  const props = isValidElement<{ children?: ReactNode; className?: string }>(code) ? code.props : undefined;
  const text = nodeText(props?.children ?? children).replace(/\n$/, '');
  const language = props?.className?.replace('language-', '') ?? '';
  const highlighted = language && hljs.getLanguage(language) ? hljs.highlight(text, { language }).value : undefined;

  return <div className="code-block">
    <div className="code-label"><span>{language || 'text'}</span><CopyButton label="复制代码" text={text} /></div>
    <pre>{highlighted === undefined ? <code>{text}</code> : <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />}</pre>
  </div>;
}

const ArticleMarkdown = memo(function ArticleMarkdown({ post }: Readonly<{ post: PublishedPost }>): React.JSX.Element {
  const headingQueues = new Map<string, string[]>();
  for (const heading of post.headings) {
    const key = heading.text.toLowerCase().replace(/[`*_]/g, '');
    const queue = headingQueues.get(key) ?? [];
    queue.push(heading.id);
    headingQueues.set(key, queue);
  }
  const takeHeadingId = (children: ReactNode) => {
    const text = nodeText(children);
    return headingQueues.get(text.toLowerCase())?.shift() ?? headingSlug(text);
  };
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
    h2: ({ children }) => <h2 id={takeHeadingId(children)}>{children}</h2>,
    h3: ({ children }) => <h3 id={takeHeadingId(children)}>{children}</h3>,
    pre: ({ children }) => <MarkdownCodeBlock>{children}</MarkdownCodeBlock>,
    code: ({ children, className }) => <code className={className}>{children}</code>,
    a: ({ children, href }) => <a href={href} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined} target={href?.startsWith('http') ? '_blank' : undefined}>{children}</a>,
    img: ({ alt, src }) => <img alt={alt ?? ''} loading="lazy" src={src} />,
    table: ({ children }) => <div className="markdown-table-wrap"><table>{children}</table></div>,
  }}>{post.body}</ReactMarkdown>;
});

export function ArticlePage(): React.JSX.Element {
  const { slug } = useParams<{ slug: string }>();
  const post = slug === undefined ? undefined : findPublishedPost(slug);
  const [searchParams, setSearchParams] = useSearchParams();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [reading, setReading] = useState({ percent: 0, heading: '' });
  usePageMeta(post ? `${post.title} · Maple-Garden` : '文章未找到 · Maple-Garden', post?.description ?? '请求的文章不存在。', post === undefined);

  useEffect(() => {
    const requested = searchParams.get('heading');
    if (requested) focusHeading(requested);
  }, [searchParams, slug]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const body = bodyRef.current;
      if (!body || !post) return;
      const rect = body.getBoundingClientRect();
      const distance = Math.max(1, rect.height - window.innerHeight + 160);
      const percent = Math.round(Math.min(100, Math.max(0, (160 - rect.top) / distance * 100)));
      const heading = [...body.querySelectorAll('h2[id], h3[id]')].reverse().find((item) => item.getBoundingClientRect().top <= 170)?.id ?? '';
      setReading((current) => current.percent === percent && current.heading === heading ? current : { percent, heading });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [post]);

  if (post === undefined) return <NotFoundPage resource="article" />;
  const categoryName = getArticleCategoryName(post.category);
  const collection = post.collection ? getContentCollection(post.collection) : undefined;
  const sequence = post.collection ? publishedPosts.filter((item) => item.collection === post.collection) : publishedPosts;
  const index = sequence.findIndex((item) => item.slug === post.slug);
  const previous = sequence[index + 1];
  const next = index > 0 ? sequence[index - 1] : undefined;
  const related = publishedPosts.filter((item) => item.slug !== post.slug && (item.category === post.category || item.tags.some((tag) => post.tags.includes(tag)))).slice(0, 3);
  const navigateHeading = (id: string) => {
    if (searchParams.get('heading') === id) {
      focusHeading(id);
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.set('heading', id);
    setSearchParams(params, { replace: true, preventScrollReset: true });
  };

  return <article aria-labelledby="article-title" className="article-page">
    <nav aria-label="文章位置" className="article-breadcrumb">
      <Link to="/journal">全部归档</Link><span aria-hidden="true">/</span>
      <Link to={`/journal/category/${post.category}`}>{categoryName}</Link>
      {collection ? <><span aria-hidden="true">/</span><Link to={`/journal/collection/${collection.id}`}>{collection.title}</Link></> : null}
    </nav>
    <header className="article-hero">
      <p className="eyebrow">{post.category === 'poetry' ? 'POETRY & PROSE' : 'NOTES FROM THE GARDEN'} <span aria-hidden="true">·</span> {categoryName}</p>
      <h1 id="article-title">{post.title}</h1>
      <p className="lede">{post.description}</p>
      <div className="article-meta">
        <span>{post.author}</span><span aria-hidden="true">·</span>
        <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
        <span aria-hidden="true">·</span><span>约 {post.readingTime} 分钟</span>
      </div>
    </header>

    <div className={`reading-layout${post.category === 'poetry' ? ' reading-layout-poetry' : ''}`}>
      <aside aria-label="阅读导航" className="reading-sidebar">
        <div className="reading-progress-label"><span className="reading-sidebar-label">阅读进度</span><span>{reading.percent}%</span></div>
        <div aria-hidden="true" className="reading-progress-track"><div className="reading-progress-fill" style={{ width: `${reading.percent}%` }} /></div>
        {post.headings.length > 0 ? <details className="reading-toc" open>
          <summary>本文目录</summary>
          <ol>{post.headings.map((heading) => <li className={heading.level === 3 ? 'toc-child' : undefined} key={heading.id}>
            <button aria-current={reading.heading === heading.id ? 'location' : undefined} className={reading.heading === heading.id ? 'reading-toc-active' : undefined} onClick={() => navigateHeading(heading.id)} type="button">{heading.text.replace(/[`*_]/g, '')}</button>
          </li>)}</ol>
        </details> : <p className="reading-sidebar-note">慢慢读，让文字停留一会儿。</p>}
        {collection ? <Link className="reading-collection-link" to={`/journal/collection/${collection.id}`}><span className="reading-sidebar-label">收录于</span><strong>{collection.title} <span aria-hidden="true">↗</span></strong></Link> : null}
        <Link className="reading-back" to="/journal">← 返回归档</Link>
      </aside>

      <div className="reading-content">
        <div className={post.category === 'poetry' ? 'markdown-body poetry-body' : 'markdown-body'} ref={bodyRef}>
          <ArticleMarkdown post={post} />
        </div>
        <footer className="article-endnote">
          <span aria-hidden="true" className="article-endmark">✳</span>
          <div className="tag-list">{post.tags.map((tag) => <Link className="tag" key={tag} to={`/journal/tag/${encodeURIComponent(tag)}`}># {tag}</Link>)}</div>
          <p className="article-rights">{post.copyright}<br />作者：{post.author}</p>
        </footer>
      </div>
    </div>

    <nav aria-label="文章前后篇" className="article-nav">
      {previous ? <Link className="content-card" to={`/journal/post/${previous.slug}`}><small>← 上一篇{collection ? ` · ${collection.title}` : ''}</small><strong>{previous.title}</strong></Link> : <span />}
      {next ? <Link className="content-card next" to={`/journal/post/${next.slug}`}><small>下一篇{collection ? ` · ${collection.title}` : ''} →</small><strong>{next.title}</strong></Link> : <span />}
    </nav>
    {related.length > 0 ? <section aria-labelledby="related-title" className="article-related">
      <div className="section-heading"><div><p className="eyebrow">KEEP WANDERING</p><h2 id="related-title">沿着文字，继续走走</h2></div><Link to={`/journal/category/${post.category}`}>更多{categoryName} ↗</Link></div>
      <div className="article-related-list">{related.map((item) => <Link key={item.slug} to={`/journal/post/${item.slug}`}><span>{getArticleCategoryName(item.category)}</span><strong>{item.title}</strong><span aria-hidden="true">↗</span></Link>)}</div>
    </section> : null}
  </article>;
}

export default ArticlePage;

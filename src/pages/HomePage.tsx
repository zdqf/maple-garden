import { Link } from 'react-router-dom';

import { usePageMeta } from '../components/common/PageMeta';
import { articleCategories, getArticleCategoryName } from '../config/articleCategories';
import { contentCollections } from '../config/contentCollections';
import { personalConfig } from '../config/personal';
import { projectCatalog } from '../config/projects';
import { toolRegistry } from '../config/tools';
import { getPostsInCollection, getRecentPosts, publishedPosts } from '../content/postRepository';

function GardenPrint(): React.JSX.Element {
  return <div aria-hidden="true" className="garden-print">
    <span className="print-coordinate">FIG. 01 / ACER</span>
    <svg className="garden-drawing" viewBox="0 0 360 340" fill="none">
      <defs><pattern id="garden-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="currentColor" opacity=".26" /></pattern></defs>
      <rect x="12" y="8" width="336" height="312" fill="url(#garden-grid)" />
      <g className="print-guides" stroke="currentColor" strokeWidth=".6"><circle cx="180" cy="163" r="112" /><ellipse cx="180" cy="163" rx="148" ry="58" transform="rotate(-30 180 163)" /><path d="M180 24v282M33 163h294" strokeDasharray="3 5" /><path d="M26 24h12m-6-6v12M322 300h12m-6-6v12" /></g>
      <g className="print-leaf" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
        <path d="m179 56 18 54 27-18-4 45 45-14-17 34 37 10-52 38 8 24-54-8-8 50-7-51-52 9 7-25-50-39 37-10-17-33 44 14-3-45 25 18Z" fill="currentColor" fillOpacity=".055" />
        <path d="M179 71v199m0-73 37-79m-37 79-37-79m37 91 67-65m-67 65-66-65m66 76 83-43m-83 43-82-43m82 43 45 4m-45-4-44 4" />
      </g>
      <circle cx="180" cy="163" r="3" fill="currentColor" className="print-center" />
    </svg>
    <div className="print-caption"><span>自然生长，自由连接。</span><span>01 — ∞</span></div>
  </div>;
}

export function HomePage(): React.JSX.Element {
  usePageMeta(personalConfig.site.title, personalConfig.site.description);
  const recentPosts = getRecentPosts(4);
  const collection = contentCollections.find((item) => item.id === 'zhu-zhang') ?? contentCollections[0];
  const project = projectCatalog.find((item) => item.featured);

  return <div className="home-page">
    <section aria-labelledby="home-title" className="garden-hero">
      <div className="hero-text">
        <p className="eyebrow"><span className="status-dot" /> AN INDEPENDENT DIGITAL GARDEN</p>
        <h1 id="home-title">一枚枫叶，<br />也是一座<span>花园。</span></h1>
        <p className="hero-copy">我是{personalConfig.identity.name}。在代码里构建，在文字里漫游。<br className="desktop-break" />这里收纳诗歌、技术与生活，也留一点空间给未完成的想法。</p>
        <div className="hero-actions"><Link className="button button-primary" to="/journal">走进花园 <span aria-hidden="true">↗</span></Link><Link className="quiet-link" to="/about">认识一下 <span aria-hidden="true">→</span></Link></div>
      </div>
      <GardenPrint />
    </section>
    <nav aria-label="按主题探索" className="home-topics"><span className="micro-label">EXPLORE THE GARDEN</span><div>{articleCategories.map((category) => <Link key={category.id} to={`/journal/category/${category.id}`}>{category.name}<span>{String(publishedPosts.filter((post) => post.category === category.id).length).padStart(2, '0')}</span></Link>)}</div></nav>
    <div className="home-columns">
      <section aria-labelledby="recent-title" className="home-writing">
        <div className="section-heading"><div><p className="eyebrow">THE LATEST</p><h2 id="recent-title">最近写下的</h2></div><Link className="quiet-link" to="/journal">全部文章 <span aria-hidden="true">↗</span></Link></div>
        <div className="home-posts">{recentPosts.map((post, index) => <article className="home-post" key={post.slug}>
          <div className="home-post-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
          <div className="home-post-copy"><div className="home-post-meta"><span>{getArticleCategoryName(post.category)}</span><span aria-hidden="true">/</span><time dateTime={post.publishedAt}>{post.publishedAt.slice(0, 10).replaceAll('-', '.')}</time></div><h3><Link to={`/journal/post/${post.slug}`}>{post.title}<span aria-hidden="true">↗</span></Link></h3><p>{post.description}</p><span className="reading-time">{post.readingTime} 分钟阅读</span></div>
        </article>)}</div>
        {recentPosts.length === 0 ? <p className="empty-state">第一篇文章正在酝酿，过些时候再来看看。</p> : null}
      </section>
      <aside aria-label="花园拾光" className="home-aside">
        {collection ? <section className="collection-feature"><div className="collection-feature-top"><span className="eyebrow">ON THE BOOKSHELF</span><span aria-hidden="true">↗</span></div><Link className="book-cover" to={`/journal/collection/${collection.id}`}><span className="book-edition">{personalConfig.identity.name} · 诗集</span><span className="book-title">{collection.title}</span><span className="book-line" /><span className="book-caption">一些文字，慢慢长成一本书。</span><span className="book-stamp" aria-hidden="true">{personalConfig.identity.name}</span></Link><div className="collection-feature-bottom"><Link to={`/journal/collection/${collection.id}`}>翻开《{collection.title}》 <span aria-hidden="true">→</span></Link><span>{getPostsInCollection(collection.id).length} 篇作品</span></div></section> : null}
        <section className="garden-note"><span className="micro-label">A NOTE FROM THE GARDENER</span><p>把想法写下来，<br />让它们有地方生长。</p><Link className="quiet-link" to="/about">关于这座花园 <span aria-hidden="true">↗</span></Link></section>
      </aside>
    </div>
    <section aria-labelledby="workbench-title" className="home-workbench"><div className="section-heading"><div><p className="eyebrow">IDEAS INTO PRACTICE</p><h2 id="workbench-title">文字之外，也动手造物。</h2></div><Link className="quiet-link" to="/projects">我的项目 <span aria-hidden="true">↗</span></Link></div><div className="workbench-grid"><Link className="workbench-project" to="/projects"><span className="workbench-symbol" aria-hidden="true">&#123; mg &#125;</span><div><span className="micro-label">CURRENT PROJECT</span><h3>{project?.name ?? personalConfig.site.title}</h3><p>{project?.summary ?? personalConfig.site.description}</p></div><span className="workbench-arrow" aria-hidden="true">↗</span></Link><div className="workbench-tools"><div><span className="micro-label">POCKET TOOLKIT</span><Link className="quiet-link" to="/tools">{toolRegistry.length} 个小工具 <span aria-hidden="true">↗</span></Link></div><p>为日常开发，省一点力气。</p><div className="mini-tools">{toolRegistry.slice(0, 3).map((tool) => <Link key={tool.id} to={`/tools/${tool.id}`}>{tool.name}<span aria-hidden="true">↗</span></Link>)}</div></div></div></section>
    <p className="home-colophon"><span aria-hidden="true">✳</span> 这座花园没有围墙，欢迎随时回来走走。<span>KEEP GROWING, KEEP CURIOUS.</span></p>
  </div>;
}

export default HomePage;

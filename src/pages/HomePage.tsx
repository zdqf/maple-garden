import { Link } from 'react-router-dom';

import { PlaceholderBadge } from '../components/common/forms';
import { usePageMeta } from '../components/common/PageMeta';
import { projectCatalog } from '../config/projects';
import { personalConfig } from '../config/personal';
import { toolRegistry } from '../config/tools';
import { projectToCardModel } from '../domain/shared/configProjection';
import { getArticleCategoryName } from '../config/articleCategories';
import { getRecentPosts } from '../content/postRepository';

export function HomePage(): React.JSX.Element {
  usePageMeta(personalConfig.site.title, personalConfig.site.description);
  const featuredProjects = projectCatalog.filter(({ featured }) => featured).map(projectToCardModel);
  const recentPosts = getRecentPosts(3);

  return (
    <div className="stack-lg">
      <section aria-labelledby="home-title" className="hero-card">
        <p className="eyebrow">DEVELOPER GARDEN / LOCAL-FIRST</p>
        <h1 id="home-title">{personalConfig.site.title}</h1>
        <p className="hero-copy">{personalConfig.site.description}</p>
        <p className="placeholder-line">当前身份与个人简介：<PlaceholderBadge /></p>
        <div className="button-row">
          <Link className="button button-primary" to="/projects">浏览项目</Link>
          <Link className="button button-ghost" to="/tools">打开本地工具</Link>
        </div>
      </section>

      <section aria-labelledby="now-title" className="now-strip">
        <div><p className="eyebrow">NOW</p><h2 id="now-title">正在搭建内容与工具的最小闭环</h2></div>
        <p>个人信息、经历和成果保持集中配置；尚未提供的真实资料明确标为 <PlaceholderBadge />。</p>
      </section>

      <section aria-labelledby="featured-title" className="stack-md">
        <div className="section-heading"><div><p className="eyebrow">SELECTED WORK</p><h2 id="featured-title">精选项目</h2></div><Link to="/projects">查看全部 →</Link></div>
        {featuredProjects.length === 0 ? <p className="empty-state">还没有精选项目。<Link to="/projects">前往项目页</Link></p> : <div className="card-grid">{featuredProjects.map((project) => <article className="content-card" key={project.id}><div className="card-topline"><span className="tag">{project.category}</span><span>{project.status}</span></div><h3><span aria-hidden="true">{project.name}</span><span className="sr-only">项目卡片</span></h3><p>{project.summary}</p><p className="tag-list">{project.technologies.join(' · ')}</p>{project.hasPlaceholder ? <PlaceholderBadge /> : null}</article>)}</div>}
      </section>

      <section aria-labelledby="recent-title" className="stack-md">
        <div className="section-heading"><div><p className="eyebrow">JOURNAL</p><h2 id="recent-title">最近文章</h2></div><Link to="/journal">查看日志 →</Link></div>
        {recentPosts.length === 0 ? <p className="empty-state">还没有已发布文章。<Link to="/journal">前往日志页</Link></p> : <div className="card-grid">{recentPosts.map((post) => <Link className="content-card card-link" key={post.slug} to={`/journal/post/${post.slug}`}><span className="tag">{getArticleCategoryName(post.category)}</span><h3>{post.title}</h3><p>{post.description}</p><small>{post.readingTime} min read · {post.tags.join(' · ')}</small></Link>)}</div>}
      </section>

      <section aria-labelledby="tools-preview-title" className="stack-md">
        <div className="section-heading"><div><p className="eyebrow">BROWSER TOOLKIT</p><h2 id="tools-preview-title">本地工具预览</h2></div><Link to="/tools">打开工具箱 →</Link></div>
        <div className="tool-preview-grid">{toolRegistry.slice(0, 4).map((tool) => <Link className="tool-chip" key={tool.id} to={`/tools/${tool.id}`}><strong>{tool.name}</strong><span>{tool.capability}</span></Link>)}</div>
      </section>
    </div>
  );
}

export default HomePage;

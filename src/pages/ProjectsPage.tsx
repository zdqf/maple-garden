import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ExternalLink, PlaceholderBadge } from '../components/common/forms';
import { usePageMeta } from '../components/common/PageMeta';
import { SearchInput } from '../components/common/SearchInput';
import { projectCatalog } from '../config/projects';
import { projectToCardModel } from '../domain/shared/configProjection';

function valuesFor(key: 'category' | 'status' | 'technology'): readonly string[] {
  const records = projectCatalog.map(projectToCardModel);
  const values = records.flatMap((record) => key === 'technology' ? record.technologies : [record[key]]);
  return [...new Set(values)].sort();
}

const statusLabels: Readonly<Record<string, string>> = { 'in-progress': '持续生长中', 'completed': '已完成', 'maintained': '持续维护', 'archived': '已归档', 'planned': '计划中' };

export function ProjectsPage(): React.JSX.Element {
  usePageMeta('项目 · Maple-Garden', '将想法变成可以使用的作品，记录它们持续生长的过程。');
  const [params, setParams] = useSearchParams();
  const query = params.get('q')?.trim().toLowerCase() ?? '';
  const category = params.get('category') ?? '';
  const status = params.get('status') ?? '';
  const technology = params.get('technology') ?? '';
  const projects = useMemo(() => projectCatalog.map(projectToCardModel).filter((project) => {
    const haystack = [project.name, project.summary, ...project.technologies, ...project.tags].join(' ').toLowerCase();
    return (!query || haystack.includes(query)) && (!category || project.category === category) && (!status || project.status === status) && (!technology || project.technologies.includes(technology));
  }), [category, query, status, technology]);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const clear = () => setParams({});

  return <section aria-labelledby="projects-title" className="stack-lg projects-page">
    <div className="page-heading"><div><p className="eyebrow">IDEAS, MADE REAL</p><h1 id="projects-title">项目</h1><p className="lede">把想法写成代码，把代码慢慢打磨成作品。</p></div><span className="page-index" aria-hidden="true">03 / PROJECTS</span></div>
    <div className="project-toolbar"><label className="project-search"><span className="sr-only">搜索项目</span><SearchInput onValueChange={(value) => update('q', value)} placeholder="搜索项目、技术或标签…" value={params.get('q') ?? ''} /></label><span className="result-count" role="status">{projects.length} 个作品</span></div>
    <details className="project-filters" open={Boolean(category || status || technology)}><summary>按分类、状态或技术筛选</summary><div className="filter-panel" aria-label="项目筛选"><label>分类<select onChange={(event) => update('category', event.target.value)} value={category}><option value="">全部分类</option>{valuesFor('category').map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>状态<select onChange={(event) => update('status', event.target.value)} value={status}><option value="">全部状态</option>{valuesFor('status').map((value) => <option key={value} value={value}>{statusLabels[value] ?? value}</option>)}</select></label><label>技术<select onChange={(event) => update('technology', event.target.value)} value={technology}><option value="">全部技术</option>{valuesFor('technology').map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button className="button button-ghost" onClick={clear} type="button">清除筛选</button></div></details>
    {projects.length === 0 ? <p className="empty-state">没有匹配的作品。<button className="text-button" onClick={clear} type="button">清除筛选</button></p> : <div className="project-list">{projects.map((project, index) => <article className="project-entry" key={project.id}>
      <div className="project-entry-art" aria-hidden="true"><span>{String(index + 1).padStart(2, '0')} / PROJECT</span><strong>{project.name}</strong><span>{project.technologies.slice(0, 3).join(' · ')}</span></div>
      <div className="project-entry-copy"><div className="card-topline"><span className="eyebrow">{project.category}</span><span className="project-status"><span aria-hidden="true">●</span> {statusLabels[project.status] ?? project.status}</span></div><h2>{project.name}</h2><p>{project.summary}</p><div className="tag-list">{project.technologies.map((item) => <span className="tag" key={item}>{item}</span>)}</div><div className="button-row">{project.demoUrl ? <ExternalLink link={{ label: '打开作品 ↗', href: project.demoUrl }} /> : null}{project.sourceUrl ? <ExternalLink link={{ label: '查看源码 ↗', href: project.sourceUrl }} /> : null}{project.hasPlaceholder ? <PlaceholderBadge /> : null}</div></div>
    </article>)}</div>}
  </section>;
}

export default ProjectsPage;

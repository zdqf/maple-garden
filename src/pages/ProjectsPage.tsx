import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { ExternalLink, PlaceholderBadge } from '../components/common/forms';
import { usePageMeta } from '../components/common/PageMeta';
import { projectCatalog } from '../config/projects';
import { projectToCardModel } from '../domain/shared/configProjection';

function valuesFor(key: 'category' | 'status' | 'technology'): readonly string[] {
  const records = projectCatalog.map(projectToCardModel);
  const values = records.flatMap((record) => key === 'technology' ? record.technologies : [record[key]]);
  return [...new Set(values)].sort();
}

export function ProjectsPage(): React.JSX.Element {
  usePageMeta('项目 · Maple-Garden', '浏览由配置驱动的项目目录。');
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
    setParams(next);
  };
  const clear = () => setParams({});

  return <section aria-labelledby="projects-title" className="stack-lg">
    <div className="page-heading"><div><p className="eyebrow">PROJECT INDEX</p><h1 id="projects-title">项目</h1><p className="lede">从集中配置读取的项目目录，筛选状态保存在当前 URL。</p></div><span className="result-count">{projects.length} 个结果</span></div>
    <div className="filter-panel" aria-label="项目筛选"><label>搜索<input onChange={(event) => update('q', event.target.value)} placeholder="名称、技术或标签" value={params.get('q') ?? ''} /></label><label>分类<select onChange={(event) => update('category', event.target.value)} value={category}><option value="">全部分类</option>{valuesFor('category').map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>状态<select onChange={(event) => update('status', event.target.value)} value={status}><option value="">全部状态</option>{valuesFor('status').map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>技术<select onChange={(event) => update('technology', event.target.value)} value={technology}><option value="">全部技术</option>{valuesFor('technology').map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button className="button button-ghost" onClick={clear} type="button">清除筛选</button></div>
    {projects.length === 0 ? <p className="empty-state">没有匹配项目。<button className="text-button" onClick={clear} type="button">清除筛选并重试</button></p> : <div className="card-grid">{projects.map((project) => <article className="content-card" key={project.id}><div className="card-topline"><span className="tag">{project.category}</span><span>{project.status}</span></div><h2>{project.name}</h2><p>{project.summary}</p><p className="tag-list">{project.technologies.map((item) => <span className="tag" key={item}>{item}</span>)}</p><div className="button-row">{project.demoUrl ? <ExternalLink link={{ label: 'Demo', href: project.demoUrl }} /> : null}{project.sourceUrl ? <ExternalLink link={{ label: 'Source', href: project.sourceUrl }} /> : null}{project.hasPlaceholder ? <PlaceholderBadge /> : null}</div></article>)}</div>}
    <p className="fine-print"><Link to="/about">配置与占位数据说明</Link></p>
  </section>;
}

export default ProjectsPage;

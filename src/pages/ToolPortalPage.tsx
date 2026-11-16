import { useState } from 'react';
import { Link } from 'react-router-dom';

import { usePageMeta } from '../components/common/PageMeta';
import { SearchInput } from '../components/common/SearchInput';
import { toolRegistry } from '../config/tools';

const toolGroups = [
  { title: '编码与格式', label: 'ENCODE & FORMAT', ids: ['json', 'base64', 'url'], marks: ['{ }', '64', '%'] },
  { title: '文本与写作', label: 'TEXT & WRITING', ids: ['text-statistics', 'regex', 'diff', 'prompt-composer'], marks: ['Aa', '.*', '±', '↗'] },
  { title: '时间与标识', label: 'TIME & IDENTITY', ids: ['timestamp', 'uuid', 'hash'], marks: ['◷', '#', '⌗'] },
] as const;

export function ToolPortalPage(): React.JSX.Element {
  usePageMeta('工具 · Maple-Garden', '一组随手可用的浏览器工具，处理文本、编码与日常开发中的小事。');
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const matches = toolRegistry.filter((tool) => !normalizedQuery || [tool.name, tool.capability, ...tool.keywords].join(' ').toLowerCase().includes(normalizedQuery));

  return <section aria-labelledby="tools-title" className="stack-lg tools-page">
    <div className="page-heading"><div><p className="eyebrow">SMALL TOOLS, EVERYDAY USE</p><h1 id="tools-title">工具</h1><p className="lede">让琐碎的小事，顺手一点。打开即用，所有输入都留在你的浏览器。</p></div><span className="page-index" aria-hidden="true">04 / TOOLKIT</span></div>
    <div className="tool-portal-toolbar"><label><span className="sr-only">搜索工具</span><SearchInput onValueChange={setQuery} placeholder="查找工具，例如 JSON、编码、正则…" type="search" value={query} /></label><span className="result-count" role="status">{matches.length} / {toolRegistry.length} 个工具</span></div>
    {matches.length === 0 ? <div className="empty-state"><p>暂时没有匹配的工具。</p><button className="text-button" onClick={() => setQuery('')} type="button">查看全部工具</button></div> : toolGroups.map((group) => {
      const tools = group.ids.flatMap((id, index) => {
        const tool = matches.find((item) => item.id === id);
        return tool ? [{ tool, mark: group.marks[index] }] : [];
      });
      return tools.length > 0 ? <section className="tool-group" key={group.label} aria-label={group.title}>
        <div className="tool-group-heading"><h2>{group.title}</h2><span className="eyebrow">{group.label}</span></div>
        <div className="tool-grid">{tools.map(({ tool, mark }) => <Link className="tool-card" key={tool.id} to={`/tools/${tool.id}`}>
          <div className="card-topline"><span aria-hidden="true" className="tool-symbol">{mark}</span><span aria-hidden="true" className="tool-card-arrow">↗</span></div>
          <h3>{tool.name}</h3><p>{tool.capability}</p>
        </Link>)}</div>
      </section> : null;
    })}
    <p className="tool-privacy-note"><span aria-hidden="true">◌</span> 在本地处理，用完即走。无需注册，也不会保存你的输入。</p>
  </section>;
}

export default ToolPortalPage;

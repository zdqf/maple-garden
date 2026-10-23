import { Link } from 'react-router-dom';

import { usePageMeta } from '../components/common/PageMeta';
import { toolRegistry } from '../config/tools';

export function ToolPortalPage(): React.JSX.Element {
  usePageMeta('工具 · Maple-Garden', '十个浏览器本地开发工具，不上传输入，不写入存储。');
  return <section aria-labelledby="tools-title" className="stack-lg"><div className="page-heading"><div><p className="eyebrow">BROWSER-ONLY TOOLKIT</p><h1 id="tools-title">工具</h1><p className="lede">所有处理仅在当前浏览器完成：输入、运行、复制结果，或随时重置。</p></div><span className="result-count">{toolRegistry.length} tools</span></div><div className="tool-grid">{toolRegistry.map((tool) => <Link className="tool-card" key={tool.id} to={`/tools/${tool.id}`}><div className="card-topline"><span className="tool-index">{String(toolRegistry.indexOf(tool) + 1).padStart(2, '0')}</span><span>LOCAL</span></div><h2>{tool.name}</h2><p>{tool.capability}</p><div className="tag-list">{tool.keywords.slice(0, 4).map((keyword) => <span className="tag" key={keyword}>{keyword}</span>)}</div></Link>)}</div></section>;
}

export default ToolPortalPage;

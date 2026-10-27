import { Suspense, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import { RouteErrorBoundary } from '../../app/RouteErrorBoundary';
import { primaryNavigation } from '../../app/routeConfig';
import { personalConfig } from '../../config/personal';
import { projectCatalog } from '../../config/projects';
import { toolRegistry } from '../../config/tools';
import { publishedPosts } from '../../content/postRepository';
import { useOptionalTheme } from '../../domain/theme';
import { ExternalLink } from '../common/forms';
import { siteConfig } from '../../config/site';

function focusMainContent(event: MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault();
  document.getElementById('main-content')?.focus();
}

function PageLoading(): React.JSX.Element {
  return <p aria-live="polite" role="status" className="notice">正在加载页面…</p>;
}

export function SiteShell(): React.JSX.Element {
  const location = useLocation();
  const { choice, choices, setChoice } = useOptionalTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const boundaryKey = `${location.key}:${location.pathname}:${location.search}`;
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return [
      ...projectCatalog.map((item) => ({ type: '项目', label: item.name, detail: item.summary, to: '/projects' })),
      ...publishedPosts.map((item) => ({ type: '文章', label: item.title, detail: item.description, to: `/journal/post/${item.slug}` })),
      ...toolRegistry.map((item) => ({ type: '工具', label: item.name, detail: item.capability, to: `/tools/${item.id}` })),
    ].filter((item) => `${item.label} ${item.detail} ${item.type}`.toLowerCase().includes(query)).slice(0, 8);
  }, [search]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  return <div className="site-shell">
    <a className="skip-link" href="#main-content" onClick={focusMainContent}>跳到主要内容</a>
    <header className="site-header" role="banner">
      <div className="shell-inner">
        <Link className="brand" to="/"><span className="brand-mark">DG</span><span>{siteConfig.title}</span></Link>
        <button aria-expanded={menuOpen} aria-label="打开导航菜单" className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} type="button"><span aria-hidden="true">☰</span></button>
        <nav aria-label="主导航" className={menuOpen ? 'primary-nav open' : 'primary-nav'}><ul>{primaryNavigation.map((item) => <li key={item.to}><NavLink end={item.end ?? false} onClick={() => setMenuOpen(false)} to={item.to}>{({ isActive }) => <><span>{item.label}</span>{isActive ? <span aria-hidden="true" className="nav-current">当前</span> : null}</>}</NavLink></li>)}</ul></nav>
        <div className="header-actions"><button aria-label="打开全站搜索 ⌕ ⌘K" className="icon-button" onClick={() => setSearchOpen(true)} type="button"><span aria-hidden="true">⌕</span><span aria-hidden="true" className="shortcut">⌘K</span></button><label className="theme-control"><span className="sr-only">主题</span><select aria-label="主题" onChange={(event) => setChoice(event.target.value as typeof choice)} value={choice}>{choices.map((item) => <option key={item} value={item}>{item === 'light' ? '浅色' : item === 'dark' ? '深色' : '系统'}</option>)}</select></label></div>
      </div>
    </header>
    {searchOpen ? <div aria-label="全站搜索" className="search-backdrop" role="dialog"><div className="search-dialog"><div className="search-dialog-top"><h2>搜索 Maple-Garden</h2><button aria-label="关闭搜索" className="icon-button" onClick={() => setSearchOpen(false)} type="button">×</button></div><input onChange={(event) => setSearch(event.target.value)} placeholder="搜索项目、文章或工具…" value={search} />{search ? <div className="search-results">{searchResults.length === 0 ? <p>没有找到匹配内容。</p> : searchResults.map((result) => <Link key={`${result.type}:${result.to}`} onClick={() => setSearchOpen(false)} to={result.to}><span className="tag">{result.type}</span><strong>{result.label}</strong><small>{result.detail}</small></Link>)}</div> : <p className="fine-print">输入关键词开始搜索，或按 Escape 关闭。</p>}</div></div> : null}
    <main className="main-content" id="main-content" tabIndex={-1}><RouteErrorBoundary key={boundaryKey}><Suspense fallback={<PageLoading />}><Outlet /></Suspense></RouteErrorBoundary></main>
    <footer className="site-footer"><div className="shell-inner footer-inner"><p>© {new Date().getFullYear()} Logan.Song / {personalConfig.identity.name} · {siteConfig.title} · 保留所有权利</p>{personalConfig.contacts.length > 0 ? <ul aria-label="联系方式">{personalConfig.contacts.map((contact) => <li key={`${contact.label}:${contact.href}`}><ExternalLink link={contact} /></li>)}</ul> : <p className="fine-print">联系信息：<span className="placeholder-text">待替换</span></p>}</div></footer>
  </div>;
}

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
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
import { SearchInput } from '../common/SearchInput';

function focusMainContent(event: MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault();
  document.getElementById('main-content')?.focus();
}

function PageLoading(): React.JSX.Element {
  return <p aria-live="polite" role="status" className="notice">正在加载页面…</p>;
}

function MapleMark(): React.JSX.Element {
  return <svg aria-hidden="true" width="26" height="30" viewBox="0 0 32 36" fill="none"><path d="m16 1 4 10 5-4-1 9 7-2-3 7 4 2-12 7-3-1-1 6-1-6-3 1L0 23l4-2-3-7 7 2-1-9 5 4Z" fill="currentColor" /><path d="M16 9v21M9 18l7 8 7-8" stroke="var(--bg)" strokeWidth=".8" /></svg>;
}

export function SiteShell(): React.JSX.Element {
  const location = useLocation();
  const { choice, choices, setChoice } = useOptionalTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchComposing = useRef(false);
  const boundaryKey = location.pathname;
  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return publishedPosts.slice(0, 4).map((post) => ({ type: '最近文章', label: post.title, detail: post.description, to: `/journal/post/${post.slug}` }));
    return [
      ...publishedPosts.map((item) => ({ type: '文章', label: item.title, detail: item.description, keywords: item.tags.join(' '), to: `/journal/post/${item.slug}` })),
      ...projectCatalog.map((item) => ({ type: '项目', label: item.name, detail: item.summary, keywords: item.tags.join(' '), to: '/projects' })),
      ...toolRegistry.map((item) => ({ type: '工具', label: item.name, detail: item.capability, keywords: item.keywords.join(' '), to: `/tools/${item.id}` })),
    ].filter((item) => `${item.label} ${item.detail} ${item.type} ${item.keywords}`.toLowerCase().includes(query)).slice(0, 8);
  }, [search]);

  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing || event.keyCode === 229 || searchComposing.current) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    searchRef.current?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [searchOpen]);

  const closeSearch = () => { searchComposing.current = false; setSearchOpen(false); setSearch(''); };

  return <div className="site-shell">
    <a className="skip-link" href="#main-content" onClick={focusMainContent}>跳到主要内容</a>
    <header className="site-header" role="banner"><div className="shell-inner header-inner">
      <Link className="brand" to="/"><span className="brand-mark"><MapleMark /></span><span>{siteConfig.title}<small>{personalConfig.identity.name}的数字花园</small></span></Link>
      <nav aria-label="主导航" id="primary-navigation" className={menuOpen ? 'primary-nav open' : 'primary-nav'}><ul>{primaryNavigation.map((item) => <li key={item.to}><NavLink end={item.end ?? false} onClick={() => setMenuOpen(false)} to={item.to}>{item.label}</NavLink></li>)}</ul></nav>
      <div className="header-actions"><button aria-label="打开全站搜索" className="search-trigger" onClick={() => setSearchOpen(true)} type="button"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg><span className="search-trigger-label">搜索</span><kbd>⌘ K</kbd></button><label className="theme-control"><span className="sr-only">主题</span><select aria-label="主题" onChange={(event) => setChoice(event.target.value as typeof choice)} value={choice}>{choices.map((item) => <option key={item} value={item}>{item === 'light' ? '☼ 浅色' : item === 'dark' ? '◐ 深色' : '◐ 系统'}</option>)}</select></label></div>
      <button aria-expanded={menuOpen} aria-controls="primary-navigation" aria-label={menuOpen ? '收起导航菜单' : '打开导航菜单'} className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} type="button"><span aria-hidden="true">{menuOpen ? '×' : '☰'}</span></button>
    </div></header>
    {searchOpen ? <dialog aria-labelledby="search-title" className="search-dialog" onCancel={(event) => { if (searchComposing.current) event.preventDefault(); else closeSearch(); }} onClick={(event) => { if (event.target === event.currentTarget) closeSearch(); }} ref={dialogRef}><div className="search-dialog-top"><div><p className="eyebrow">FIND A LITTLE INSPIRATION</p><h2 id="search-title">在花园里找一找</h2></div><button aria-label="关闭搜索" className="icon-button" onClick={closeSearch} type="button">×</button></div><label className="search-input-wrap"><span className="sr-only">搜索全站内容</span><SearchInput onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); closeSearch(); } }} onValueChange={setSearch} onComposingChange={(value) => { searchComposing.current = value; }} placeholder="文章、标签、项目或工具…" inputRef={searchRef} type="search" value={search} /></label><p className="search-hint" role="status">{search ? `找到 ${searchResults.length} 个结果` : '不妨从最近的文字开始'}</p><div className="search-results">{searchResults.length === 0 ? <p className="search-empty">暂时没有找到。试试更短的关键词？</p> : searchResults.map((result) => <Link key={`${result.to}:${result.label}`} onClick={closeSearch} to={result.to}><span className="search-result-type">{result.type}</span><strong>{result.label}</strong><small>{result.detail}</small><span className="search-result-arrow" aria-hidden="true">↗</span></Link>)}</div><div className="search-footer"><span>文字与想法，都有迹可循。</span><span><kbd>esc</kbd> 关闭</span></div></dialog> : null}
    <main className="main-content" id="main-content" tabIndex={-1}><RouteErrorBoundary key={boundaryKey}><Suspense fallback={<PageLoading />}><Outlet /></Suspense></RouteErrorBoundary></main>
    <footer className="site-footer"><div className="shell-inner footer-inner"><div className="footer-signature"><MapleMark /><div><span>{siteConfig.title}</span><p>用文字记录，用代码构建。</p></div></div><div className="footer-right">{personalConfig.contacts.length > 0 ? <ul aria-label="联系方式">{personalConfig.contacts.map((contact) => <li key={`${contact.label}:${contact.href}`}><ExternalLink link={contact} /></li>)}</ul> : null}<p>© {new Date().getFullYear()} Logan.Song / {personalConfig.identity.name} · 保留所有权利</p></div></div></footer>
  </div>;
}

import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { ArchivePostRow } from '../components/common/ArchivePostRow';
import { EmptyState } from '../components/common/forms';
import { usePageMeta } from '../components/common/PageMeta';
import { SearchInput } from '../components/common/SearchInput';
import { articleCategories, getArticleCategoryName } from '../config/articleCategories';
import { contentCollections, getContentCollection } from '../config/contentCollections';
import { getPostTags, publishedPosts, type PublishedPost } from '../content/postRepository';

type ArchiveFilters = Readonly<{
  q: string; category: string; collection: string; tag: string; year: string; sort: string;
}>;

function archiveHref(filters: ArchiveFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && !(key === 'sort' && value === 'newest')) params.set(key, value);
  });
  return params.size ? `/journal?${params.toString()}` : '/journal';
}

function postYear(post: PublishedPost): string { return post.publishedAt.slice(0, 4); }

export function JournalPage(): React.JSX.Element {
  const route = useParams<{ category?: string; tag?: string }>();
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [directoryOpen, setDirectoryOpen] = useState(false);
  usePageMeta('日志 · Maple-Garden', '按主题、文集和年份，浏览木有风的文章与长期记录。');

  // React Router already decodes route params; old category/tag links stay valid.
  const filters: ArchiveFilters = {
    q: params.get('q') ?? '',
    category: params.get('category') ?? route.category ?? '',
    collection: params.get('collection') ?? '',
    tag: params.get('tag') ?? route.tag ?? '',
    year: params.get('year') ?? '',
    sort: params.get('sort') ?? 'newest',
  };
  const update = (patch: Partial<ArchiveFilters>, replace = false): void => {
    const href = archiveHref({ ...filters, ...patch });
    // Keep legacy route paths while typing so the shared route boundary retains focus.
    const destination = replace
      ? `${location.pathname}${href.slice('/journal'.length)}`
      : href;
    void navigate(destination, { replace, preventScrollReset: true });
  };
  const query = filters.q.trim().toLocaleLowerCase();
  const posts = publishedPosts.filter((post) => {
    const collection = post.collection ? getContentCollection(post.collection) : undefined;
    const searchable = [post.title, post.description, post.body, ...post.tags,
      getArticleCategoryName(post.category), collection?.title ?? ''].join(' ').toLocaleLowerCase();
    return (!filters.category || post.category === filters.category)
      && (!filters.collection || post.collection === filters.collection)
      && (!filters.tag || post.tags.includes(filters.tag))
      && (!filters.year || postYear(post) === filters.year)
      && (!query || searchable.includes(query));
  }).sort((left, right) => {
    if (filters.sort === 'oldest') return left.publishedAt.localeCompare(right.publishedAt);
    if (filters.sort === 'title') return left.title.localeCompare(right.title, 'zh-CN');
    return right.publishedAt.localeCompare(left.publishedAt);
  });
  const years = [...new Set(publishedPosts.map(postYear))].sort().reverse();
  const groups = new Map<string, PublishedPost[]>();
  posts.forEach((post) => {
    const year = postYear(post);
    const group = groups.get(year) ?? [];
    group.push(post);
    groups.set(year, group);
  });
  const isFiltered = Boolean(filters.q || filters.category || filters.collection || filters.tag || filters.year);
  const selectedCollection = getContentCollection(filters.collection);
  const chips = [
    filters.category ? { key: 'category', label: getArticleCategoryName(filters.category) } : null,
    filters.collection ? { key: 'collection', label: selectedCollection?.title ?? filters.collection } : null,
    filters.tag ? { key: 'tag', label: `# ${filters.tag}` } : null,
    filters.year ? { key: 'year', label: filters.year } : null,
  ].filter((chip) => chip !== null);

  return (
    <section aria-labelledby="journal-title" className="archive-page">
      <div className="page-heading archive-heading">
        <div>
          <p className="eyebrow">THE ARCHIVE / 文字的来处</p>
          <h1 id="journal-title">日志</h1>
          <p className="lede">写代码，也写生活。让散落的思考，慢慢长成一座花园。</p>
        </div>
        <p className="archive-total"><strong>{publishedPosts.length.toString().padStart(2, '0')}</strong><span>篇记录 · 持续生长</span></p>
      </div>
      <div className="archive-layout">
        <aside className={`archive-sidebar${directoryOpen ? ' is-open' : ''}`}>
          <button aria-controls="archive-directory" aria-expanded={directoryOpen} className="archive-directory-toggle" onClick={() => setDirectoryOpen((open) => !open)} type="button">
            浏览主题与文集 <span aria-hidden="true">{directoryOpen ? '−' : '+'}</span>
          </button>
          <div className="archive-sidebar-content" id="archive-directory">
            <nav aria-label="文章主题" className="archive-nav">
              <p className="archive-nav-heading">主题 <span>TOPICS</span></p>
              <Link aria-current={!filters.category && !filters.collection ? 'page' : undefined} className={`archive-nav-link${!filters.category && !filters.collection ? ' is-active' : ''}`} to={archiveHref({ ...filters, category: '', collection: '' })}>
                <span>全部记录</span><span>{publishedPosts.length.toString().padStart(2, '0')}</span>
              </Link>
              {articleCategories.map((category) => {
                const count = publishedPosts.filter((post) => post.category === category.id).length;
                return <Link aria-current={filters.category === category.id ? 'page' : undefined} className={`archive-nav-link${filters.category === category.id ? ' is-active' : ''}`} key={category.id} to={archiveHref({ ...filters, category: category.id, collection: '' })}>
                  <span>{category.name}</span><span>{count.toString().padStart(2, '0')}</span>
                </Link>;
              })}
            </nav>
            <nav aria-label="文集筛选" className="archive-nav">
              <p className="archive-nav-heading">文集 <span>COLLECTIONS</span></p>
              {contentCollections.map((collection) => <Link aria-current={filters.collection === collection.id ? 'page' : undefined} className={`archive-nav-link${filters.collection === collection.id ? ' is-active' : ''}`} key={collection.id} to={archiveHref({ ...filters, category: collection.category, collection: collection.id })}>
                <span>{collection.title}</span><span>{publishedPosts.filter((post) => post.collection === collection.id).length.toString().padStart(2, '0')}</span>
              </Link>)}
            </nav>
            <details className="archive-tags">
              <summary>按标签探索 <span aria-hidden="true">＋</span></summary>
              <div className="archive-tag-list">{getPostTags().map((tag) => <Link aria-current={filters.tag === tag ? 'page' : undefined} className={filters.tag === tag ? 'is-active' : ''} key={tag} to={archiveHref({ ...filters, tag: filters.tag === tag ? '' : tag })}>{tag}</Link>)}</div>
            </details>
            <p className="archive-sidebar-note">主题收纳方向，文集连接篇章。<br />每一篇，都有自己的位置。</p>
          </div>
        </aside>
        <div className="archive-main">
          <div aria-label="文章筛选" className="archive-toolbar">
            <label className="archive-search"><span className="sr-only">搜索文章</span><span aria-hidden="true">⌕</span><SearchInput onValueChange={(value) => update({ q: value }, true)} placeholder="搜索标题、正文或关键词…" type="search" value={filters.q} /></label>
            <label><span className="sr-only">文章年份</span><select aria-label="文章年份" onChange={(event) => update({ year: event.target.value })} value={filters.year}><option value="">全部年份</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
            <label><span className="sr-only">文章排序</span><select aria-label="文章排序" onChange={(event) => update({ sort: event.target.value })} value={filters.sort}><option value="newest">最新在前</option><option value="oldest">最早在前</option><option value="title">按标题</option></select></label>
          </div>
          <div className="archive-results-heading">
            <p aria-live="polite" className="result-count">{isFiltered ? `找到 ${posts.length} 篇记录` : '全部记录'}</p>
            {isFiltered ? <Link className="archive-clear" to="/journal">清除筛选 ↗</Link> : <span className="archive-order-note">{filters.sort === 'oldest' ? '从最初开始' : filters.sort === 'title' ? '以标题为序' : '最近的，排在前面'}</span>}
          </div>
          {chips.length ? <div aria-label="当前筛选" className="archive-filter-chips">{chips.map((chip) => <button aria-label={`移除${chip.label}筛选`} key={chip.key} onClick={() => update({ [chip.key]: '' })} type="button">{chip.label}<span aria-hidden="true"> ×</span></button>)}</div> : null}
          {selectedCollection ? <div className="archive-collection-note"><p>{selectedCollection.description}</p><Link to={`/journal/collection/${selectedCollection.id}`}>打开文集目录 ↗</Link></div> : null}
          {posts.length === 0 ? <EmptyState action={<Link to="/journal">查看全部记录</Link>} description="试试其他关键词，或清除筛选重新寻找。" title="暂时没有找到这篇文字" /> : filters.sort === 'title' ? <div className="archive-post-list">{posts.map((post) => <ArchivePostRow key={post.slug} post={post} />)}</div> : <div className="archive-year-list">{[...groups].map(([year, yearPosts]) => <section aria-labelledby={`archive-year-${year}`} className="archive-year-group" key={year}><div className="archive-year-heading"><h2 id={`archive-year-${year}`}>{year}</h2><span>{yearPosts.length} 篇</span><span className="archive-year-rule" /></div>{yearPosts.map((post) => <ArchivePostRow key={post.slug} post={post} />)}</section>)}</div>}
          <p className="archive-endnote">{posts.length ? '— 文字到这里，生活还在继续。' : '每一种寻找，都有它的回声。'}</p>
        </div>
      </div>
    </section>
  );
}

export default JournalPage;

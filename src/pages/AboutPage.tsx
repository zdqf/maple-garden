import { ExternalLink, PlaceholderBadge } from '../components/common/forms';
import { usePageMeta } from '../components/common/PageMeta';
import { personalConfig } from '../config/personal';
import { containsPlaceholder } from '../domain/shared/placeholder';
import { personalToViewModel } from '../domain/shared/configProjection';

export function AboutPage(): React.JSX.Element {
  usePageMeta('关于 · Maple-Garden', personalConfig.site.description);
  const profile = personalToViewModel(personalConfig);

  return <section aria-labelledby="about-title" className="stack-lg about-page">
    <div className="page-heading"><div><p className="eyebrow">THE PERSON BEHIND THE GARDEN</p><h1 id="about-title">关于</h1><p className="lede">关于作者，也关于这座缓慢生长的花园。</p></div><span className="page-index" aria-hidden="true">05 / ABOUT</span></div>
    <div className="about-layout">
      <aside className="about-identity">
        <span aria-hidden="true" className="about-monogram">木</span>
        <p className="eyebrow">A NOTE FROM</p><h2>{profile.identity.name}</h2><p>{profile.identity.headline}</p>
        {containsPlaceholder(profile.identity) ? <PlaceholderBadge /> : null}
        {profile.contacts ? <div className="about-contacts">{profile.contacts.map((contact) => <ExternalLink key={contact.href} link={contact} />)}</div> : null}
      </aside>
      <div className="about-details stack-lg">
        {profile.biography ? <section className="stack-sm"><p className="eyebrow">01 / BIOGRAPHY</p><h2>一些自我介绍</h2>{profile.biography.map((item) => <p key={item}>{item}</p>)}</section> : null}
        {profile.skills ? <section className="stack-sm"><p className="eyebrow">02 / THINGS I ENJOY</p><h2>在文字之外</h2><div className="tag-list">{profile.skills.map((item) => <span className="tag" key={item}>{item}</span>)}</div></section> : null}
        {profile.experience ? <section className="stack-sm"><h2>经历</h2><div className="article-list">{profile.experience.map((item) => <article className="content-card" key={item.id}><h3>{item.role} · {item.organization}</h3><p>{item.startDate} — {item.endDate ?? '至今'}</p>{item.summary ? <p>{item.summary}</p> : null}</article>)}</div></section> : null}
        {profile.principles ? <section className="stack-sm"><h2>工作原则</h2><ul className="plain-list">{profile.principles.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
        <section className="about-garden-note stack-sm"><p className="eyebrow">MAPLE-GARDEN</p><h2>{profile.identity.headline}</h2><p>{profile.site.description}</p><p>文字在这里存放，想法在这里生长。欢迎随意走走，找到一片与你有关的叶子。</p></section>
      </div>
    </div>
  </section>;
}

export default AboutPage;

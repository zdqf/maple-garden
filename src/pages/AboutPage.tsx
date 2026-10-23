import { ExternalLink, PlaceholderBadge } from '../components/common/forms';
import { usePageMeta } from '../components/common/PageMeta';
import { personalConfig } from '../config/personal';
import { personalToViewModel } from '../domain/shared/configProjection';

export function AboutPage(): React.JSX.Element {
  usePageMeta('关于 · Maple-Garden', personalConfig.site.description);
  const profile = personalToViewModel(personalConfig);
  return <section aria-labelledby="about-title" className="stack-lg"><div className="page-heading"><div><p className="eyebrow">ABOUT / CONFIGURATION</p><h1 id="about-title">关于</h1><p className="lede">这里的内容全部来自 personal.ts；未准备好的真实信息保持占位状态。</p></div><PlaceholderBadge /></div><article className="profile-card"><p className="eyebrow">IDENTITY</p><h2>{profile.identity.name}</h2><p>{profile.identity.headline}</p><PlaceholderBadge /></article>{profile.biography ? <section className="stack-sm"><h2>简介</h2>{profile.biography.map((item) => <p key={item}>{item}</p>)}</section> : null}{profile.skills ? <section className="stack-sm"><h2>技能</h2><div className="tag-list">{profile.skills.map((item) => <span className="tag" key={item}>{item}</span>)}</div></section> : null}{profile.experience ? <section className="stack-sm"><h2>经历</h2><div className="article-list">{profile.experience.map((item) => <article className="content-card" key={item.id}><h3>{item.role} · {item.organization}</h3><p>{item.startDate} — {item.endDate ?? '至今'}</p>{item.summary ? <p>{item.summary}</p> : null}</article>)}</div></section> : null}{profile.principles ? <section className="stack-sm"><h2>工作原则</h2><ul className="plain-list">{profile.principles.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}{profile.contacts ? <section className="stack-sm"><h2>联系方式</h2><div className="button-row">{profile.contacts.map((contact) => <ExternalLink key={contact.href} link={contact} />)}</div></section> : null}</section>;
}

export default AboutPage;

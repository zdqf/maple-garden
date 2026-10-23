import {
  PersonalConfigSchema,
  ProjectRecordSchema,
  VerifiedMetricSchema,
  type Experience,
  type LinkRecord,
  type PersonalConfig,
  type PersonalIdentity,
  type ProjectRecord,
  type SiteConfig,
  type VerifiedMetric,
} from '../../config/schemas';
import type { HttpsUrl } from './urlPolicy';
import {
  createPlaceholderViewMarker,
  type PlaceholderViewMarker,
} from './placeholder';

export type ProjectProjectionInput = Omit<
  ProjectRecord,
  'demoUrl' | 'sourceUrl' | 'metrics'
> &
  Readonly<{
    demoUrl?: string;
    sourceUrl?: string;
    metrics?: readonly unknown[];
  }>;

export type ProjectCardModel = Readonly<{
  id: string;
  name: string;
  summary: string;
  category: string;
  status: ProjectRecord['status'];
  technologies: readonly string[];
  tags: readonly string[];
  featured: boolean;
  demoUrl?: HttpsUrl;
  sourceUrl?: HttpsUrl;
  metrics?: readonly VerifiedMetric[];
}> &
  PlaceholderViewMarker;

export type PersonalProjectionInput = Omit<
  PersonalConfig,
  'resumeUrl' | 'metrics'
> &
  Readonly<{
    resumeUrl?: string;
    metrics?: readonly unknown[];
  }>;

export type PersonalViewModel = Readonly<{
  identity: PersonalIdentity;
  biography?: readonly string[];
  skills?: readonly string[];
  experience?: readonly Experience[];
  principles?: readonly string[];
  contacts?: readonly LinkRecord[];
  socials?: readonly LinkRecord[];
  resumeUrl?: HttpsUrl;
  site: SiteConfig;
  localizedText: Readonly<Record<string, string>>;
  metrics?: readonly VerifiedMetric[];
}> &
  PlaceholderViewMarker;

export function filterCompleteMetrics(
  candidates: readonly unknown[] | null | undefined,
): readonly VerifiedMetric[] {
  if (candidates === undefined || candidates === null) {
    return Object.freeze([]);
  }

  const metrics = candidates.flatMap((candidate) => {
    const result = VerifiedMetricSchema.safeParse(candidate);
    return result.success ? [result.data] : [];
  });

  return Object.freeze(metrics);
}

export function projectToCardModel(
  source: ProjectProjectionInput,
): ProjectCardModel {
  const metrics = filterCompleteMetrics(source.metrics);
  const project = ProjectRecordSchema.parse({
    ...source,
    metrics,
  });
  const marker = createPlaceholderViewMarker(source);

  return Object.freeze({
    id: project.id,
    name: project.name,
    summary: project.summary,
    category: project.category,
    status: project.status,
    technologies: project.technologies,
    tags: project.tags,
    featured: project.featured,
    ...(project.demoUrl === undefined ? {} : { demoUrl: project.demoUrl }),
    ...(project.sourceUrl === undefined
      ? {}
      : { sourceUrl: project.sourceUrl }),
    ...(project.metrics === undefined || project.metrics.length === 0
      ? {}
      : { metrics: project.metrics }),
    ...marker,
  });
}

export function personalToViewModel(
  source: PersonalProjectionInput,
): PersonalViewModel {
  const metrics = filterCompleteMetrics(source.metrics);
  const personal = PersonalConfigSchema.parse({
    ...source,
    metrics,
  });
  const marker = createPlaceholderViewMarker(source);

  return Object.freeze({
    identity: personal.identity,
    ...(personal.biography.length === 0
      ? {}
      : { biography: personal.biography }),
    ...(personal.skills.length === 0 ? {} : { skills: personal.skills }),
    ...(personal.experience.length === 0
      ? {}
      : { experience: personal.experience }),
    ...(personal.principles.length === 0
      ? {}
      : { principles: personal.principles }),
    ...(personal.contacts.length === 0
      ? {}
      : { contacts: personal.contacts }),
    ...(personal.socials.length === 0
      ? {}
      : { socials: personal.socials }),
    ...(personal.resumeUrl === undefined
      ? {}
      : { resumeUrl: personal.resumeUrl }),
    site: personal.site,
    localizedText: personal.localizedText,
    ...(personal.metrics.length === 0 ? {} : { metrics: personal.metrics }),
    ...marker,
  });
}

import { z } from 'zod';

import {
  AbsoluteAllowedUrlSchema,
  HttpsUrlSchema,
  type AbsoluteAllowedUrl,
  type HttpsUrl,
} from '../domain/shared/urlPolicy';

export {
  AbsoluteAllowedUrlSchema,
  HttpsUrlSchema,
  isAllowedExternalUrl,
  isHttpsUrl,
  parseAllowedExternalUrl,
  parseHttpsUrl,
} from '../domain/shared/urlPolicy';
export type { AbsoluteAllowedUrl, HttpsUrl } from '../domain/shared/urlPolicy';

export const PROJECT_STATUSES = [
  'in-progress',
  'completed',
  'archived',
] as const;

export const TOOL_IDS = [
  'json',
  'base64',
  'url',
  'timestamp',
  'uuid',
  'text-statistics',
  'regex',
  'hash',
  'diff',
  'prompt-composer',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ToolId = (typeof TOOL_IDS)[number];
export type ToolRoute = `#/tools/${ToolId}`;

export type LinkRecord = Readonly<{
  label: string;
  href: AbsoluteAllowedUrl;
  accessibleLabel?: string;
}>;

export type VerifiedMetric = Readonly<{
  value: string;
  meaning: string;
  source: HttpsUrl;
}>;

export type Experience = Readonly<{
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  summary?: string;
}>;

export type PersonalIdentity = Readonly<{
  name: string;
  headline: string;
  avatarPath?: string;
}>;

export type SiteConfig = Readonly<{
  title: string;
  description: string;
  language: string;
  previewImagePath: string;
}>;

export type PersonalConfig = Readonly<{
  identity: PersonalIdentity;
  biography: readonly string[];
  skills: readonly string[];
  experience: readonly Experience[];
  principles: readonly string[];
  contacts: readonly LinkRecord[];
  socials: readonly LinkRecord[];
  resumeUrl?: HttpsUrl;
  site: SiteConfig;
  localizedText: Readonly<Record<string, string>>;
  metrics: readonly VerifiedMetric[];
}>;

export type ProjectRecord = Readonly<{
  id: string;
  name: string;
  summary: string;
  category: string;
  status: ProjectStatus;
  technologies: readonly string[];
  tags: readonly string[];
  featured: boolean;
  demoUrl?: HttpsUrl;
  sourceUrl?: HttpsUrl;
  metrics?: readonly VerifiedMetric[];
}>;

export type ToolModule = Readonly<{ default?: unknown }>;

export type ToolDefinition = Readonly<{
  id: ToolId;
  name: string;
  capability: string;
  route: ToolRoute;
  keywords: readonly string[];
  load: () => Promise<ToolModule>;
}>;

export type Personal = PersonalConfig;
export type Project = ProjectRecord;
export type Tool = ToolDefinition;
export type Link = LinkRecord;

export const RequiredTextSchema = z
  .string()
  .trim()
  .min(1, { message: 'Expected non-empty text after trimming.' });

const OptionalTextSchema = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim().length === 0
      ? undefined
      : value,
  RequiredTextSchema.optional(),
);

const OptionalHttpsUrlSchema = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim().length === 0
      ? undefined
      : value,
  HttpsUrlSchema.optional(),
);

const IsoDateSchema = z
  .string()
  .trim()
  .pipe(z.iso.date({ message: 'Expected an ISO calendar date.' }));

const OptionalIsoDateSchema = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim().length === 0
      ? undefined
      : value,
  IsoDateSchema.optional(),
);

const RequiredTextListSchema = z.array(RequiredTextSchema).readonly();

export const ProjectStatusSchema = z.enum(PROJECT_STATUSES);
export const ToolIdSchema = z.enum(TOOL_IDS);

export const LinkRecordSchema: z.ZodType<LinkRecord> = z
  .object({
    label: RequiredTextSchema,
    href: AbsoluteAllowedUrlSchema,
    accessibleLabel: OptionalTextSchema,
  })
  .strict()
  .transform(({ accessibleLabel, href, label }) =>
    Object.freeze({
      label,
      href,
      ...(accessibleLabel === undefined ? {} : { accessibleLabel }),
    }),
  );

export const LinkSchema = LinkRecordSchema;

export const VerifiedMetricSchema: z.ZodType<VerifiedMetric> = z
  .object({
    value: RequiredTextSchema,
    meaning: RequiredTextSchema,
    source: HttpsUrlSchema,
  })
  .strict()
  .readonly();

export const ExperienceSchema: z.ZodType<Experience> = z
  .object({
    id: RequiredTextSchema,
    organization: RequiredTextSchema,
    role: RequiredTextSchema,
    startDate: IsoDateSchema,
    endDate: OptionalIsoDateSchema,
    summary: OptionalTextSchema,
  })
  .strict()
  .transform(({ endDate, id, organization, role, startDate, summary }) =>
    Object.freeze({
      id,
      organization,
      role,
      startDate,
      ...(endDate === undefined ? {} : { endDate }),
      ...(summary === undefined ? {} : { summary }),
    }),
  );

const PersonalIdentitySchema: z.ZodType<PersonalIdentity> = z
  .object({
    name: RequiredTextSchema,
    headline: RequiredTextSchema,
    avatarPath: OptionalTextSchema,
  })
  .strict()
  .transform(({ avatarPath, headline, name }) =>
    Object.freeze({
      name,
      headline,
      ...(avatarPath === undefined ? {} : { avatarPath }),
    }),
  );

const SiteConfigSchema: z.ZodType<SiteConfig> = z
  .object({
    title: RequiredTextSchema,
    description: RequiredTextSchema,
    language: RequiredTextSchema,
    previewImagePath: RequiredTextSchema,
  })
  .strict()
  .readonly();

const LocalizedTextSchema = z
  .record(RequiredTextSchema, RequiredTextSchema)
  .readonly();

const PersonalConfigBaseSchema = z
  .object({
    identity: PersonalIdentitySchema,
    biography: RequiredTextListSchema,
    skills: RequiredTextListSchema,
    experience: z.array(ExperienceSchema).readonly(),
    principles: RequiredTextListSchema,
    contacts: z.array(LinkRecordSchema).readonly(),
    socials: z.array(LinkRecordSchema).readonly(),
    resumeUrl: OptionalHttpsUrlSchema,
    site: SiteConfigSchema,
    localizedText: LocalizedTextSchema,
    metrics: z.array(VerifiedMetricSchema).readonly(),
  })
  .strict()
  .superRefine((personal, context) => {
    for (const duplicate of findDuplicateIds(personal.experience)) {
      context.addIssue({
        code: 'custom',
        message: `Duplicate experience id "${duplicate.id}" at records ${duplicate.firstIndex} and ${duplicate.index}.`,
        path: ['experience', duplicate.index, 'id'],
      });
    }
  });

export const PersonalConfigSchema: z.ZodType<PersonalConfig> =
  PersonalConfigBaseSchema.transform(
    ({
      biography,
      contacts,
      experience,
      identity,
      localizedText,
      metrics,
      principles,
      resumeUrl,
      site,
      skills,
      socials,
    }) =>
      Object.freeze({
        identity,
        biography,
        skills,
        experience,
        principles,
        contacts,
        socials,
        ...(resumeUrl === undefined ? {} : { resumeUrl }),
        site,
        localizedText,
        metrics,
      }),
  );

export const PersonalSchema = PersonalConfigSchema;

export const ProjectRecordSchema: z.ZodType<ProjectRecord> = z
  .object({
    id: RequiredTextSchema,
    name: RequiredTextSchema,
    summary: RequiredTextSchema,
    category: RequiredTextSchema,
    status: ProjectStatusSchema,
    technologies: RequiredTextListSchema,
    tags: RequiredTextListSchema,
    featured: z.boolean(),
    demoUrl: OptionalHttpsUrlSchema,
    sourceUrl: OptionalHttpsUrlSchema,
    metrics: z.array(VerifiedMetricSchema).readonly().optional(),
  })
  .strict()
  .transform(
    ({
      category,
      demoUrl,
      featured,
      id,
      metrics,
      name,
      sourceUrl,
      status,
      summary,
      tags,
      technologies,
    }) =>
      Object.freeze({
        id,
        name,
        summary,
        category,
        status,
        technologies,
        tags,
        featured,
        ...(demoUrl === undefined ? {} : { demoUrl }),
        ...(sourceUrl === undefined ? {} : { sourceUrl }),
        ...(metrics === undefined || metrics.length === 0 ? {} : { metrics }),
      }),
  );

export const ProjectSchema = ProjectRecordSchema;

export const ProjectCatalogSchema = z
  .array(ProjectRecordSchema)
  .superRefine((projects, context) => {
    for (const duplicate of findDuplicateIds(projects)) {
      context.addIssue({
        code: 'custom',
        message: `Duplicate project id "${duplicate.id}" at records ${duplicate.firstIndex} and ${duplicate.index}.`,
        path: [duplicate.index, 'id'],
      });
    }
  })
  .readonly();

const ToolLoaderSchema = z.custom<ToolDefinition['load']>(
  (value) => typeof value === 'function',
  { message: 'Expected a lazy tool module loader.' },
);

export const ToolDefinitionSchema: z.ZodType<ToolDefinition> = z
  .object({
    id: ToolIdSchema,
    name: RequiredTextSchema,
    capability: RequiredTextSchema,
    route: z.string(),
    keywords: RequiredTextListSchema,
    load: ToolLoaderSchema,
  })
  .strict()
  .superRefine((tool, context) => {
    const expectedRoute: ToolRoute = `#/tools/${tool.id}`;
    if (tool.route !== expectedRoute) {
      context.addIssue({
        code: 'custom',
        message: `Expected route "${expectedRoute}" for tool "${tool.id}".`,
        path: ['route'],
      });
    }
  })
  .transform((tool) => Object.freeze(tool) as ToolDefinition);

export const ToolSchema = ToolDefinitionSchema;

export const UniqueToolDefinitionsSchema = z
  .array(ToolDefinitionSchema)
  .superRefine((tools, context) => {
    for (const duplicate of findDuplicateIds(tools)) {
      context.addIssue({
        code: 'custom',
        message: `Duplicate tool id "${duplicate.id}" at records ${duplicate.firstIndex} and ${duplicate.index}.`,
        path: [duplicate.index, 'id'],
      });
    }
  })
  .readonly();

export const ToolRegistrySchema = z
  .array(ToolDefinitionSchema)
  .superRefine((tools, context) => {
    for (const duplicate of findDuplicateIds(tools)) {
      context.addIssue({
        code: 'custom',
        message: `Duplicate tool id "${duplicate.id}" at records ${duplicate.firstIndex} and ${duplicate.index}.`,
        path: [duplicate.index, 'id'],
      });
    }

    const configuredIds = new Set(tools.map(({ id }) => id));
    const missingIds = TOOL_IDS.filter((id) => !configuredIds.has(id));
    if (missingIds.length > 0) {
      context.addIssue({
        code: 'custom',
        message: `Tool registry is missing required ids: ${missingIds.join(', ')}.`,
      });
    }
  })
  .readonly();

type DuplicateId = Readonly<{
  id: string;
  firstIndex: number;
  index: number;
}>;

function findDuplicateIds(
  records: readonly Readonly<{ id: string }>[],
): readonly DuplicateId[] {
  const firstIndexes = new Map<string, number>();
  const duplicates: DuplicateId[] = [];

  records.forEach(({ id }, index) => {
    const firstIndex = firstIndexes.get(id);
    if (firstIndex === undefined) {
      firstIndexes.set(id, index);
      return;
    }

    duplicates.push(Object.freeze({ id, firstIndex, index }));
  });

  return duplicates;
}

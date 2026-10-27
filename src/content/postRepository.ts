import { z } from 'zod';

export type PostHeading = Readonly<{
  id: string;
  text: string;
  level: 2 | 3;
}>;

export type PublishedPost = Readonly<{
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  category: string;
  collection?: string | undefined;
  author: string;
  copyright: string;
  tags: readonly string[];
  draft: false;
  body: string;
  readingTime: number;
  headings: readonly PostHeading[];
  sourcePath: string;
}>;

const FrontmatterSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  publishedAt: z.string().datetime({ offset: true }),
  category: z.string().trim().min(1),
  collection: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  author: z.string().trim().min(1).default('TODO_REPLACE'),
  copyright: z.string().trim().min(1).default('All rights reserved.'),
  tags: z.array(z.string().trim().min(1)).min(1),
  draft: z.boolean().default(false),
});

const postSources = import.meta.glob<string>('../../content/posts/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});

function stripMarkdown(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWordUnits(source: string): number {
  const text = stripMarkdown(source);
  const latinUnits = text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? [];
  const cjkUnits = text.match(/[\u3040-\u30ff\u3400-\u9fff]/g) ?? [];
  return latinUnits.length + cjkUnits.length;
}

function slugifyHeading(text: string): string {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/[`*_]/g, '')
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'section';
}

function headingsFromMarkdown(source: string): readonly PostHeading[] {
  const used = new Map<string, number>();
  const headings: PostHeading[] = [];
  const matcher = /^(#{2,3})\s+(.+?)\s*#*\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(source)) !== null) {
    const rawLevel = match[1];
    const text = match[2]?.trim();
    if (text === undefined || (rawLevel !== '##' && rawLevel !== '###')) {
      continue;
    }
    const base = slugifyHeading(text);
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    headings.push({
      id: count === 0 ? base : `${base}-${count + 1}`,
      text,
      level: rawLevel === '##' ? 2 : 3,
    });
  }
  return Object.freeze(headings);
}

function parseScalar(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;

  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  return value;
}

type ParsedFrontmatter = Readonly<{
  data: Record<string, unknown>;
  content: string;
}>;

function parseFrontmatter(
  sourcePath: string,
  rawSource: string,
): ParsedFrontmatter {
  const normalized = rawSource.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u);
  if (match === null) {
    throw new Error(`Markdown post is missing frontmatter: ${sourcePath}`);
  }

  const frontmatterText = match[1] ?? '';
  const content = match[2] ?? '';
  const data: Record<string, unknown> = {};
  let activeListKey: string | undefined;

  for (const line of frontmatterText.split('\n')) {
    if (line.trim().length === 0) continue;

    const listItem = line.match(/^\s+-\s+(.+)$/u);
    if (listItem !== null) {
      if (activeListKey === undefined) {
        throw new Error(`Unexpected frontmatter list item: ${sourcePath}`);
      }
      const current = data[activeListKey];
      if (!Array.isArray(current)) {
        throw new Error(`Invalid frontmatter list: ${sourcePath}`);
      }
      current.push(parseScalar(listItem[1] ?? ''));
      continue;
    }

    const field = line.match(/^([A-Za-z][A-Za-z0-9]*)\s*:\s*(.*)$/u);
    if (field === null) {
      throw new Error(`Invalid frontmatter line: ${sourcePath}`);
    }

    const key = field[1];
    const value = field[2]?.trim() ?? '';
    if (key === undefined) continue;

    if (value.length === 0) {
      data[key] = [];
      activeListKey = key;
    } else {
      data[key] = parseScalar(value);
      activeListKey = undefined;
    }
  }

  return { data, content };
}

function parsePost(sourcePath: string, rawSource: string): PublishedPost | undefined {
  const parsed = parseFrontmatter(sourcePath, rawSource);
  const frontmatter = FrontmatterSchema.parse(parsed.data);
  if (frontmatter.draft) {
    return undefined;
  }
  const body = parsed.content.trim();
  if (body.length === 0) {
    throw new Error(`Markdown post has empty body: ${sourcePath}`);
  }
  const readingTime = Math.max(1, Math.ceil(countWordUnits(body) / 250));
  return Object.freeze({
    ...frontmatter,
    draft: false,
    body,
    readingTime,
    headings: headingsFromMarkdown(body),
    sourcePath,
  });
}

const parsedPosts = Object.entries(postSources)
  .map(([sourcePath, source]) => parsePost(sourcePath, source))
  .filter((post): post is PublishedPost => post !== undefined)
  .sort((left, right) => {
    const dateOrder = right.publishedAt.localeCompare(left.publishedAt);
    return dateOrder === 0 ? left.slug.localeCompare(right.slug) : dateOrder;
  });

const duplicateSlugs = parsedPosts
  .map((post) => post.slug)
  .filter((slug, index, slugs) => slugs.indexOf(slug) !== index);
if (duplicateSlugs.length > 0) {
  throw new Error(`Duplicate published post slug: ${duplicateSlugs[0]}`);
}

export const publishedPosts: readonly PublishedPost[] = Object.freeze(parsedPosts);

export function findPublishedPost(slug: string): PublishedPost | undefined {
  return publishedPosts.find((post) => post.slug === slug);
}

export function getPostsInCollection(collectionId: string): readonly PublishedPost[] {
  return Object.freeze(
    publishedPosts.filter((post) => post.collection === collectionId),
  );
}

export function getRecentPosts(limit = 3): readonly PublishedPost[] {
  return publishedPosts.slice(0, Math.max(0, limit));
}

export function getPostCategories(): readonly string[] {
  return Object.freeze([...new Set(publishedPosts.map((post) => post.category))].sort());
}

export function getPostTags(): readonly string[] {
  return Object.freeze([...new Set(publishedPosts.flatMap((post) => post.tags))].sort());
}

import { publishedPosts, findPublishedPost, type PublishedPost } from '../content/postRepository';
import type { ToolDefinition } from '../config/schemas';
import { toolRegistry } from '../config/tools';

export type PublishedArticleRouteRecord = Readonly<{
  slug: string;
  title: string;
}>;

export type ArticleRouteRepository = Readonly<{
  findPublishedBySlug: (slug: string) => PublishedArticleRouteRecord | undefined;
}>;

export const articleRouteRepository: ArticleRouteRepository = Object.freeze({
  findPublishedBySlug: (slug: string) => {
    const article = findPublishedPost(slug);
    return article === undefined
      ? undefined
      : { slug: article.slug, title: article.title };
  },
});

export type ToolRouteRepository = Readonly<{
  findById: (toolId: string) => ToolDefinition | undefined;
}>;

export const toolRouteRepository: ToolRouteRepository = Object.freeze({
  findById: (toolId: string) => toolRegistry.find(({ id }) => id === toolId),
});

export function getPublishedArticleRoutes(): readonly PublishedArticleRouteRecord[] {
  return publishedPosts.map(({ slug, title }) => ({ slug, title }));
}

export function getPublishedArticle(slug: string): PublishedPost | undefined {
  return findPublishedPost(slug);
}

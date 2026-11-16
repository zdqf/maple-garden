import { getArticleCategory } from '../config/articleCategories';
import { getContentCollection } from '../config/contentCollections';

type PostOrganization = Readonly<{
  slug: string;
  category: string;
  collection?: string | undefined;
}>;

/** Keep the filesystem, topic navigation, and collection index in agreement. */
export function assertPostOrganization(
  sourcePath: string,
  post: PostOrganization,
): void {
  if (getArticleCategory(post.category) === undefined) {
    throw new Error(`Unknown article category "${post.category}": ${sourcePath}`);
  }

  if (post.collection !== undefined) {
    const collection = getContentCollection(post.collection);
    if (collection === undefined) {
      throw new Error(`Unknown content collection "${post.collection}": ${sourcePath}`);
    }
    if (collection.category !== post.category) {
      throw new Error(
        `Collection "${post.collection}" belongs to "${collection.category}", not "${post.category}": ${sourcePath}`,
      );
    }
  }

  const expectedPath = `content/posts/${post.category}/${post.collection ? `${post.collection}/` : ''}${post.slug}.md`;
  const normalizedPath = sourcePath.replaceAll('\\', '/').replace(/^(?:\.\.\/|\.\/)+/u, '');
  if (normalizedPath !== expectedPath) {
    throw new Error(`Article archive path must be "${expectedPath}": ${sourcePath}`);
  }
}

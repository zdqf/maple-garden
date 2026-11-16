import { describe, expect, it } from 'vitest';

import { assertPostOrganization } from './contentOrganization';
import { publishedPosts } from './postRepository';

describe('content archive organization', () => {
  it('keeps every published article in its registered topic and optional collection', () => {
    expect(publishedPosts.length).toBeGreaterThan(0);
    for (const post of publishedPosts) {
      expect(() => assertPostOrganization(post.sourcePath, post)).not.toThrow();
    }
  });

  it('accepts a standalone article and a collection article without deriving URLs from their folders', () => {
    expect(() => assertPostOrganization('../../content/posts/developer/notes.md', {
      slug: 'notes', category: 'developer',
    })).not.toThrow();
    expect(() => assertPostOrganization('..\\..\\content\\posts\\poetry\\zhu-zhang\\notes.md', {
      slug: 'notes', category: 'poetry', collection: 'zhu-zhang',
    })).not.toThrow();
  });

  it('catches unregistered topics and collections before they disappear from navigation', () => {
    expect(() => assertPostOrganization('content/posts/unknown/notes.md', {
      slug: 'notes', category: 'unknown',
    })).toThrow('Unknown article category "unknown"');
    expect(() => assertPostOrganization('content/posts/poetry/unknown/notes.md', {
      slug: 'notes', category: 'poetry', collection: 'unknown',
    })).toThrow('Unknown content collection "unknown"');
  });

  it('prevents a collection from appearing under an unrelated topic', () => {
    expect(() => assertPostOrganization('content/posts/developer/zhu-zhang/notes.md', {
      slug: 'notes', category: 'developer', collection: 'zhu-zhang',
    })).toThrow('belongs to "poetry", not "developer"');
  });

  it('reports the expected destination for a renamed article or excessive nesting', () => {
    for (const path of [
      'content/posts/developer/old-name.md',
      'content/posts/developer/typescript/notes.md',
      'content/posts/developer/2026/11/notes.md',
    ]) {
      expect(() => assertPostOrganization(path, {
        slug: 'notes', category: 'developer',
      })).toThrow('content/posts/developer/notes.md');
    }
  });
});

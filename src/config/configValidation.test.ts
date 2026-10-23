import { describe, expect, it } from 'vitest';

import { personalToViewModel } from '../domain/shared/configProjection';
import {
  PersonalConfigSchema,
  ProjectCatalogSchema,
  ProjectRecordSchema,
  TOOL_IDS,
  ToolRegistrySchema,
} from './schemas';

const validProject = {
  id: 'maple-garden',
  name: 'Maple-Garden',
  summary: 'A static developer garden.',
  category: 'web',
  status: 'completed' as const,
  technologies: ['TypeScript'],
  tags: ['static'],
  featured: true,
};

function validPersonalConfig() {
  return {
    identity: {
      name: 'Maintainer',
      headline: 'Developer',
    },
    biography: [],
    skills: ['TypeScript'],
    experience: [
      {
        id: 'current-role',
        organization: 'Organization',
        role: 'Developer',
        startDate: '2025-01-01',
      },
    ],
    principles: [],
    contacts: [],
    socials: [],
    site: {
      title: 'Maple-Garden',
      description: 'A static developer garden.',
      language: 'zh-CN',
      previewImagePath: 'images/social-preview.png',
    },
    localizedText: { home: '首页' },
    metrics: [],
  };
}

const validToolRegistry = TOOL_IDS.map((id) => ({
  id,
  name: id,
  capability: `Processes ${id} input locally.`,
  route: `#/tools/${id}`,
  keywords: [id],
  load: () => Promise.resolve({}),
}));

// Validates: Requirements 2.1, 2.2, 2.8, 4.1, 10.1, 12.6, 18.4
describe('central configuration validation examples', () => {
  it('reports deterministic owning paths for invalid external links', () => {
    const personalResult = PersonalConfigSchema.safeParse({
      ...validPersonalConfig(),
      contacts: [{ label: 'Website', href: 'http://example.com/profile' }],
      resumeUrl: 'mailto:maintainer@example.com',
    });
    const projectResult = ProjectCatalogSchema.safeParse([
      validProject,
      {
        ...validProject,
        id: 'unsafe-project',
        sourceUrl: 'http://example.com/source',
      },
    ]);

    expect(personalResult.success).toBe(false);
    if (!personalResult.success) {
      expect(
        personalResult.error.issues.map(({ message, path }) => ({
          path,
          message,
        })),
      ).toEqual([
        {
          path: ['contacts', 0, 'href'],
          message: 'Expected an absolute https, mailto, or tel URL.',
        },
        {
          path: ['resumeUrl'],
          message: 'Expected an absolute https URL.',
        },
      ]);
    }

    expect(projectResult.success).toBe(false);
    if (!projectResult.success) {
      expect(
        projectResult.error.issues.map(({ message, path }) => ({
          path,
          message,
        })),
      ).toEqual([
        {
          path: [1, 'sourceUrl'],
          message: 'Expected an absolute https URL.',
        },
      ]);
    }
  });

  it('omits Unicode-whitespace optional fields without producing diagnostics', () => {
    const project = ProjectRecordSchema.parse({
      ...validProject,
      demoUrl: '\u00a0\t',
      sourceUrl: '\r\n',
      metrics: [],
    });
    const personal = PersonalConfigSchema.parse({
      ...validPersonalConfig(),
      identity: {
        name: 'Maintainer',
        headline: 'Developer',
        avatarPath: '\u2003',
      },
      experience: [
        {
          ...validPersonalConfig().experience[0],
          endDate: '\u00a0',
          summary: '\t\n',
        },
      ],
      resumeUrl: '\u2003',
    });

    expect(project).not.toHaveProperty('demoUrl');
    expect(project).not.toHaveProperty('sourceUrl');
    expect(project).not.toHaveProperty('metrics');
    expect(personal.identity).not.toHaveProperty('avatarPath');
    expect(personal.experience[0]).not.toHaveProperty('endDate');
    expect(personal.experience[0]).not.toHaveProperty('summary');
    expect(personal).not.toHaveProperty('resumeUrl');
  });

  it('filters incomplete metrics but keeps their owned placeholder diagnosis visible', () => {
    const model = personalToViewModel({
      ...validPersonalConfig(),
      metrics: [
        {
          value: '42',
          meaning: 'Verified examples',
          source: 'https://example.com/evidence',
        },
        {
          value: 'TODO_REPLACE',
          meaning: '',
          source: 'https://example.com/incomplete',
        },
        {
          value: '7',
          meaning: 'Missing source',
        },
      ],
    });

    expect(model.metrics).toEqual([
      {
        value: '42',
        meaning: 'Verified examples',
        source: 'https://example.com/evidence',
      },
    ]);
    expect(model).toMatchObject({
      hasPlaceholder: true,
      placeholderLabel: '待替换',
    });
  });

  it('orders duplicate project diagnostics by owning record and points to each duplicate id', () => {
    const result = ProjectCatalogSchema.safeParse([
      { ...validProject, id: 'shared-project' },
      { ...validProject, id: 'other-project' },
      { ...validProject, id: ' shared-project ', name: 'Second owner' },
      { ...validProject, id: 'shared-project', name: 'Third owner' },
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.map(({ message, path }) => ({ path, message })),
      ).toEqual([
        {
          path: [2, 'id'],
          message:
            'Duplicate project id "shared-project" at records 0 and 2.',
        },
        {
          path: [3, 'id'],
          message:
            'Duplicate project id "shared-project" at records 0 and 3.',
        },
      ]);
    }
  });

  it('diagnoses an equal-length tool registry with both duplicate and missing ids', () => {
    const result = ToolRegistrySchema.safeParse([
      validToolRegistry[0],
      validToolRegistry[0],
      ...validToolRegistry.slice(2),
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.map(({ message, path }) => ({ path, message })),
      ).toEqual([
        {
          path: [1, 'id'],
          message: 'Duplicate tool id "json" at records 0 and 1.',
        },
        {
          path: [],
          message: 'Tool registry is missing required ids: base64.',
        },
      ]);
    }
  });
});

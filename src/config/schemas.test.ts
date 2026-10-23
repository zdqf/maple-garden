import { describe, expect, it } from 'vitest';

import {
  HttpsUrlSchema,
  LinkRecordSchema,
  PersonalConfigSchema,
  ProjectCatalogSchema,
  ProjectRecordSchema,
  RequiredTextSchema,
  TOOL_IDS,
  ToolDefinitionSchema,
  ToolIdSchema,
  ToolRegistrySchema,
} from './schemas';

const validProject = {
  id: 'garden',
  name: 'Developer Garden',
  summary: 'A static developer garden.',
  category: 'web',
  status: 'completed',
  technologies: ['TypeScript'],
  tags: ['static'],
  featured: true,
};

function validPersonalConfig() {
  return {
    identity: {
      name: 'Maintainer',
      headline: 'Developer',
      avatarPath: '   ',
    },
    biography: [],
    skills: ['TypeScript'],
    experience: [
      {
        id: 'current-role',
        organization: 'Organization',
        role: 'Developer',
        startDate: '2025-01-01',
        endDate: '',
        summary: ' ',
      },
    ],
    principles: [],
    contacts: [],
    socials: [],
    resumeUrl: ' ',
    site: {
      title: 'Developer Garden',
      description: 'A static developer garden.',
      language: 'zh-CN',
      previewImagePath: 'images/social-preview.png',
    },
    localizedText: { home: '首页' },
    metrics: [],
  };
}

describe('shared configuration schemas', () => {
  it('trims required text and rejects text that is empty after trimming', () => {
    expect(RequiredTextSchema.parse('  Developer Garden  ')).toBe(
      'Developer Garden',
    );
    expect(RequiredTextSchema.safeParse(' \n\t ').success).toBe(false);
  });

  it('accepts only allowed absolute link protocols and preserves the source href', () => {
    const href = 'HTTPS://example.com/Path?q=%2F';
    const link = LinkRecordSchema.parse({
      label: ' Website ',
      href,
      accessibleLabel: ' ',
    });

    expect(link).toEqual({ label: 'Website', href });
    expect(Object.isFrozen(link)).toBe(true);

    for (const allowedHref of [
      'https://example.com/path',
      'mailto:person@example.com',
      'tel:+8613800138000',
    ]) {
      expect(
        LinkRecordSchema.safeParse({ label: 'Contact', href: allowedHref })
          .success,
      ).toBe(true);
    }

    for (const rejectedHref of [
      'http://example.com',
      '/relative',
      'javascript:alert(1)',
      ' https://example.com',
      'https://',
    ]) {
      expect(
        LinkRecordSchema.safeParse({ label: 'Contact', href: rejectedHref })
          .success,
      ).toBe(false);
    }
  });

  it('uses the narrower https policy for project and résumé URLs', () => {
    expect(HttpsUrlSchema.safeParse('https://example.com/demo').success).toBe(
      true,
    );
    expect(HttpsUrlSchema.safeParse('mailto:person@example.com').success).toBe(
      false,
    );

    expect(
      ProjectRecordSchema.safeParse({
        ...validProject,
        demoUrl: 'mailto:person@example.com',
      }).success,
    ).toBe(false);

    expect(
      PersonalConfigSchema.safeParse({
        ...validPersonalConfig(),
        resumeUrl: 'tel:+8613800138000',
      }).success,
    ).toBe(false);
  });

  it('omits blank optional values from parsed records', () => {
    const project = ProjectRecordSchema.parse({
      ...validProject,
      demoUrl: '',
      sourceUrl: '  ',
      metrics: [],
    });
    const personal = PersonalConfigSchema.parse(validPersonalConfig());

    expect(project).not.toHaveProperty('demoUrl');
    expect(project).not.toHaveProperty('sourceUrl');
    expect(project).not.toHaveProperty('metrics');
    expect(personal).not.toHaveProperty('resumeUrl');
    expect(personal.identity).not.toHaveProperty('avatarPath');
    expect(personal.experience[0]).not.toHaveProperty('endDate');
    expect(personal.experience[0]).not.toHaveProperty('summary');
  });

  it('rejects invalid enums and tool routes that do not match the tool id', () => {
    expect(
      ProjectRecordSchema.safeParse({ ...validProject, status: 'paused' })
        .success,
    ).toBe(false);
    expect(ToolIdSchema.safeParse('markdown-preview').success).toBe(false);
    expect(
      ToolDefinitionSchema.safeParse({
        id: 'json',
        name: 'JSON',
        capability: 'Formats JSON locally.',
        route: '#/tools/url',
        keywords: ['format'],
        load: () => Promise.resolve({}),
      }).success,
    ).toBe(false);
  });

  it('reports duplicate project and experience ids with both owning indexes', () => {
    const duplicateProjects = ProjectCatalogSchema.safeParse([
      validProject,
      { ...validProject, name: 'Second project' },
    ]);
    expect(duplicateProjects.success).toBe(false);
    if (!duplicateProjects.success) {
      expect(duplicateProjects.error.issues[0]?.message).toContain(
        'records 0 and 1',
      );
      expect(duplicateProjects.error.issues[0]?.path).toEqual([1, 'id']);
    }

    const personal = validPersonalConfig();
    personal.experience.push({
      ...personal.experience[0]!,
      organization: 'Another organization',
    });
    const duplicateExperience = PersonalConfigSchema.safeParse(personal);
    expect(duplicateExperience.success).toBe(false);
    if (!duplicateExperience.success) {
      expect(duplicateExperience.error.issues[0]?.message).toContain(
        'records 0 and 1',
      );
    }
  });

  it('validates an exact, unique ten-tool registry', () => {
    const registry = TOOL_IDS.map((id) => ({
      id,
      name: id,
      capability: `Processes ${id} input locally.`,
      route: `#/tools/${id}`,
      keywords: [id],
      load: () => Promise.resolve({}),
    }));

    expect(ToolRegistrySchema.safeParse(registry).success).toBe(true);
    expect(ToolRegistrySchema.safeParse(registry.slice(1)).success).toBe(false);
    expect(
      ToolRegistrySchema.safeParse([...registry, registry[0]]).success,
    ).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import {
  filterCompleteMetrics,
  personalToViewModel,
  projectToCardModel,
} from './configProjection';
import {
  containsPlaceholder,
  createPlaceholderViewMarker,
  PLACEHOLDER_VIEW_LABEL,
} from './placeholder';

const project = {
  id: 'garden',
  name: 'Developer Garden',
  summary: 'A static developer garden.',
  category: 'web',
  status: 'completed' as const,
  technologies: ['TypeScript'],
  tags: ['static'],
  featured: true,
};

const personal = {
  identity: {
    name: 'TODO_REPLACE',
    headline: 'Developer',
    avatarPath: '',
  },
  biography: [],
  skills: [],
  experience: [],
  principles: [],
  contacts: [],
  socials: [],
  resumeUrl: '',
  site: {
    title: 'Developer Garden',
    description: 'A static developer garden.',
    language: 'zh-CN',
    previewImagePath: 'images/social-preview.png',
  },
  localizedText: { home: '首页' },
  metrics: [],
};

describe('placeholder projection', () => {
  it('finds the exact placeholder token recursively without looping on cycles', () => {
    const cyclic: Record<string, unknown> = { value: 'verified' };
    cyclic.self = cyclic;

    expect(containsPlaceholder(cyclic)).toBe(false);
    expect(
      containsPlaceholder({
        nested: [{ value: `prefix TODO_REPLACE suffix` }],
      }),
    ).toBe(true);
    expect(containsPlaceholder({ value: 'todo_replace' })).toBe(false);
    expect(containsPlaceholder({ value: 'TODO-REPLACE' })).toBe(false);
  });

  it('adds the visible marker exactly when placeholder data is owned', () => {
    expect(createPlaceholderViewMarker({ value: 'verified' })).toEqual({
      hasPlaceholder: false,
    });
    expect(
      createPlaceholderViewMarker({ value: 'TODO_REPLACE biography' }),
    ).toEqual({
      hasPlaceholder: true,
      placeholderLabel: PLACEHOLDER_VIEW_LABEL,
    });
  });
});

describe('configuration view projection', () => {
  it('keeps exactly complete metrics and preserves every retained source URL', () => {
    const source = 'https://example.com/evidence?q=%2F';
    const metrics = filterCompleteMetrics([
      { value: ' 42 ', meaning: ' Completed tasks ', source },
      { value: '1', meaning: '', source },
      { value: '2', source },
      { value: '3', meaning: 'Invalid source', source: 'http://example.com' },
      null,
    ]);

    expect(metrics).toEqual([
      { value: '42', meaning: 'Completed tasks', source },
    ]);
    expect(Object.isFrozen(metrics)).toBe(true);
  });

  it('omits empty optional project links and incomplete metric blocks', () => {
    const model = projectToCardModel({
      ...project,
      demoUrl: ' ',
      sourceUrl: '',
      metrics: [{ value: '1', meaning: '', source: 'https://example.com' }],
    });

    expect(model).not.toHaveProperty('demoUrl');
    expect(model).not.toHaveProperty('sourceUrl');
    expect(model).not.toHaveProperty('metrics');
    expect(model).toMatchObject({ hasPlaceholder: false });
  });

  it('preserves accepted project link values and marks nested placeholder data', () => {
    const demoUrl = 'https://example.com/Demo?q=%2F';
    const sourceUrl = 'HTTPS://example.com/Source';
    const model = projectToCardModel({
      ...project,
      summary: 'Outcome: TODO_REPLACE',
      demoUrl,
      sourceUrl,
    });

    expect(model.demoUrl).toBe(demoUrl);
    expect(model.sourceUrl).toBe(sourceUrl);
    expect(model).toMatchObject({
      hasPlaceholder: true,
      placeholderLabel: '待替换',
    });
  });

  it('rejects a non-empty invalid optional project link instead of hiding it', () => {
    expect(() =>
      projectToCardModel({
        ...project,
        demoUrl: 'http://example.com/demo',
      }),
    ).toThrow(/https URL/u);
  });

  it('omits empty personal sections and résumé while preserving placeholder state', () => {
    const model = personalToViewModel(personal);

    expect(model.identity).not.toHaveProperty('avatarPath');
    expect(model).not.toHaveProperty('biography');
    expect(model).not.toHaveProperty('skills');
    expect(model).not.toHaveProperty('experience');
    expect(model).not.toHaveProperty('principles');
    expect(model).not.toHaveProperty('contacts');
    expect(model).not.toHaveProperty('socials');
    expect(model).not.toHaveProperty('resumeUrl');
    expect(model).not.toHaveProperty('metrics');
    expect(model).toMatchObject({
      hasPlaceholder: true,
      placeholderLabel: '待替换',
    });
  });
});

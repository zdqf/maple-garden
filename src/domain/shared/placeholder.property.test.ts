import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  personalToViewModel,
  projectToCardModel,
} from './configProjection';
import {
  containsPlaceholder,
  createPlaceholderViewMarker,
  PLACEHOLDER_TOKEN,
  PLACEHOLDER_VIEW_LABEL,
  type PlaceholderViewMarker,
} from './placeholder';

const nestingPaths = [
  'personal.identity.name',
  'personal.biography[0]',
  'personal.experience[0].summary',
  'personal.metrics[0].meaning',
  'project.summary',
  'project.technologies[0]',
  'project.metrics[0].value',
] as const;

type NestingPath = (typeof nestingPaths)[number];

const tokenFreeStringArbitrary = fc
  .string({ maxLength: 32 })
  .filter((value) => !value.includes(PLACEHOLDER_TOKEN));

const exactTokenStringArbitrary = fc.oneof(
  fc.constant(PLACEHOLDER_TOKEN),
  tokenFreeStringArbitrary.map(
    (prefix) => `${prefix}${PLACEHOLDER_TOKEN}`,
  ),
  tokenFreeStringArbitrary.map(
    (suffix) => `${PLACEHOLDER_TOKEN}${suffix}`,
  ),
  fc
    .tuple(tokenFreeStringArbitrary, tokenFreeStringArbitrary)
    .map(([prefix, suffix]) => `${prefix}${PLACEHOLDER_TOKEN}${suffix}`),
);

const nearTokenStringArbitrary = fc.constantFrom(
  '',
  ' ',
  'todo_replace',
  'Todo_Replace',
  'TODO-replace',
  'TODO-REPLACE',
  'TODO_REPLAC',
  'TODO__REPLACE',
  'TODO _REPLACE',
  ' TODO_REPLAC ',
);

const candidateStringArbitrary = fc.oneof(
  exactTokenStringArbitrary,
  nearTokenStringArbitrary,
  tokenFreeStringArbitrary,
);

function referenceContainsExactToken(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.includes(PLACEHOLDER_TOKEN);
  }

  if (value === null || typeof value !== 'object') {
    return false;
  }

  return Object.values(value).some(referenceContainsExactToken);
}

function requiredCandidate(candidate: string): string {
  return candidate.trim().length === 0 ? 'verified-boundary' : candidate;
}

function buildOwnedSources(path: NestingPath, candidate: string) {
  const selected = (candidatePath: NestingPath): string =>
    path === candidatePath ? requiredCandidate(candidate) : 'verified';

  const personal = {
    identity: {
      name: selected('personal.identity.name'),
      headline: 'Developer',
      avatarPath: '',
    },
    biography: [selected('personal.biography[0]')],
    skills: ['TypeScript'],
    experience: [
      {
        id: 'experience-1',
        organization: 'Example organization',
        role: 'Developer',
        startDate: '2024-01-01',
        summary: selected('personal.experience[0].summary'),
      },
    ],
    principles: ['Be precise'],
    contacts: [],
    socials: [],
    site: {
      title: 'Developer Garden',
      description: 'A static developer garden.',
      language: 'zh-CN',
      previewImagePath: 'images/social-preview.png',
    },
    localizedText: { home: '首页' },
    metrics: [
      {
        value: '1',
        meaning: selected('personal.metrics[0].meaning'),
        source: 'https://example.com/personal-evidence',
      },
    ],
  };

  const project = {
    id: 'project-1',
    name: 'Developer Garden',
    summary: selected('project.summary'),
    category: 'web',
    status: 'completed' as const,
    technologies: [selected('project.technologies[0]')],
    tags: ['static'],
    featured: true,
    metrics: [
      {
        value: selected('project.metrics[0].value'),
        meaning: 'Completed work',
        source: 'https://example.com/project-evidence',
      },
    ],
  };

  return { personal, project };
}

function expectExactMarker(
  marker: PlaceholderViewMarker,
  expected: boolean,
): void {
  expect(marker.hasPlaceholder).toBe(expected);

  if (expected) {
    expect(marker).toMatchObject({
      hasPlaceholder: true,
      placeholderLabel: PLACEHOLDER_VIEW_LABEL,
    });
  } else {
    expect(marker).toMatchObject({ hasPlaceholder: false });
    expect(marker).not.toHaveProperty('placeholderLabel');
  }
}

describe('placeholder exact propagation property', () => {
  // **Validates: Requirements 2.3, 2.4, 12.6**
  it('Feature: maple-garden, Property 2: 占位数据精确传播', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...nestingPaths),
        candidateStringArbitrary,
        (path, candidate) => {
          const sources = buildOwnedSources(path, candidate);
          const personalExpected = referenceContainsExactToken(
            sources.personal,
          );
          const projectExpected = referenceContainsExactToken(sources.project);
          const combinedExpected = personalExpected || projectExpected;

          expect(combinedExpected).toBe(
            candidate.includes(PLACEHOLDER_TOKEN),
          );
          expect(containsPlaceholder(sources)).toBe(combinedExpected);
          expectExactMarker(
            createPlaceholderViewMarker(sources),
            combinedExpected,
          );

          expectExactMarker(
            personalToViewModel(sources.personal),
            personalExpected,
          );
          expectExactMarker(
            projectToCardModel(sources.project),
            projectExpected,
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});

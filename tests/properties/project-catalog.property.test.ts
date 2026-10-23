import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  PROJECT_STATUSES,
  ProjectCatalogSchema,
  type ProjectStatus,
} from '../../src/config/schemas';

type GeneratedProjectRecord = {
  id: string;
  name: string;
  summary: string;
  category: string;
  status: ProjectStatus;
  technologies: string[];
  tags: string[];
  featured: boolean;
};

const NUM_RUNS = 100;
const REQUIRED_KEYS = [
  'id',
  'name',
  'summary',
  'category',
  'status',
  'technologies',
  'tags',
  'featured',
] as const;
const REQUIRED_CONTENT_LOCATIONS = [
  'id',
  'name',
  'summary',
  'category',
  'technologies',
  'tags',
] as const;

const nonBlankTextArbitrary = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((value) => value.trim().length > 0);

const requiredTextArbitrary = fc
  .tuple(
    fc.constantFrom('', ' ', '\t'),
    nonBlankTextArbitrary,
    fc.constantFrom('', ' ', '\n'),
  )
  .map(([leading, value, trailing]) => `${leading}${value}${trailing}`);

const projectRecordArbitrary: fc.Arbitrary<GeneratedProjectRecord> = fc.record({
  id: requiredTextArbitrary,
  name: requiredTextArbitrary,
  summary: requiredTextArbitrary,
  category: requiredTextArbitrary,
  status: fc.constantFrom(...PROJECT_STATUSES),
  technologies: fc.array(requiredTextArbitrary, {
    minLength: 1,
    maxLength: 5,
  }),
  tags: fc.array(requiredTextArbitrary, { minLength: 1, maxLength: 5 }),
  featured: fc.boolean(),
});

const validCatalogArbitrary = fc.uniqueArray(projectRecordArbitrary, {
  minLength: 0,
  maxLength: 8,
  selector: (project) => project.id.trim(),
});

const duplicateCatalogArbitrary = fc
  .uniqueArray(projectRecordArbitrary, {
    minLength: 1,
    maxLength: 8,
    selector: (project) => project.id.trim(),
  })
  .chain((catalog) =>
    fc
      .integer({ min: 0, max: catalog.length - 1 })
      .map((firstIndex) => ({
        catalog: [
          ...catalog,
          {
            ...catalog[firstIndex]!,
            name: `${catalog[firstIndex]!.name.trim()} duplicate`,
          },
        ],
        duplicateId: catalog[firstIndex]!.id.trim(),
        duplicateIndex: catalog.length,
        firstIndex,
      })),
  );

const invalidStatusArbitrary = fc
  .string({ minLength: 0, maxLength: 24 })
  .filter((status) => !new Set<string>(PROJECT_STATUSES).has(status));

const blankTextArbitrary = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), {
    minLength: 1,
    maxLength: 8,
  })
  .map((characters) => characters.join(''));

function normalizedRequiredStructure(project: GeneratedProjectRecord) {
  return {
    ...project,
    id: project.id.trim(),
    name: project.name.trim(),
    summary: project.summary.trim(),
    category: project.category.trim(),
    technologies: project.technologies.map((technology) => technology.trim()),
    tags: project.tags.map((tag) => tag.trim()),
  };
}

describe('Project catalog properties', () => {
  it('Feature: maple-garden, Property 7: accepts valid records and preserves every required field', () => {
    fc.assert(
      fc.property(validCatalogArbitrary, (catalog) => {
        const result = ProjectCatalogSchema.safeParse(catalog);

        expect(result.success).toBe(true);
        if (!result.success) return;

        expect(result.data).toEqual(
          catalog.map((project) => normalizedRequiredStructure(project)),
        );
        expect(new Set(result.data.map(({ id }) => id)).size).toBe(
          result.data.length,
        );
        for (const project of result.data) {
          for (const key of REQUIRED_KEYS) {
            expect(Object.hasOwn(project, key)).toBe(true);
          }
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('Feature: maple-garden, Property 7: rejects duplicate IDs and identifies both owning records', () => {
    fc.assert(
      fc.property(
        duplicateCatalogArbitrary,
        ({ catalog, duplicateId, duplicateIndex, firstIndex }) => {
          const result = ProjectCatalogSchema.safeParse(catalog);

          expect(result.success).toBe(false);
          if (result.success) return;

          const duplicateIssue = result.error.issues.find(
            ({ path }) =>
              path.length === 2 &&
              path[0] === duplicateIndex &&
              path[1] === 'id',
          );
          expect(duplicateIssue?.message).toContain(
            `Duplicate project id "${duplicateId}"`,
          );
          expect(duplicateIssue?.message).toContain(
            `records ${firstIndex} and ${duplicateIndex}`,
          );
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Feature: maple-garden, Property 7: rejects every status outside the project status enum', () => {
    fc.assert(
      fc.property(
        projectRecordArbitrary,
        invalidStatusArbitrary,
        (project, invalidStatus) => {
          expect(
            ProjectCatalogSchema.safeParse([
              { ...project, status: invalidStatus },
            ]).success,
          ).toBe(false);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Feature: maple-garden, Property 7: rejects blank required text and blank list items', () => {
    fc.assert(
      fc.property(
        projectRecordArbitrary,
        fc.constantFrom(...REQUIRED_CONTENT_LOCATIONS),
        blankTextArbitrary,
        (project, location, blankText) => {
          const invalidProject =
            location === 'technologies' || location === 'tags'
              ? { ...project, [location]: [blankText] }
              : { ...project, [location]: blankText };

          expect(ProjectCatalogSchema.safeParse([invalidProject]).success).toBe(
            false,
          );
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});

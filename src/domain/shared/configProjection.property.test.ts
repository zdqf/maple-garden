import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  LinkRecordSchema,
  type Experience,
  type LinkRecord,
} from '../../config/schemas';
import {
  personalToViewModel,
  projectToCardModel,
  type PersonalProjectionInput,
  type ProjectProjectionInput,
} from './configProjection';

const NUM_RUNS = 100;

const BASE_PROJECT: ProjectProjectionInput = {
  id: 'maple-garden',
  name: 'Maple-Garden',
  summary: 'A static developer garden.',
  category: 'web',
  status: 'completed',
  technologies: ['TypeScript'],
  tags: ['static'],
  featured: true,
};

const BASE_PERSONAL: PersonalProjectionInput = {
  identity: {
    name: 'Garden Maintainer',
    headline: 'Developer',
  },
  biography: [],
  skills: [],
  experience: [],
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

const tokenArbitrary = fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/u);
const textArbitrary = tokenArbitrary.map((token) => `Value ${token}`);
const whitespaceArbitrary = fc.constantFrom('', ' ', '\t', '\n', ' \t\r\n ');

const httpsUrlArbitrary = fc
  .record({
    scheme: fc.constantFrom('https', 'HTTPS'),
    host: tokenArbitrary,
    path: tokenArbitrary,
    query: tokenArbitrary,
  })
  .map(
    ({ host, path, query, scheme }) =>
      `${scheme}://${host}.example/${path}?ref=${query}`,
  );

type OptionalUrlCase =
  | Readonly<{ kind: 'omitted' }>
  | Readonly<{ kind: 'empty'; value: string }>
  | Readonly<{ kind: 'valid'; value: string }>;

const optionalHttpsUrlArbitrary: fc.Arbitrary<OptionalUrlCase> = fc.oneof(
  fc.constant({ kind: 'omitted' } as const),
  whitespaceArbitrary.map((value) => ({ kind: 'empty' as const, value })),
  httpsUrlArbitrary.map((value) => ({ kind: 'valid' as const, value })),
);

const optionalTextSectionArbitrary = fc.oneof(
  fc.constant([] as readonly string[]),
  fc.array(textArbitrary, { minLength: 1, maxLength: 4 }),
);

const optionalExperienceSectionArbitrary = fc.oneof(
  fc.constant([] as readonly Experience[]),
  fc
    .uniqueArray(tokenArbitrary, { minLength: 1, maxLength: 4 })
    .map((ids): readonly Experience[] =>
      ids.map((id, index) => ({
        id: `experience-${id}`,
        organization: `Organization ${id}`,
        role: `Role ${id}`,
        startDate: `202${String(index)}-01-01`,
      })),
    ),
);

const linkArbitrary: fc.Arbitrary<LinkRecord> = fc
  .record({
    label: textArbitrary,
    href: httpsUrlArbitrary,
  })
  .map((link) => LinkRecordSchema.parse(link));

const optionalLinkSectionArbitrary = fc.oneof(
  fc.constant([] as readonly LinkRecord[]),
  fc.array(linkArbitrary, { minLength: 1, maxLength: 4 }),
);

const personalOptionalsArbitrary = fc.record({
  biography: optionalTextSectionArbitrary,
  skills: optionalTextSectionArbitrary,
  experience: optionalExperienceSectionArbitrary,
  principles: optionalTextSectionArbitrary,
  contacts: optionalLinkSectionArbitrary,
  socials: optionalLinkSectionArbitrary,
  resume: optionalHttpsUrlArbitrary,
});

const invalidHttpsUrlArbitrary = fc.oneof(
  tokenArbitrary.map((token) => `http://${token}.example/project`),
  tokenArbitrary.map((token) => `ftp://${token}.example/project`),
  tokenArbitrary.map((token) => `/projects/${token}`),
  tokenArbitrary.map((token) => `mailto:${token}@example.com`),
  fc.constant('tel:+8613800138000'),
  httpsUrlArbitrary.map((url) => ` ${url}`),
);

const PERSONAL_SECTION_KEYS = [
  'biography',
  'skills',
  'experience',
  'principles',
  'contacts',
  'socials',
] as const;
const OPTIONAL_PERSONAL_KEYS = new Set<string>([
  ...PERSONAL_SECTION_KEYS,
  'resumeUrl',
]);

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

// **Validates: Requirements 2.7, 4.4, 4.5, 4.6, 4.7, 12.3, 12.4, 12.5**
describe('Feature: maple-garden, Property 4: 可选内容精确投影', () => {
  it('Feature: maple-garden, Property 4: 精确省略空项目链接并原样保留有效链接', () => {
    fc.assert(
      fc.property(
        optionalHttpsUrlArbitrary,
        optionalHttpsUrlArbitrary,
        (demo, source) => {
          const model = projectToCardModel({
            ...BASE_PROJECT,
            ...(demo.kind === 'omitted' ? {} : { demoUrl: demo.value }),
            ...(source.kind === 'omitted'
              ? {}
              : { sourceUrl: source.value }),
          });

          expect(hasOwn(model, 'demoUrl')).toBe(demo.kind === 'valid');
          expect(hasOwn(model, 'sourceUrl')).toBe(source.kind === 'valid');

          if (demo.kind === 'valid') {
            expect(model.demoUrl).toBe(demo.value);
          }
          if (source.kind === 'valid') {
            expect(model.sourceUrl).toBe(source.value);
          }
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });

  it('Feature: maple-garden, Property 4: 精确省略空个人 section 与简历且保留其余投影顺序和值', () => {
    fc.assert(
      fc.property(personalOptionalsArbitrary, (optionals) => {
        const {
          biography,
          contacts,
          experience,
          principles,
          resume,
          skills,
          socials,
        } = optionals;
        const source: PersonalProjectionInput = {
          ...BASE_PERSONAL,
          biography,
          skills,
          experience,
          principles,
          contacts,
          socials,
          ...(resume.kind === 'omitted' ? {} : { resumeUrl: resume.value }),
        };
        const model = personalToViewModel(source);

        for (const key of PERSONAL_SECTION_KEYS) {
          const shouldProject = source[key].length > 0;
          expect(hasOwn(model, key)).toBe(shouldProject);
          if (shouldProject) {
            expect(model[key]).toEqual(source[key]);
          }
        }

        expect(hasOwn(model, 'resumeUrl')).toBe(resume.kind === 'valid');
        if (resume.kind === 'valid') {
          expect(model.resumeUrl).toBe(resume.value);
        }

        const expectedOptionalKeys = [
          ...PERSONAL_SECTION_KEYS.filter((key) => source[key].length > 0),
          ...(resume.kind === 'valid' ? ['resumeUrl'] : []),
        ];
        const projectedOptionalKeys = Object.keys(model).filter((key) =>
          OPTIONAL_PERSONAL_KEYS.has(key),
        );

        expect(projectedOptionalKeys).toEqual(expectedOptionalKeys);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it('Feature: maple-garden, Property 4: 拒绝所有非法非空项目链接与简历值', () => {
    fc.assert(
      fc.property(invalidHttpsUrlArbitrary, (invalidUrl) => {
        expect(() =>
          projectToCardModel({
            ...BASE_PROJECT,
            demoUrl: invalidUrl,
          }),
        ).toThrow(/absolute https URL/u);
        expect(() =>
          projectToCardModel({
            ...BASE_PROJECT,
            sourceUrl: invalidUrl,
          }),
        ).toThrow(/absolute https URL/u);
        expect(() =>
          personalToViewModel({
            ...BASE_PERSONAL,
            resumeUrl: invalidUrl,
          }),
        ).toThrow(/absolute https URL/u);
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

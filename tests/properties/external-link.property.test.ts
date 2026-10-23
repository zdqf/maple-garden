import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  HttpsUrlSchema,
  LinkRecordSchema,
} from '../../src/config/schemas';
import {
  personalToViewModel,
  projectToCardModel,
} from '../../src/domain/shared/configProjection';
import { isAllowedExternalUrl } from '../../src/domain/shared/urlPolicy';

const PROPERTY_TITLE =
  'Feature: maple-garden, Property 1: 外部链接协议、安全属性与配置保真';
const NUM_RUNS = 200;
const ALLOWED_PROTOCOLS = new Set(['https:', 'mailto:', 'tel:']);
const ALPHANUMERIC =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const tokenArbitrary = fc
  .array(fc.integer({ min: 0, max: ALPHANUMERIC.length - 1 }), {
    minLength: 1,
    maxLength: 24,
  })
  .map((indexes) => indexes.map((index) => ALPHANUMERIC[index]).join(''));

const domainArbitrary = fc
  .tuple(tokenArbitrary, fc.constantFrom('example', 'test', 'dev'))
  .map(([label, suffix]) => `${label.toLowerCase()}.${suffix}`);

const httpsUrlArbitrary = fc
  .record({
    scheme: fc.constantFrom('https', 'HTTPS', 'Https'),
    domain: domainArbitrary,
    path: fc.array(tokenArbitrary, { minLength: 0, maxLength: 4 }),
    query: tokenArbitrary,
    fragment: tokenArbitrary,
  })
  .map(
    ({ scheme, domain, path, query, fragment }) =>
      `${scheme}://${domain}/${path.map(encodeURIComponent).join('/')}?value=${encodeURIComponent(query)}%2F#${encodeURIComponent(fragment)}`,
  );

const mailtoUrlArbitrary = fc
  .record({
    scheme: fc.constantFrom('mailto', 'MAILTO', 'Mailto'),
    localPart: tokenArbitrary,
    domain: domainArbitrary,
    subject: tokenArbitrary,
  })
  .map(
    ({ scheme, localPart, domain, subject }) =>
      `${scheme}:${localPart}@${domain}?subject=${encodeURIComponent(subject)}%2F`,
  );

const telUrlArbitrary = fc
  .record({
    scheme: fc.constantFrom('tel', 'TEL', 'Tel'),
    digits: fc.array(fc.integer({ min: 0, max: 9 }), {
      minLength: 7,
      maxLength: 15,
    }),
  })
  .map(
    ({ scheme, digits }) =>
      `${scheme}:+${digits.map(String).join('')}`,
  );

const allowedExternalUrlArbitrary = fc.oneof(
  httpsUrlArbitrary,
  mailtoUrlArbitrary,
  telUrlArbitrary,
);
const nonHttpsAllowedUrlArbitrary = fc.oneof(
  mailtoUrlArbitrary,
  telUrlArbitrary,
);

const disallowedProtocolUrlArbitrary = fc
  .tuple(
    fc.constantFrom(
      'http',
      'HTTP',
      'javascript',
      'JAVASCRIPT',
      'data',
      'ftp',
      'file',
      'ws',
      'wss',
      'blob',
    ),
    domainArbitrary,
    tokenArbitrary,
  )
  .map(([scheme, domain, payload]) => {
    switch (scheme.toLowerCase()) {
      case 'http':
      case 'ftp':
      case 'ws':
      case 'wss':
        return `${scheme}://${domain}/${payload}`;
      case 'file':
        return `${scheme}:///${payload}`;
      case 'blob':
        return `${scheme}:https://${domain}/${payload}`;
      case 'javascript':
        return `${scheme}:alert(${payload})`;
      default:
        return `${scheme}:text/plain,${payload}`;
    }
  });

const invalidUrlArbitrary = fc.oneof(
  tokenArbitrary.map((token) => `/${token}`),
  allowedExternalUrlArbitrary.map((url) => ` ${url}`),
  allowedExternalUrlArbitrary.map((url) => `${url}\n`),
  fc.constantFrom('', 'https://', 'https://[::1', 'not a URL'),
);

const externalUrlCandidateArbitrary = fc.oneof(
  allowedExternalUrlArbitrary,
  disallowedProtocolUrlArbitrary,
  invalidUrlArbitrary,
);

const validProject = {
  id: 'garden',
  name: 'Developer Garden',
  summary: 'A static developer garden.',
  category: 'web',
  status: 'completed' as const,
  technologies: ['TypeScript'],
  tags: ['static'],
  featured: true,
};

const validPersonal = {
  identity: { name: 'Maintainer', headline: 'Developer' },
  biography: [],
  skills: [],
  experience: [],
  principles: [],
  contacts: [],
  socials: [],
  site: {
    title: 'Developer Garden',
    description: 'A static developer garden.',
    language: 'zh-CN',
    previewImagePath: 'images/social-preview.png',
  },
  localizedText: { home: '首页' },
  metrics: [],
};

function referenceAllowsExternalUrl(value: string): boolean {
  if (value.length === 0 || value !== value.trim()) {
    return false;
  }

  try {
    return ALLOWED_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

// **Validates: Requirements 1.8, 2.8, 9.7, 9.8**
// DOM-level accessible-name and noopener/noreferrer assertions remain for the
// later ExternalLink/ArticleLink component tasks; those components do not exist yet.
describe(PROPERTY_TITLE, () => {
  it(`${PROPERTY_TITLE} — accepts exactly absolute allowed-protocol URLs`, () => {
    fc.assert(
      fc.property(externalUrlCandidateArbitrary, (candidate) => {
        expect(isAllowedExternalUrl(candidate)).toBe(
          referenceAllowsExternalUrl(candidate),
        );
        expect(
          LinkRecordSchema.safeParse({ label: 'External', href: candidate })
            .success,
        ).toBe(referenceAllowsExternalUrl(candidate));
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it(`${PROPERTY_TITLE} — preserves accepted configuration hrefs byte-for-byte`, () => {
    fc.assert(
      fc.property(allowedExternalUrlArbitrary, (href) => {
        const link = LinkRecordSchema.parse({ label: 'External', href });
        const personalModel = personalToViewModel({
          ...validPersonal,
          contacts: [link],
        });

        expect(link.href).toBe(href);
        expect(personalModel.contacts?.[0]?.href).toBe(href);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it(`${PROPERTY_TITLE} — enforces narrow HTTPS project links and blocks unsafe protocols`, () => {
    fc.assert(
      fc.property(
        httpsUrlArbitrary,
        httpsUrlArbitrary,
        nonHttpsAllowedUrlArbitrary,
        disallowedProtocolUrlArbitrary,
        (demoUrl, sourceUrl, nonHttpsUrl, unsafeUrl) => {
          const model = projectToCardModel({
            ...validProject,
            demoUrl,
            sourceUrl,
          });

          expect(HttpsUrlSchema.parse(demoUrl)).toBe(demoUrl);
          expect(model.demoUrl).toBe(demoUrl);
          expect(model.sourceUrl).toBe(sourceUrl);
          expect(HttpsUrlSchema.safeParse(nonHttpsUrl).success).toBe(false);
          expect(HttpsUrlSchema.safeParse(unsafeUrl).success).toBe(false);
          expect(
            LinkRecordSchema.safeParse({ label: 'Unsafe', href: unsafeUrl })
              .success,
          ).toBe(false);
        },
      ),
      { numRuns: NUM_RUNS },
    );
  });
});

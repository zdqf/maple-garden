import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { filterCompleteMetrics } from '../../src/domain/shared/configProjection';

type MetricCandidate = Readonly<{
  value: string;
  meaning: string;
  source: string;
}>;

type OrderedMetricCase = Readonly<{
  candidate: unknown;
  retained: MetricCandidate | null;
  order: number;
  sequence: number;
}>;

const wordArbitrary = fc
  .array(
    fc.constantFrom(
      ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    ),
    { minLength: 1, maxLength: 12 },
  )
  .map((characters) => characters.join(''));

const requiredTextArbitrary = fc
  .array(wordArbitrary, { minLength: 1, maxLength: 4 })
  .map((words) => words.join(' '));

const httpsSourceArbitrary = fc
  .tuple(
    fc.constantFrom('https', 'HTTPS'),
    fc.array(wordArbitrary, { minLength: 1, maxLength: 3 }),
    fc.integer(),
  )
  .map(
    ([protocol, path, id]) =>
      `${protocol}://example.com/${path.join('/')}?metric=${id}`,
  );

const validMetricArbitrary: fc.Arbitrary<MetricCandidate> = fc.record({
  value: requiredTextArbitrary,
  meaning: requiredTextArbitrary,
  source: httpsSourceArbitrary,
});

const blankTextArbitrary = fc.constantFrom('', ' ', '\t', '\n', ' \t\n ');
const invalidFieldArbitrary = fc.oneof(
  fc.integer(),
  fc.boolean(),
  fc.constant(null),
  fc.array(fc.integer(), { maxLength: 3 }),
);
const invalidSourceArbitrary = fc.constantFrom(
  'http://example.com/metric',
  'mailto:owner@example.com',
  'tel:+8613800138000',
  'ftp://example.com/metric',
  '/relative/metric',
  'javascript:alert(1)',
  'https://',
  ' https://example.com/metric',
  'https://example.com/metric ',
);

const metricCasesArbitrary = fc
  .tuple(
    fc.array(fc.tuple(validMetricArbitrary, fc.integer()), {
      minLength: 1,
      maxLength: 12,
    }),
    validMetricArbitrary,
    blankTextArbitrary,
    invalidFieldArbitrary,
    invalidSourceArbitrary,
    fc.array(fc.integer(), { minLength: 12, maxLength: 12 }),
  )
  .map(
    ([validMetrics, base, blank, invalidField, invalidSource, invalidOrders]) => {
      const validCases: OrderedMetricCase[] = validMetrics.map(
        ([candidate, order], sequence) => ({
          candidate,
          retained: candidate,
          order,
          sequence,
        }),
      );
      const firstInvalidSequence = validCases.length;
      const invalidCandidates: readonly unknown[] = [
        { ...base, value: blank },
        { ...base, value: invalidField },
        { meaning: base.meaning, source: base.source },
        { ...base, meaning: blank },
        { ...base, meaning: invalidField },
        { value: base.value, source: base.source },
        { ...base, source: blank },
        { ...base, source: invalidField },
        { ...base, source: invalidSource },
        { value: base.value, meaning: base.meaning },
        { value: blank, meaning: blank, source: blank },
        null,
      ];
      const invalidCases: OrderedMetricCase[] = invalidCandidates.map(
        (candidate, index) => ({
          candidate,
          retained: null,
          order: invalidOrders[index]!,
          sequence: firstInvalidSequence + index,
        }),
      );

      return [...validCases, ...invalidCases].sort(
        (left, right) =>
          left.order - right.order || left.sequence - right.sequence,
      );
    },
  );

describe('metric completeness projection properties', () => {
  /**
   * **Validates: Requirements 2.5, 2.6**
   */
  it('Feature: maple-garden, Property 3: 指标完整性过滤', () => {
    fc.assert(
      fc.property(metricCasesArbitrary, (cases) => {
        const candidates = cases.map(({ candidate }) => candidate);
        const expected = cases.flatMap(({ retained }) =>
          retained === null ? [] : [retained],
        );

        const actual = filterCompleteMetrics(candidates);

        expect(actual).toEqual(expected);
        expect(actual).toHaveLength(expected.length);
        actual.forEach((metric, index) => {
          const expectedMetric = expected[index]!;
          expect(metric.value).toBe(expectedMetric.value);
          expect(metric.meaning).toBe(expectedMetric.meaning);
          expect(metric.source).toBe(expectedMetric.source);
          expect(new URL(metric.source).protocol).toBe('https:');
        });
      }),
      { numRuns: 100 },
    );
  });
});

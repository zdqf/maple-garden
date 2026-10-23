import { z } from 'zod';

declare const absoluteAllowedUrlBrand: unique symbol;
declare const httpsUrlBrand: unique symbol;

export type AbsoluteAllowedUrl = string & {
  readonly [absoluteAllowedUrlBrand]: true;
};

export type HttpsUrl = AbsoluteAllowedUrl & {
  readonly [httpsUrlBrand]: true;
};

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'mailto:', 'tel:']);

function hasProtocol(value: string, protocols: ReadonlySet<string>): boolean {
  if (value.length === 0 || value !== value.trim()) {
    return false;
  }

  try {
    return protocols.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function isAllowedExternalUrl(
  value: string,
): value is AbsoluteAllowedUrl {
  return hasProtocol(value, ALLOWED_EXTERNAL_PROTOCOLS);
}

export function isHttpsUrl(value: string): value is HttpsUrl {
  return hasProtocol(value, new Set(['https:']));
}

export const AbsoluteAllowedUrlSchema = z.string().refine(isAllowedExternalUrl, {
  message: 'Expected an absolute https, mailto, or tel URL.',
});

export const HttpsUrlSchema = z.string().refine(isHttpsUrl, {
  message: 'Expected an absolute https URL.',
});

export function parseAllowedExternalUrl(value: string): AbsoluteAllowedUrl {
  return AbsoluteAllowedUrlSchema.parse(value);
}

export function parseHttpsUrl(value: string): HttpsUrl {
  return HttpsUrlSchema.parse(value);
}

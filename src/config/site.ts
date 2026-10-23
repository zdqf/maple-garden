import { personalConfig } from './personal';

/**
 * Read-only projections for site consumers. The values remain owned by and
 * reference the corresponding Personal_Config records rather than duplicating them.
 */
export const siteConfig = personalConfig.site;
export const localizedSiteText = personalConfig.localizedText;

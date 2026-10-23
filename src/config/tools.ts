import { ToolRegistrySchema } from './schemas';
import { localizedSiteText } from './site';

function requiredSiteText(key: string): string {
  const value = localizedSiteText[key];
  if (value === undefined) {
    throw new Error(`Missing Personal_Config localized text: ${key}`);
  }

  return value;
}

function loadToolModule() {
  return import('../tools/toolModules');
}

/**
 * The complete Local_Tool registry. Metadata stays eager and lightweight while
 * the future tool implementation chunk is loaded only when requested.
 */
export const toolRegistry = ToolRegistrySchema.parse([
  {
    id: 'json',
    name: requiredSiteText('tool.json.name'),
    capability: requiredSiteText('tool.json.capability'),
    route: '#/tools/json',
    keywords: ['JSON', 'format', 'minify', 'validate'],
    load: loadToolModule,
  },
  {
    id: 'base64',
    name: requiredSiteText('tool.base64.name'),
    capability: requiredSiteText('tool.base64.capability'),
    route: '#/tools/base64',
    keywords: ['Base64', 'Unicode', 'encode', 'decode'],
    load: loadToolModule,
  },
  {
    id: 'url',
    name: requiredSiteText('tool.url.name'),
    capability: requiredSiteText('tool.url.capability'),
    route: '#/tools/url',
    keywords: ['URL', 'percent encoding', 'encodeURIComponent'],
    load: loadToolModule,
  },
  {
    id: 'timestamp',
    name: requiredSiteText('tool.timestamp.name'),
    capability: requiredSiteText('tool.timestamp.capability'),
    route: '#/tools/timestamp',
    keywords: ['Timestamp', 'Unix', 'ISO 8601', 'local time'],
    load: loadToolModule,
  },
  {
    id: 'uuid',
    name: requiredSiteText('tool.uuid.name'),
    capability: requiredSiteText('tool.uuid.capability'),
    route: '#/tools/uuid',
    keywords: ['UUID', 'UUID v4', 'identifier'],
    load: loadToolModule,
  },
  {
    id: 'text-statistics',
    name: requiredSiteText('tool.text-statistics.name'),
    capability: requiredSiteText('tool.text-statistics.capability'),
    route: '#/tools/text-statistics',
    keywords: [
      'Text Statistics',
      'Word Counter',
      'characters',
      'words',
      'lines',
      'UTF-8 bytes',
    ],
    load: loadToolModule,
  },
  {
    id: 'regex',
    name: requiredSiteText('tool.regex.name'),
    capability: requiredSiteText('tool.regex.capability'),
    route: '#/tools/regex',
    keywords: ['Regex', 'regular expression', 'match', 'index'],
    load: loadToolModule,
  },
  {
    id: 'hash',
    name: requiredSiteText('tool.hash.name'),
    capability: requiredSiteText('tool.hash.capability'),
    route: '#/tools/hash',
    keywords: ['Hash', 'SHA-256', 'digest', 'Web Crypto'],
    load: loadToolModule,
  },
  {
    id: 'diff',
    name: requiredSiteText('tool.diff.name'),
    capability: requiredSiteText('tool.diff.capability'),
    route: '#/tools/diff',
    keywords: ['Diff', 'Text Diff', 'line comparison'],
    load: loadToolModule,
  },
  {
    id: 'prompt-composer',
    name: requiredSiteText('tool.prompt-composer.name'),
    capability: requiredSiteText('tool.prompt-composer.capability'),
    route: '#/tools/prompt-composer',
    keywords: [
      'Prompt Composer',
      'Markdown Preview',
      'safe local preview',
      'role',
      'context',
      'task',
      'constraints',
      'output format',
    ],
    load: loadToolModule,
  },
]);

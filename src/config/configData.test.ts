import { describe, expect, it } from 'vitest';

import { containsPlaceholder } from '../domain/shared/placeholder';
import { personalConfig } from './personal';
import { projectCatalog } from './projects';
import {
  PersonalConfigSchema,
  ProjectCatalogSchema,
  TOOL_IDS,
  ToolRegistrySchema,
} from './schemas';
import { localizedSiteText, siteConfig } from './site';
import { toolRegistry } from './tools';

describe('central configuration data', () => {
  it('keeps personal facts, site copy, and SEO values in Personal_Config', () => {
    expect(PersonalConfigSchema.safeParse(personalConfig).success).toBe(true);
    expect(siteConfig).toBe(personalConfig.site);
    expect(localizedSiteText).toBe(personalConfig.localizedText);

    expect(personalConfig.identity).toEqual({
      name: '木有风',
      headline: '一枚枫叶也是一座花园',
    });
    expect(personalConfig.biography).toEqual([
      '木有风，2003 年生于湖北赤壁。',
      '曾获武汉大学樱花诗歌奖、第五届浙江大学“求是杯”诗歌创作奖、野草文学奖等。',
    ]);
    expect(personalConfig.skills).toEqual(['钢笔', '写字', '写诗', '篮球']);
    expect(personalConfig.principles).toEqual([]);
    expect(personalConfig.experience).toEqual([]);
    expect(personalConfig.contacts).toEqual([
      {
        label: '邮箱',
        href: 'mailto:fengye78236402@gmail.com',
        accessibleLabel: '发送邮件至 fengye78236402@gmail.com',
      },
    ]);
    expect(personalConfig.socials).toEqual([]);
    expect(personalConfig.metrics).toEqual([]);
    expect(personalConfig).not.toHaveProperty('resumeUrl');
    expect(containsPlaceholder(personalConfig)).toBe(false);
  });

  it('provides one schema-valid project catalog outside presentation code', () => {
    expect(ProjectCatalogSchema.safeParse(projectCatalog).success).toBe(true);
    expect(projectCatalog.map(({ id }) => id)).toEqual(['maple-garden']);

    const project = projectCatalog[0];
    expect(project).toMatchObject({
      id: 'maple-garden',
      status: 'in-progress',
      featured: true,
      sourceUrl: 'https://github.com/zdqf/maple-garden',
    });
    expect(project).not.toHaveProperty('demoUrl');
    expect(project).not.toHaveProperty('metrics');
  });

  it('defines exactly the required ten deterministic Local_Tool entries', () => {
    expect(ToolRegistrySchema.safeParse(toolRegistry).success).toBe(true);
    expect(toolRegistry).toHaveLength(10);
    expect(toolRegistry.map(({ id }) => id)).toEqual(TOOL_IDS);
    expect(toolRegistry.map(({ name }) => name)).toEqual([
      'JSON',
      'Base64',
      'URL',
      'Timestamp',
      'UUID',
      'Text Statistics',
      'Regex',
      'Hash',
      'Diff',
      'Prompt Composer',
    ]);

    for (const tool of toolRegistry) {
      expect(tool.route).toBe(`#/tools/${tool.id}`);
      expect(tool.capability.length).toBeGreaterThan(0);
      expect(tool.keywords.length).toBeGreaterThan(0);
    }
  });

  it('tracks Word Counter and safe same-page Markdown Preview without an eleventh id', () => {
    const textStatistics = toolRegistry.find(
      ({ id }) => id === 'text-statistics',
    );
    expect(textStatistics?.keywords).toContain('Word Counter');
    expect(textStatistics?.capability).toContain('Word_Unit');
    expect(textStatistics?.capability).toContain('UTF-8');

    const promptComposer = toolRegistry.find(
      ({ id }) => id === 'prompt-composer',
    );
    expect(promptComposer?.keywords).toContain('Markdown Preview');
    expect(promptComposer?.capability).toContain('同一工具页');
    expect(promptComposer?.capability).toContain('raw HTML 显示为文本');
    expect(promptComposer?.capability).toContain('不自动加载远程资源');
    expect(promptComposer?.capability).toContain('不调用远程 AI');
    const registryIds: readonly string[] = toolRegistry.map(({ id }) => id);
    expect(registryIds).not.toContain('markdown-preview');
  });

  it('keeps every configured implementation behind a lazy module loader', async () => {
    const modules = await Promise.all(toolRegistry.map(({ load }) => load()));

    expect(modules).toHaveLength(10);
    for (const module of modules) {
      expect(module.default).toMatchObject({ status: 'ready', runtime: 'browser-only' });
    }
  });
});

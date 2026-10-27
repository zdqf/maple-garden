import { PersonalConfigSchema } from './schemas';

/**
 * The sole source for personal facts, profile copy, and site-level SEO text.
 * Replace every TODO_REPLACE value before presenting the affected data as fact.
 */
export const personalConfig = PersonalConfigSchema.parse({
  identity: {
    name: '木有风',
    headline: '一枚枫叶也是一座花园',
  },
  biography: [
    '木有风，2003 年生于湖北赤壁。',
    '曾获武汉大学樱花诗歌奖、第五届浙江大学“求是杯”诗歌创作奖、野草文学奖等。',
  ],
  skills: ['钢笔', '写字', '写诗', '篮球'],
  experience: [],
  principles: [],
  contacts: [
    {
      label: '邮箱',
      href: 'mailto:fengye78236402@gmail.com',
      accessibleLabel: '发送邮件至 fengye78236402@gmail.com',
    },
  ],
  socials: [],
  site: {
    title: 'Maple-Garden',
    description:
      'Maple-Garden：一个记录开发、诗歌散文、交易心得、写点什么与篮球的浏览器本地数字花园。',
    language: 'zh-CN',
    previewImagePath: 'images/social-preview.png',
  },
  localizedText: {
    'navigation.home': '首页',
    'navigation.projects': '项目',
    'navigation.journal': '日志',
    'navigation.tools': '工具',
    'navigation.about': '关于',
    'home.sitePurpose': '个人开发者数字花园与浏览器本地工具门户。',
    'about.biography': '简介',
    'about.skills': '技能',
    'about.experience': '经历',
    'about.principles': '工作原则',
    'about.contacts': '联系方式',
    'placeholder.label': '待替换',
    'tool.json.name': 'JSON',
    'tool.json.capability':
      '在浏览器本地验证 JSON，并生成两空格格式化或压缩表示。',
    'tool.base64.name': 'Base64',
    'tool.base64.capability':
      '在浏览器本地对 Unicode 文本进行 Base64 编码与严格解码。',
    'tool.url.name': 'URL',
    'tool.url.capability':
      '在浏览器本地编码或解码 URL 组件，并保留 Unicode 内容。',
    'tool.timestamp.name': 'Timestamp',
    'tool.timestamp.capability':
      '在浏览器本地转换 Unix 秒、Unix 毫秒、ISO 8601 与本地时间。',
    'tool.uuid.name': 'UUID',
    'tool.uuid.capability':
      '使用浏览器加密能力在本地生成一至一百个 UUID v4。',
    'tool.text-statistics.name': 'Text Statistics',
    'tool.text-statistics.capability':
      '在浏览器本地统计 Unicode 字符、非空白字符、Word_Unit 字数、行数和 UTF-8 字节数，承接 Word Counter 语义。',
    'tool.regex.name': 'Regex',
    'tool.regex.capability':
      '在浏览器本地执行正则匹配，并按顺序报告匹配值与零基索引。',
    'tool.hash.name': 'Hash',
    'tool.hash.capability':
      '使用浏览器 Web Crypto 在本地生成文本的 SHA-256 小写十六进制摘要。',
    'tool.diff.name': 'Diff',
    'tool.diff.capability':
      '在浏览器本地按行比较两段文本，并标记新增、删除与未变化内容。',
    'tool.prompt-composer.name': 'Prompt Composer',
    'tool.prompt-composer.capability':
      '在浏览器本地按固定顺序组合提示字段；同一工具页包含安全 Markdown Preview 模式，raw HTML 显示为文本且不自动加载远程资源，不调用远程 AI。',
    'prompt.section.role': '角色',
    'prompt.section.context': '上下文',
    'prompt.section.task': '任务',
    'prompt.section.constraints': '约束',
    'prompt.section.outputFormat': '输出格式',
    'prompt.markdownPreview.modeLabel': 'Markdown Preview',
    'prompt.markdownPreview.safety':
      '浏览器本地安全预览：raw HTML 显示为文本，外部资源不自动加载。',
  },
  metrics: [],
});

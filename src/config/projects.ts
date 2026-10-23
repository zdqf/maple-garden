import { ProjectCatalogSchema } from './schemas';

/** Central project data, deliberately independent from presentation components. */
export const projectCatalog = ProjectCatalogSchema.parse([
  {
    id: 'maple-garden',
    name: 'Maple-Garden',
    summary:
      'Maple-Garden 是一个由 Markdown、项目配置和浏览器本地工具组成的个人数字花园。',
    category: 'Web application',
    status: 'in-progress',
    technologies: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    tags: ['static site', 'developer tools', 'digital garden'],
    featured: true,
    sourceUrl: 'https://github.com/zdqf/maple-garden',
  },
]);

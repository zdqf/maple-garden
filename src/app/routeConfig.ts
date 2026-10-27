import { localizedSiteText } from '../config/site';

export const routePaths = Object.freeze({
  home: '/',
  projects: '/projects',
  journal: '/journal',
  journalTag: '/journal/tag/:tag',
  journalCategory: '/journal/category/:category',
  journalCollection: '/journal/collection/:collection',
  article: '/journal/post/:slug',
  tools: '/tools',
  localTool: '/tools/:toolId',
  about: '/about',
} as const);

export type PrimaryNavigationItem = Readonly<{
  label: string;
  to: string;
  end?: boolean;
}>;

function getNavigationLabel(key: string): string {
  const label = localizedSiteText[key];
  if (label === undefined) {
    throw new Error(`Missing Personal_Config localized text: ${key}`);
  }

  return label;
}

export const primaryNavigation: readonly PrimaryNavigationItem[] =
  Object.freeze([
    {
      label: getNavigationLabel('navigation.home'),
      to: routePaths.home,
      end: true,
    },
    {
      label: getNavigationLabel('navigation.projects'),
      to: routePaths.projects,
    },
    {
      label: getNavigationLabel('navigation.journal'),
      to: routePaths.journal,
    },
    {
      label: getNavigationLabel('navigation.tools'),
      to: routePaths.tools,
    },
    {
      label: getNavigationLabel('navigation.about'),
      to: routePaths.about,
    },
  ]);

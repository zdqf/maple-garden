import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import CollectionPage from '../pages/CollectionPage';
import AboutPage from '../pages/AboutPage';
import HomePage from '../pages/HomePage';
import JournalPage from '../pages/JournalPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProjectsPage from '../pages/ProjectsPage';
import ToolPortalPage from '../pages/ToolPortalPage';

import { SiteShell } from '../components/shell/SiteShell';
import { routePaths } from './routeConfig';

// Keep Markdown rendering, syntax highlighting and tool editors off the home-page bundle.
const ArticlePage = lazy(() => import('../pages/ArticlePage'));
const LocalToolPage = lazy(() => import('../pages/LocalToolPage'));

export function AppRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route index element={<HomePage />} />
        <Route path={routePaths.projects} element={<ProjectsPage />} />
        <Route path={routePaths.journal} element={<JournalPage />} />
        <Route path={routePaths.journalTag} element={<JournalPage />} />
        <Route
          path={routePaths.journalCategory}
          element={<JournalPage />}
        />
        <Route
          path={routePaths.journalCollection}
          element={<CollectionPage />}
        />
        <Route path={routePaths.article} element={<ArticlePage />} />
        <Route path={routePaths.tools} element={<ToolPortalPage />} />
        <Route path={routePaths.localTool} element={<LocalToolPage />} />
        <Route path={routePaths.about} element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;

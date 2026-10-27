import { Route, Routes } from 'react-router-dom';

import ArticlePage from '../pages/ArticlePage';
import CollectionPage from '../pages/CollectionPage';
import AboutPage from '../pages/AboutPage';
import HomePage from '../pages/HomePage';
import JournalPage from '../pages/JournalPage';
import LocalToolPage from '../pages/LocalToolPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProjectsPage from '../pages/ProjectsPage';
import ToolPortalPage from '../pages/ToolPortalPage';

import { SiteShell } from '../components/shell/SiteShell';
import { routePaths } from './routeConfig';

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

import { HashRouter } from 'react-router-dom';

import { AppRoutes } from './app/AppRoutes';

export function App(): React.JSX.Element {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}

export default App;

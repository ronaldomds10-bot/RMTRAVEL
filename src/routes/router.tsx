import { createBrowserRouter, Navigate } from 'react-router-dom';
import { App } from '../App';
import { PlatformLayout } from '../layouts/PlatformLayout';
import { platformPages } from '../data/pages';
import { PlatformPage } from '../pages/PlatformPage';
import { TicketPublicPage } from '../pages/TicketPublicPage';

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      {
        path: '/',
        element: <Navigate to="/platform" replace />
      },
      {
        path: '/platform',
        element: <PlatformLayout />,
        children: [
          {
            index: true,
            element: <PlatformPage />
          },
          ...platformPages
            .filter((page) => page.path !== '/platform')
            .map((page) => ({
              path: page.path.replace('/platform/', ''),
              element: <PlatformPage />
          }))
        ]
      },
      {
        path: '/ticket/:id',
        element: <TicketPublicPage />
      },
      {
        path: '*',
        element: <Navigate to="/platform" replace />
      }
    ]
  }
]);

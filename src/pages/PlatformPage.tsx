import { Navigate, useLocation } from 'react-router-dom';
import { PagePlaceholder } from '../components/PagePlaceholder';
import { platformPages } from '../data/pages';
import { CustomersPage } from './CustomersPage';
import { DashboardPage } from './DashboardPage';
import { SalesPage } from './SalesPage';
import { TicketImportPage } from './TicketImportPage';
import { TicketsPage } from './TicketsPage';

export function PlatformPage() {
  const location = useLocation();
  const page = platformPages.find((item) => item.path === location.pathname);

  if (!page) {
    return <Navigate to="/platform" replace />;
  }

  if (page.path === '/platform') {
    return <DashboardPage />;
  }

  if (page.path === '/platform/customers') {
    return <CustomersPage />;
  }

  if (page.path === '/platform/tickets') {
    return <TicketsPage />;
  }

  if (page.path === '/platform/tickets/import') {
    return <TicketImportPage />;
  }

  if (page.path === '/platform/emissions/sales') {
    return <SalesPage />;
  }

  return <PagePlaceholder page={page} />;
}

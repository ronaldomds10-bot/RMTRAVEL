import { Navigate, useLocation } from 'react-router-dom';
import { PagePlaceholder } from '../components/PagePlaceholder';
import { platformPages } from '../data/pages';
import { AnalyticsPage } from './AnalyticsPage';
import { CustomersPage } from './CustomersPage';
import { DashboardPage } from './DashboardPage';
import { MilesPage } from './MilesPage';
import { SalesPage } from './SalesPage';
import {
  CompanySettingsPage,
  ProfileSettingsPage,
  SettingsHomePage,
  SubscriptionSettingsPage,
  SupportSettingsPage
} from './SettingsPages';
import { SitePage } from './SitePage';
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

  if (page.path === '/platform/site') {
    return <SitePage />;
  }

  if (page.path === '/platform/analytics') {
    return <AnalyticsPage />;
  }

  if (page.path === '/platform/miles') {
    return <MilesPage />;
  }

  if (page.path === '/platform/settings') {
    return <SettingsHomePage />;
  }

  if (page.path === '/platform/settings/profile') {
    return <ProfileSettingsPage />;
  }

  if (page.path === '/platform/settings/company') {
    return <CompanySettingsPage />;
  }

  if (page.path === '/platform/settings/subscription') {
    return <SubscriptionSettingsPage />;
  }

  if (page.path === '/platform/settings/support') {
    return <SupportSettingsPage />;
  }

  if (page.path === '/platform/settings/my-company') {
    return <Navigate to="/platform/settings/company" replace />;
  }

  if (page.path === '/platform/settings/my-subscription') {
    return <Navigate to="/platform/settings/subscription" replace />;
  }

  if (page.path === '/platform/voajet-resolve') {
    return <Navigate to="/platform/settings/support" replace />;
  }

  return <PagePlaceholder page={page} />;
}

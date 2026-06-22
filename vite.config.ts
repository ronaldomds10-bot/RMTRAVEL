import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import importTicketHandler from './api/tickets/import';
import searchTicketHandler from './api/tickets/search';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rmtravel-ticket-search-api',
      configureServer(server) {
        server.middlewares.use('/api/tickets/search', async (request, response) => {
          await searchTicketHandler(request, response);
        });

        server.middlewares.use('/api/tickets/import', async (request, response) => {
          await importTicketHandler(request, response);
        });
      }
    }
  ],
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import importTicketHandler from './api/tickets/import';
import { handleTicketSearch } from './src/services/tickets/searchTickets';

async function readJsonBody(request: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'rmtravel-ticket-search-api',
      configureServer(server) {
        server.middlewares.use('/api/tickets/search', async (request, response) => {
          response.setHeader('Content-Type', 'application/json; charset=utf-8');

          if (request.method !== 'POST') {
            response.statusCode = 405;
            response.end(JSON.stringify({ data: null, error: 'Metodo nao permitido.' }));
            return;
          }

          try {
            const payload = await readJsonBody(request);
            const result = await handleTicketSearch(payload);
            response.statusCode = result.status;
            response.end(JSON.stringify(result.body));
          } catch {
            response.statusCode = 400;
            response.end(JSON.stringify({ data: null, error: 'Payload JSON invalido.' }));
          }
        });

        server.middlewares.use('/api/tickets/import', async (request, response) => {
          await importTicketHandler(request, response);
        });
      }
    }
  ],
});

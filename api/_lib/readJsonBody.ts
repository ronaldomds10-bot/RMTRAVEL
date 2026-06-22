import type { IncomingMessage } from 'node:http';

const maxBodyBytes = 16 * 1024;

type RequestWithBody = IncomingMessage & {
  body?: unknown;
};

export async function readJsonBody(request: RequestWithBody) {
  if (request.body !== undefined) {
    const serializedBody = JSON.stringify(request.body);

    if (Buffer.byteLength(serializedBody, 'utf8') > maxBodyBytes) {
      throw new Error('body_too_large');
    }

    return request.body;
  }

  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;

    if (size > maxBodyBytes) {
      throw new Error('body_too_large');
    }

    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

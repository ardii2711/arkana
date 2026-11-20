import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';

import { app } from '../../src/app';

let server: Server | null = null;
let baseUrl: string | null = null;

/** Menjalankan satu instance server in-process dan mengembalikan base URL-nya. */
export async function startServer(): Promise<string> {
  if (baseUrl) {
    return baseUrl;
  }

  server = app.listen(0);
  await once(server, 'listening');

  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;

  return baseUrl;
}

export async function stopServer(): Promise<void> {
  if (!server) {
    return;
  }

  server.close();
  await once(server, 'close');
  server = null;
  baseUrl = null;
}

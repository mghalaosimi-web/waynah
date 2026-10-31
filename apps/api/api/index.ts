import { app } from '../src/server.js';

// Vercel's Node.js runtime invokes the exported Hono app with a Web Request.
// The legacy hono/vercel adapter forwards the Node request object directly,
// which is incompatible with Hono's Request.headers API in this runtime.
export default app;

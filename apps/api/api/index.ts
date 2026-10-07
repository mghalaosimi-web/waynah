import { handle } from 'hono/vercel';
import { app } from '../src/server.js';

export default handle(app);

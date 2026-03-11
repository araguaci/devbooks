/**
 * Netlify Function — API Express
 * Recebe /api/* via redirect em netlify.toml
 * .mjs = ESM para node_bundler "none"
 */
import serverless from 'serverless-http';
import app from '../../server/index.js';

export const handler = serverless(app);

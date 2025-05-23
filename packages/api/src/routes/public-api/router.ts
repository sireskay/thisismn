import { Hono } from 'hono';
import { publicApiApp } from '.';

export const publicApiRouter = new Hono().route('/v1', publicApiApp);
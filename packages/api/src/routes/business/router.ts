import { Hono } from 'hono';
import { businessApp } from '.';

export const businessRouter = new Hono().route('/business', businessApp);
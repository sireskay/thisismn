import { Hono } from 'hono';
import { categoryApp } from '.';

export const categoryRouter = new Hono().route('/categories', categoryApp);
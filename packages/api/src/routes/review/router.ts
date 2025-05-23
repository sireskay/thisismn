import { Hono } from 'hono';
import { reviewApp } from '.';

export const reviewRouter = new Hono().route('/reviews', reviewApp);
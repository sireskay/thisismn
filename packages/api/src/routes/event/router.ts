import { Hono } from 'hono';
import { eventApp } from '.';

export const eventRouter = new Hono().route('/events', eventApp);
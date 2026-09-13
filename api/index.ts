import * as crypto from 'crypto';
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { INestApplication } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup';

const server = express();
let cachedApp: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (!cachedApp) {
    const adapter = new ExpressAdapter(server);
    const app = await NestFactory.create(AppModule, adapter);
    setupApp(app);
    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

export default async (req: any, res: any) => {
  await bootstrap();
  server(req, res);
};

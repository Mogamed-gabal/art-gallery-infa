import * as crypto from 'crypto';
if (!globalThis.crypto) {
  globalThis.crypto = crypto as any;
}
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup';
import { INestApplication } from '@nestjs/common';

let cachedApp: INestApplication;

async function bootstrap(): Promise<INestApplication> {
  if (!cachedApp) {
    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    const app = await NestFactory.create(AppModule);
    setupApp(app);
    await app.init();
    cachedApp = app;
  }
  return cachedApp;
}

// Vercel serverless handler
export default async (req: any, res: any) => {
  const app = await bootstrap();
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();
  instance(req, res);
};

// Local development - run normally
if (process.env.NODE_ENV !== 'production') {
  void (async () => {
    if (process.env.NODE_ENV !== 'production') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    const app = await NestFactory.create(AppModule);
    const port = setupApp(app);
    await app.listen(port);
  })();
}

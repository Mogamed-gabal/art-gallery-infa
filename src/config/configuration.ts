export interface AppConfiguration {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly port: number;
  readonly corsOrigin: string;
  readonly frontendUrl: string;
}
export interface DatabaseConfiguration {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly synchronize: boolean;
  readonly logging: boolean;
  readonly ssl: boolean;
}
export interface JwtConfiguration {
  readonly secret: string;
  readonly expiresIn: string;
}
export interface AdminConfiguration {
  readonly email: string;
  readonly password: string;
}
export interface CloudinaryConfiguration {
  readonly cloudName: string;
  readonly apiKey: string;
  readonly apiSecret: string;
}
export interface PaymobConfiguration {
  readonly apiKey: string;
  readonly integrationId: string;
  readonly iframeId: string;
  readonly hmacSecret: string;
}
export interface PayPalConfiguration {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly sandbox: boolean;
  readonly webhookId: string;
}
export interface MailConfiguration {
  readonly gmailUser: string;
  readonly gmailAppPassword: string;
}
export interface Configuration {
  readonly app: AppConfiguration;
  readonly database: DatabaseConfiguration;
  readonly jwt: JwtConfiguration;
  readonly admin: AdminConfiguration;
  readonly cloudinary: CloudinaryConfiguration;
  readonly paymob: PaymobConfiguration;
  readonly paypal: PayPalConfiguration;
  readonly mail: MailConfiguration;
}
function parseNumber(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}
function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  return value === undefined ? fallback : value.toLowerCase() === 'true';
}
const configuration = (): Configuration => ({
  app: {
    nodeEnv:
      process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production'
        ? process.env.NODE_ENV
        : 'development',
    port: parseNumber(process.env.PORT, 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:4300',
  },
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseNumber(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME ?? 'art_gallery',
    password: process.env.DB_PASSWORD ?? 'art_gallery_password',
    database: process.env.DB_DATABASE ?? 'art_gallery_db',
    synchronize: parseBoolean(process.env.DB_SYNCHRONIZE, true),
    logging: parseBoolean(process.env.DB_LOGGING, true),
    ssl: parseBoolean(process.env.DB_SSL, true),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? '',
    password: process.env.ADMIN_PASSWORD ?? '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },
  paymob: {
    apiKey: process.env.PAYMOB_API_KEY ?? '',
    integrationId: process.env.PAYMOB_INTEGRATION_ID ?? '',
    iframeId: process.env.PAYMOB_IFRAME_ID ?? '',
    hmacSecret: process.env.PAYMOB_HMAC_SECRET ?? '',
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID ?? '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET ?? '',
    sandbox: parseBoolean(process.env.PAYPAL_SANDBOX, true),
    webhookId: process.env.PAYPAL_WEBHOOK_ID ?? '',
  },
  mail: {
    gmailUser: process.env.GMAIL_USER ?? '',
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? '',
  },
});
export default configuration;


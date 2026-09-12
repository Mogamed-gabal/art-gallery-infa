import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import 'pg';
import configuration, { type Configuration } from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { ContentModule } from './modules/content/content.module';
import { ArtworksModule } from './modules/artworks/artworks.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ClientRequestsModule } from './modules/client-requests/client-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<Configuration>,
      ): TypeOrmModuleOptions => {
        const isSslEnabled =
          process.env.NODE_ENV === 'production' ||
          String(configService.get('database.ssl', { infer: true })) === 'true';

        return {
          type: 'postgres',
          host: configService.getOrThrow('database.host', { infer: true }),
          port: configService.getOrThrow('database.port', { infer: true }),
          username: configService.getOrThrow('database.username', {
            infer: true,
          }),
          password: configService.getOrThrow('database.password', {
            infer: true,
          }),
          database: configService.getOrThrow('database.database', {
            infer: true,
          }),
          namingStrategy: new SnakeNamingStrategy(),
          autoLoadEntities: true,
          synchronize: configService.getOrThrow('database.synchronize', {
            infer: true,
          }),
          logging: configService.getOrThrow('database.logging', { infer: true }),
          ssl: isSslEnabled ? { rejectUnauthorized: false } : false,
          extra: isSslEnabled
            ? {
              ssl: {
                rejectUnauthorized: false,
              },
            }
            : {},
        };
      },
    }),
    AuthModule,
    ContentModule,
    ArtworksModule,
    OrdersModule,
    CoursesModule,
    ClientRequestsModule,
  ],
})
export class AppModule { }
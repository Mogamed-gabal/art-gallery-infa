import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { type Configuration } from '../../config/configuration';
import { MailModule } from '../../shared/mail/mail.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { CustomerAuthGuard } from './guards/customer-auth.guard';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    PassportModule.register({ session: false }),
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Configuration>) => ({
        secret: configService.getOrThrow('jwt.secret', { infer: true }),
        signOptions: {
          expiresIn: configService.getOrThrow('jwt.expiresIn', { infer: true }),
        },
      }),
    }),
  ],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerJwtStrategy, CustomerAuthGuard],
  exports: [CustomersService, CustomerAuthGuard, TypeOrmModule],
})
export class CustomersModule {}

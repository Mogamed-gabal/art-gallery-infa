import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type Configuration } from '../../../config/configuration';

export interface CustomerJwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: 'customer';
}

/** Dedicated Passport strategy for course-platform customers */
@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
  constructor(configService: ConfigService<Configuration>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('jwt.secret', { infer: true }),
    });
  }

  validate(payload: CustomerJwtPayload): CustomerJwtPayload {
    return payload;
  }
}

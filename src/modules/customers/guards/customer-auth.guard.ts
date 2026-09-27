import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guard for course-platform customer routes */
@Injectable()
export class CustomerAuthGuard extends AuthGuard('customer-jwt') {}

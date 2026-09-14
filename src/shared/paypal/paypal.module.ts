import { Module } from '@nestjs/common';
import { PayPalService } from './paypal.service';
import { CurrencyService } from './currency.service';

@Module({
  providers: [PayPalService, CurrencyService],
  exports: [PayPalService, CurrencyService],
})
export class PayPalModule {}

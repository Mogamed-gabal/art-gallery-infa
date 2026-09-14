import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Configuration } from '../../config/configuration';

export interface PayPalOrderResult {
  paypalOrderId: string;
  approvalUrl: string;
  amountInCurrency: string;
  currency: 'USD' | 'EUR';
}

export interface PayPalCaptureResult {
  captureId: string;
  status: string;
}

export type PaymentCurrency = 'USD' | 'EUR';

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService<Configuration>) {
    const isSandbox = this.config.get('paypal.sandbox', { infer: true }) !== false;
    this.baseUrl = isSandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.get('paypal.clientId', { infer: true }) &&
        this.config.get('paypal.clientSecret', { infer: true }),
    );
  }

  private async getAccessToken(): Promise<string> {
    const clientId = this.config.getOrThrow('paypal.clientId', { infer: true });
    const clientSecret = this.config.getOrThrow('paypal.clientSecret', { infer: true });
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(`PayPal token error ${response.status}: ${text}`);
      throw new BadGatewayException('Failed to authenticate with PayPal');
    }
    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  async createOrder(
    orderNumber: string,
    amountInCurrency: number,
    currency: PaymentCurrency,
    returnUrl: string,
    cancelUrl: string,
  ): Promise<PayPalOrderResult> {
    if (!this.isConfigured())
      throw new BadGatewayException('PayPal is not configured');

    const token = await this.getAccessToken();
    const amountStr = this.formatAmount(amountInCurrency);

    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderNumber,
          amount: {
            currency_code: currency,
            value: amountStr,
          },
          description: `Art Gallery Order ${orderNumber}`,
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'Anas Yaqoub Art Gallery',
            locale: 'en-US',
            landing_page: 'LOGIN',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    };

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${orderNumber}-${Date.now()}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(`PayPal createOrder error ${response.status}: ${text}`);
      throw new BadGatewayException(`PayPal order creation failed (${response.status})`);
    }

    const data = (await response.json()) as {
      id: string;
      links: { href: string; rel: string }[];
    };

    const approvalLink = data.links.find((l) => l.rel === 'payer-action');
    if (!approvalLink)
      throw new BadGatewayException('No PayPal approval URL returned');

    return {
      paypalOrderId: data.id,
      approvalUrl: approvalLink.href,
      amountInCurrency: amountStr,
      currency,
    };
  }

  async captureOrder(paypalOrderId: string): Promise<PayPalCaptureResult> {
    if (!this.isConfigured())
      throw new BadGatewayException('PayPal is not configured');

    const token = await this.getAccessToken();
    const response = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.logger.error(`PayPal captureOrder error ${response.status}: ${text}`);
      throw new BadGatewayException(`PayPal capture failed (${response.status})`);
    }

    const data = (await response.json()) as {
      id: string;
      status: string;
      purchase_units: {
        payments: { captures: { id: string; status: string }[] };
      }[];
    };

    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    return {
      captureId: capture?.id ?? data.id,
      status: capture?.status ?? data.status,
    };
  }

  async verifyAndGetOrderStatus(
    paypalOrderId: string,
  ): Promise<{ status: string; captureId: string | null }> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${paypalOrderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return { status: 'UNKNOWN', captureId: null };
    const data = (await response.json()) as {
      status: string;
      purchase_units: {
        payments: { captures: { id: string; status: string }[] };
      }[];
    };
    const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;
    return { status: data.status, captureId };
  }
}

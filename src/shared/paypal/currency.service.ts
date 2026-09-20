import { Injectable, Logger } from '@nestjs/common';

export type SupportedCurrency = 'USD' | 'EUR';

interface RateCache {
  rates: Record<SupportedCurrency, number>;
  fetchedAt: number;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Fallback rates: how many units of target currency = 1 USD
const FALLBACK_RATES: Record<SupportedCurrency, number> = {
  USD: 1,       // 1 USD = 1 USD (pass-through)
  EUR: 0.92,    // ~1 USD = 0.92 EUR
};

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cache: RateCache | null = null;

  /**
   * Returns how many units of `targetCurrency` equal 1 USD.
   * Results are cached for 6 hours.
   */
  async getUsdRate(targetCurrency: SupportedCurrency): Promise<number> {
    if (targetCurrency === 'USD') return 1;
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_TTL_MS) {
      return this.cache.rates[targetCurrency];
    }
    await this.refreshRates();
    return this.cache!.rates[targetCurrency];
  }

  /**
   * Converts a USD amount to the target currency.
   * If target is USD, returns the amount unchanged.
   * Minimum PayPal amount is 0.01 in most currencies.
   */
  async convertFromUsd(
    amountUsd: number,
    targetCurrency: SupportedCurrency,
  ): Promise<number> {
    if (targetCurrency === 'USD') return Math.max(amountUsd, 0.01);
    const rate = await this.getUsdRate(targetCurrency);
    const converted = amountUsd * rate;
    return Math.max(converted, 0.01);
  }

  private async refreshRates(): Promise<void> {
    try {
      // Frankfurter API: free, no key required, returns current FX rates
      // Base = USD to get USD→target rates
      const url = 'https://api.frankfurter.app/latest?base=USD&symbols=EUR';
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as {
        rates: Record<string, number>;
      };
      const rates: Record<SupportedCurrency, number> = {
        USD: 1,
        EUR: data.rates['EUR'] ?? FALLBACK_RATES.EUR,
      };
      this.cache = { rates, fetchedAt: Date.now() };
      this.logger.log(
        `Exchange rates refreshed: 1 USD = ${rates.EUR} EUR`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to fetch exchange rates, using fallback: ${String(err)}`,
      );
      if (!this.cache) {
        this.cache = { rates: { ...FALLBACK_RATES }, fetchedAt: Date.now() };
      }
    }
  }
}

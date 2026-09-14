import { Injectable, Logger } from '@nestjs/common';

export type SupportedCurrency = 'USD' | 'EUR';

interface RateCache {
  rates: Record<SupportedCurrency, number>;
  fetchedAt: number;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Fallback rates used if the API is unreachable
const FALLBACK_RATES: Record<SupportedCurrency, number> = {
  USD: 0.021,  // ~1 EGP = 0.021 USD  (adjust if needed)
  EUR: 0.019,  // ~1 EGP = 0.019 EUR
};

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);
  private cache: RateCache | null = null;

  /**
   * Returns how many units of `targetCurrency` equal 1 EGP.
   * Results are cached for 6 hours.
   */
  async getEgpRate(targetCurrency: SupportedCurrency): Promise<number> {
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_TTL_MS) {
      return this.cache.rates[targetCurrency];
    }
    await this.refreshRates();
    return this.cache!.rates[targetCurrency];
  }

  /**
   * Converts an EGP amount to the target currency.
   * Minimum PayPal amount is 0.01 in most currencies.
   */
  async convertFromEgp(
    amountEgp: number,
    targetCurrency: SupportedCurrency,
  ): Promise<number> {
    const rate = await this.getEgpRate(targetCurrency);
    const converted = amountEgp * rate;
    // Ensure minimum PayPal amount
    return Math.max(converted, 0.01);
  }

  private async refreshRates(): Promise<void> {
    try {
      // Frankfurter API: free, no key required, returns current FX rates
      // We request EGP as base to get direct EGP→target rates
      const url = 'https://api.frankfurter.app/latest?base=EGP&symbols=USD,EUR';
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as {
        rates: Record<string, number>;
      };
      const rates: Record<SupportedCurrency, number> = {
        USD: data.rates['USD'] ?? FALLBACK_RATES.USD,
        EUR: data.rates['EUR'] ?? FALLBACK_RATES.EUR,
      };
      this.cache = { rates, fetchedAt: Date.now() };
      this.logger.log(
        `Exchange rates refreshed: 1 EGP = ${rates.USD} USD | ${rates.EUR} EUR`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to fetch exchange rates, using fallback: ${String(err)}`,
      );
      // Use fallback if cache is empty; keep stale cache if available
      if (!this.cache) {
        this.cache = { rates: { ...FALLBACK_RATES }, fetchedAt: Date.now() };
      }
    }
  }
}

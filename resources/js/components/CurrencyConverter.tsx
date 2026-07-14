import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Coins, ArrowRightLeft, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  items: Array<{
    product_id: number | string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
    discount_amount?: number;
    tax_percentage?: number;
    tax_amount?: number;
    total_amount: number;
    [key: string]: any;
  }>;
  onChange: (items: any[]) => void;
  calculateLineItemAmounts: (
    quantity: number,
    unitPrice: number,
    discountPercentage?: number,
    taxPercentage?: number
  ) => { discountAmount: number; taxAmount: number; totalAmount: number };
}

const currencies = [
  { code: 'USD', name: 'USD ($)' },
  { code: 'BDT', name: 'BDT (৳)' },
  { code: 'EUR', name: 'EUR (€)' },
  { code: 'INR', name: 'INR (₹)' },
  { code: 'GBP', name: 'GBP (£)' },
  { code: 'CAD', name: 'CAD (C$)' },
  { code: 'AUD', name: 'AUD (A$)' },
  { code: 'AED', name: 'AED (د.إ)' },
  { code: 'SAR', name: 'SAR (ر.س)' },
  { code: 'JPY', name: 'JPY (¥)' },
  { code: 'CNY', name: 'CNY (¥)' },
  { code: 'SGD', name: 'SGD (S$)' },
  { code: 'MYR', name: 'MYR (RM)' },
  { code: 'IDR', name: 'IDR (Rp)' },
  { code: 'CHF', name: 'CHF (CHF)' },
  { code: 'NZD', name: 'NZD (NZ$)' },
  { code: 'HKD', name: 'HKD (HK$)' }
];

const fallbacks: Record<string, number> = {
  USD: 1,
  BDT: 117.5,
  EUR: 0.92,
  INR: 83.5,
  GBP: 0.78,
  CAD: 1.37,
  AUD: 1.51,
  AED: 3.67,
  SAR: 3.75,
  JPY: 161.0,
  CNY: 7.27,
  SGD: 1.35,
  MYR: 4.71,
  IDR: 16200,
  CHF: 0.90,
  NZD: 1.64,
  HKD: 7.81
};

export default function CurrencyConverter({ items, onChange, calculateLineItemAmounts }: Props) {
  const { t } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState('BDT');
  const [rate, setRate] = useState<number>(117.5);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch the live exchange rate. `silent` = no success toast (for auto-refresh).
  const fetchExchangeRate = async (currency: string, silent = false) => {
    if (currency === 'USD') {
      setRate(1);
      setLastUpdated(new Date().toLocaleTimeString());
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`https://open.er-api.com/v6/latest/USD`);
      const data = await res.json();
      if (data?.rates?.[currency]) {
        const fetchedRate = Number(data.rates[currency]);
        setRate(fetchedRate);
        setLastUpdated(new Date().toLocaleTimeString());
        if (!silent) {
          toast.success(t('Live rate: 1 USD = {{rate}} {{currency}}', { rate: fetchedRate.toFixed(4), currency }));
        }
      } else {
        throw new Error('Rate not found');
      }
    } catch {
      const fallbackRate = fallbacks[currency] || 1;
      setRate(fallbackRate);
      setLastUpdated(new Date().toLocaleTimeString() + ' (offline)');
      if (!silent) {
        toast.warning(t('Offline rate: 1 USD = {{rate}} {{currency}}', { rate: fallbackRate, currency }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchExchangeRate(selectedCurrency, true);
  }, []);

  // Auto-refresh every 5 minutes silently
  useEffect(() => {
    const interval = setInterval(() => {
      fetchExchangeRate(selectedCurrency, true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCurrency]);

  const handleCurrencyChange = (val: string) => {
    setSelectedCurrency(val);
    fetchExchangeRate(val, true); // silent — user just switched currency, no toast noise
  };

  const convertedUSD = rate > 0 && amount ? (Number(amount) / rate).toFixed(2) : '0.00';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(convertedUSD);
    setCopied(true);
    toast.success(t('USD amount copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const convertTableToUSD = () => {
    if (items.length === 0) {
      toast.error(t('No items to convert'));
      return;
    }
    if (rate <= 0) {
      toast.error(t('Invalid rate'));
      return;
    }

    const newItems = items.map((item) => {
      const convertedUnitPrice = Number((Number(item.unit_price) / rate).toFixed(2));
      const calculations = calculateLineItemAmounts(
        Number(item.quantity) || 1,
        convertedUnitPrice,
        Number(item.discount_percentage) || 0,
        Number(item.tax_percentage) || 0
      );

      return {
        ...item,
        unit_price: convertedUnitPrice,
        discount_amount: Number(calculations.discountAmount) || 0,
        tax_amount: Number(calculations.taxAmount) || 0,
        total_amount: Number(calculations.totalAmount) || 0
      };
    });

    onChange(newItems);
    toast.success(t('Table prices converted to USD!'));
    setSelectedCurrency('USD');
    setRate(1);
    setAmount('');
  };

  return (
    <div className="bg-card border rounded-lg p-2.5 shadow-sm space-y-2 w-full max-w-[280px] text-xs h-full flex flex-col">
      {/* Header Row */}
      <div className="flex items-center justify-between text-primary font-semibold border-b pb-1">
        <div className="flex items-center gap-1.5">
          <Coins className="h-3.5 w-3.5" />
          <span>{t('Live Currency Converter')}</span>
        </div>
        <div className="flex items-center gap-1">
          {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          {lastUpdated && !loading && (
            <span className="text-[9px] text-muted-foreground font-normal">{lastUpdated}</span>
          )}
        </div>
      </div>

      {/* Row 1: Currency Select & Rate Input */}
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <Label className="text-[10px] text-muted-foreground block mb-0.5">{t('Currency')}</Label>
          <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="h-7 text-xs px-2">
              <SelectValue placeholder={t('Select')} />
            </SelectTrigger>
            <SelectContent searchable>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code} className="text-xs">
                  {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground block mb-0.5">{t('Rate (Per USD)')}</Label>
          <div className="relative">
            <Input
              type="number"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
              disabled={selectedCurrency === 'USD'}
              step="0.0001"
              className="h-7 pr-7 text-xs pl-2"
              placeholder={t('Rate')}
            />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-muted-foreground">
              {selectedCurrency}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Customer Amount & USD Result */}
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <Label className="text-[10px] text-muted-foreground block mb-0.5">{t('Customer Price')}</Label>
          <div className="relative">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 180000"
              className="h-7 pr-7 text-xs pl-2 font-medium"
            />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground">
              {selectedCurrency}
            </span>
          </div>
        </div>

        <div>
          <Label className="text-[10px] text-muted-foreground block mb-0.5">{t('Equivalent USD')}</Label>
          <div className="flex items-center justify-between bg-muted/60 rounded h-7 px-2 border">
            <span className="font-bold text-primary truncate">${convertedUSD}</span>
            {amount && (
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-muted-foreground hover:text-primary transition-colors ml-1 flex-shrink-0"
                title={t('Copy USD amount')}
              >
                {copied ? <Check className="h-3 w-3 text-green-600 font-bold" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Convert Table Button */}
      {selectedCurrency !== 'USD' && (
        <div className="flex pt-1 gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={convertTableToUSD}
            className="h-6.5 text-[10px] px-2 flex-1 gap-1 border-primary/20 hover:border-primary/50 text-primary hover:bg-primary/5"
          >
            <ArrowRightLeft className="h-2.5 w-2.5" />
            {t('Convert Table Items to USD')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fetchExchangeRate(selectedCurrency, false)} // manual refresh — show toast
            className="h-6.5 w-6.5 p-0 border flex items-center justify-center"
            title={t('Refresh Rate')}
          >
            {loading
              ? <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
              : <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />
            }
          </Button>
        </div>
      )}
    </div>
  );
}

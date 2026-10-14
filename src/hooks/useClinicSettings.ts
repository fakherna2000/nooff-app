'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ClinicSettings, Currency } from '@/lib/database.types';

interface ClinicSettingsData {
  settings: ClinicSettings | null;
  defaultCurrency: Currency | null;
  currencies: Currency[];
  loading: boolean;
  refresh: () => void;
}

export function useClinicSettings(): ClinicSettingsData {
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();

    const [{ data: settingsData }, { data: currenciesData }] = await Promise.all([
      supabase.from('clinic_settings').select('*').single(),
      supabase.from('currencies').select('*').order('is_default', { ascending: false }),
    ]);

    setSettings(settingsData as ClinicSettings | null);
    setCurrencies((currenciesData as Currency[]) || []);
    setDefaultCurrency(
      ((currenciesData as Currency[]) || []).find((c) => c.is_default) || null,
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { settings, defaultCurrency, currencies, loading, refresh: fetchData };
}

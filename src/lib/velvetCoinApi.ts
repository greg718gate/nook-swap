import { supabase } from "@/integrations/supabase/client";

export type VelvetCoinBalance = {
  profile?: {
    velvet_coins: number;
    velvet_coins_auto_apply: number;
    referral_code: string;
  };
  ledger?: Array<{
    amount: number;
    reason: string;
    created_at: string;
    balance_after: number;
  }>;
  rewards?: Record<string, number>;
  coins_per_percent?: number;
};

export async function fetchVelvetCoinBalance(): Promise<VelvetCoinBalance> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const { data, error } = await supabase.functions.invoke("velvet-coin-api", {
    body: { action: "balance" },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw error;
  return data as VelvetCoinBalance;
}

export async function setVelvetCoinAutoApply(coins: number): Promise<number> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const { data, error } = await supabase.functions.invoke("velvet-coin-api", {
    body: { action: "set_auto_apply", coins },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) throw error;
  return (data as { velvet_coins_auto_apply: number }).velvet_coins_auto_apply;
}

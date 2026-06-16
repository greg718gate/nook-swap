import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Coins, Copy, Gift, Share2, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import {
  fetchVelvetCoinBalance,
  setVelvetCoinAutoApply,
  type VelvetCoinBalance,
} from "@/lib/velvetCoinApi";

const MAX_REDEEM = 250;
const COINS_PER_PERCENT = 100;

export function VelvetCoinSection() {
  const [data, setData] = useState<VelvetCoinBalance | null>(null);
  const [autoApply, setAutoApply] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await fetchVelvetCoinBalance();
      setData(result);
      setAutoApply(result.profile?.velvet_coins_auto_apply ?? 0);
    } catch {
      toast.error("Could not load Velvet Coins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const balance = data?.profile?.velvet_coins ?? 0;
  const referralCode = data?.profile?.referral_code ?? "";
  const referralUrl =
    typeof window !== "undefined" && referralCode
      ? `${window.location.origin}/auth?ref=${referralCode}`
      : "";

  const copyReferral = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    toast.success("Referral link copied");
  };

  const saveAutoApply = async () => {
    setSaving(true);
    try {
      const applied = await setVelvetCoinAutoApply(autoApply);
      setAutoApply(applied);
      toast.success(`Will use up to ${applied} VC on your next sale`);
      await load();
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const feeReduction = Math.min(autoApply, MAX_REDEEM) / COINS_PER_PERCENT;

  if (loading) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Loading Velvet Coins…
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-hero p-3 shadow-glow">
              <Coins className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Your balance</p>
              <p className="text-4xl font-bold text-primary">{balance} VC</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            Platform currency — not crypto
          </Badge>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 font-semibold">
            <TrendingDown className="h-5 w-5 text-primary" />
            Lower selling fees
          </div>
          <p className="text-sm text-muted-foreground">
            Redeem Velvet Coins on your next sale. The standard platform fee is 5%.
            Every <strong>100 VC</strong> lowers it by <strong>1%</strong> (max{" "}
            <strong>250 VC</strong> = 2.5% fee).
          </p>
          <div className="space-y-2">
            <Label htmlFor="vc-auto">Coins to use on next sale (0–{MAX_REDEEM})</Label>
            <Input
              id="vc-auto"
              type="number"
              min={0}
              max={Math.min(MAX_REDEEM, balance)}
              value={autoApply}
              onChange={(e) =>
                setAutoApply(
                  Math.max(0, Math.min(MAX_REDEEM, Number(e.target.value) || 0)),
                )
              }
            />
            {autoApply > 0 && (
              <p className="text-sm text-muted-foreground">
                Estimated fee: {(5 - feeReduction).toFixed(1)}% instead of 5%
              </p>
            )}
          </div>
          <Button onClick={saveAutoApply} disabled={saving}>
            {saving ? "Saving…" : "Save for next sale"}
          </Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 font-semibold">
            <Share2 className="h-5 w-5 text-primary" />
            Refer friends
          </div>
          <p className="text-sm text-muted-foreground">
            Share your link. You earn <strong>50 VC</strong> when someone signs up, and{" "}
            <strong>75 VC</strong> when they complete their first sale.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={referralUrl} className="text-xs" />
            <Button type="button" variant="outline" size="icon" onClick={copyReferral}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Code: {referralCode}</p>
        </Card>
      </div>

      <Card className="p-6 space-y-3">
        <div className="flex items-center gap-2 font-semibold">
          <Gift className="h-5 w-5 text-primary" />
          How to earn
        </div>
        <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>• {data?.rewards?.signup ?? 25} VC — create an account</li>
          <li>• {data?.rewards?.first_sale ?? 100} VC — your first sale</li>
          <li>• {data?.rewards?.referral_signup ?? 50} VC — friend signs up with your link</li>
          <li>• {data?.rewards?.referral_first_sale ?? 75} VC — friend&apos;s first sale</li>
        </ul>
      </Card>

      {data?.ledger && data.ledger.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Recent activity</h3>
          <div className="space-y-2">
            {data.ledger.map((entry, i) => (
              <div
                key={`${entry.created_at}-${i}`}
                className="flex items-center justify-between text-sm border-b border-border/40 pb-2 last:border-0"
              >
                <span className="text-muted-foreground">{entry.reason}</span>
                <span className={entry.amount >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {entry.amount >= 0 ? "+" : ""}
                  {entry.amount} VC
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

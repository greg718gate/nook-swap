import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface StripeConnectSectionProps {
  userId: string;
  stripeOnboarded: boolean;
}

export const StripeConnectSection = ({ userId, stripeOnboarded }: StripeConnectSectionProps) => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<{
    connected: boolean;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    onboarded: boolean;
  } | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("stripe-connect-status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      setStatus(data);
    } catch (err) {
      console.error("Error checking Stripe status:", err);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be signed in");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-stripe-connect-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data.already_onboarded) {
        toast.success("Your Stripe account is already connected!");
        await checkStatus();
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error("Could not connect Stripe account");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Checking Stripe status...</span>
        </div>
      </Card>
    );
  }

  const isFullyOnboarded = status?.connected && status?.charges_enabled && status?.payouts_enabled;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-primary" />
        <h3 className="text-xl font-bold">Stripe Connect account</h3>
      </div>

      <p className="text-muted-foreground">
        Connect your Stripe account to receive payouts from sales on the platform automatically.
        We charge a 5% platform fee; the rest goes directly to your account.
      </p>

      {isFullyOnboarded ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400">Account connected</p>
            <p className="text-sm text-muted-foreground">
              Payments and payouts are active. Sale proceeds will be transferred to your account automatically.
            </p>
          </div>
          <Badge variant="outline" className="ml-auto border-green-500 text-green-600">
            Active
          </Badge>
        </div>
      ) : status?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Onboarding incomplete
              </p>
              <p className="text-sm text-muted-foreground">
                Your account needs further setup before you can accept payments.
              </p>
            </div>
          </div>
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Complete Stripe setup
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button onClick={handleConnect} disabled={loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Connect Stripe account
            </>
          )}
        </Button>
      )}
    </Card>
  );
};

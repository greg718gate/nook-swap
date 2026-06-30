import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

export const MfaSecurityPanel = () => {
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totp = data?.totp?.find((f) => f.status === "verified");
      setEnrolled(Boolean(totp));
      setFactorId(totp?.id ?? null);
    } catch {
      setEnrolled(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "VelvetBazzar authenticator",
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp?.qr_code ?? null);
      toast.message("Scan the QR code with Google Authenticator or Authy");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not start MFA setup");
    } finally {
      setEnrolling(false);
    }
  };

  const confirmEnroll = async () => {
    if (!factorId || verifyCode.length < 6) return;
    setEnrolling(true);
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (chErr) throw chErr;
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode.trim(),
      });
      if (error) throw error;
      toast.success("Two-factor authentication enabled");
      setQrCode(null);
      setVerifyCode("");
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Invalid code — try again");
    } finally {
      setEnrolling(false);
    }
  };

  const disableMfa = async () => {
    if (!factorId) return;
    setEnrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success("Two-factor authentication disabled");
      setFactorId(null);
      setQrCode(null);
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not disable MFA");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading security settings…
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Two-factor authentication (2FA)</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Add an authenticator app for extra protection when signing in.
      </p>

      {enrolled ? (
        <div className="space-y-3">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">2FA is ON</p>
          <Button variant="outline" onClick={disableMfa} disabled={enrolling}>
            Disable 2FA
          </Button>
        </div>
      ) : qrCode ? (
        <div className="space-y-3">
          {qrCode.startsWith("data:") || qrCode.startsWith("http") ? (
            <img src={qrCode} alt="MFA QR code" className="mx-auto max-w-[200px]" />
          ) : (
            <p className="text-xs break-all font-mono bg-muted p-2 rounded">{qrCode}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="mfa-code">6-digit code from app</Label>
            <Input
              id="mfa-code"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          <Button onClick={confirmEnroll} disabled={enrolling || verifyCode.length < 6}>
            Confirm 2FA
          </Button>
        </div>
      ) : (
        <Button onClick={startEnroll} disabled={enrolling}>
          {enrolling ? "Setting up…" : "Enable 2FA"}
        </Button>
      )}
    </Card>
  );
};

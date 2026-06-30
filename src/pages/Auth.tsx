import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { getAuthErrorMessage, getFunctionErrorMessage } from "@/lib/functionError";
import { getPostLoginPath } from "@/lib/profileSetup";
import {
  DispatchAddressFields,
  validateDispatchAddress,
  type DispatchAddressValues,
} from "@/components/DispatchAddressFields";
import { TurnstileWidget, isTurnstileEnabled } from "@/components/TurnstileWidget";

const emptyDispatch = (): DispatchAddressValues => ({
  dispatch_name: "",
  dispatch_line1: "",
  dispatch_line2: "",
  dispatch_city: "",
  dispatch_postcode: "",
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [dispatch, setDispatch] = useState<DispatchAddressValues>(emptyDispatch);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const referralCode = searchParams.get("ref")?.trim().toUpperCase() || "";

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        navigate(await getPostLoginPath());
      }
    });
  }, [navigate]);

  const handleDispatchChange = (field: keyof DispatchAddressValues, value: string) => {
    setDispatch((prev) => ({ ...prev, [field]: value }));
  };

  const saveDispatchAddress = async (userId: string) => {
    await supabase
      .from("profiles")
      .update({
        dispatch_name: dispatch.dispatch_name.trim() || username.trim(),
        dispatch_line1: dispatch.dispatch_line1.trim(),
        dispatch_line2: dispatch.dispatch_line2.trim() || null,
        dispatch_city: dispatch.dispatch_city.trim(),
        dispatch_postcode: dispatch.dispatch_postcode.trim().toUpperCase(),
        dispatch_country: "GB",
      })
      .eq("id", userId);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedUsername = username.trim();

      const { data: taken } = await supabase
        .from("public_profiles")
        .select("id")
        .ilike("username", trimmedUsername)
        .maybeSingle();

      if (taken) {
        toast.error("Username is taken — please choose another");
        return;
      }

      const dispatchError = validateDispatchAddress({
        ...dispatch,
        dispatch_name: dispatch.dispatch_name || username,
      });
      if (dispatchError) {
        toast.error(dispatchError);
        return;
      }

      if (!acceptedTerms) {
        toast.error("You must accept the Terms of Service");
        return;
      }

      if (isTurnstileEnabled() && !turnstileToken) {
        toast.error("Complete the security check before signing up");
        return;
      }

      const { data, error } = await supabase.functions.invoke("auth-signup", {
        body: {
          email: email.trim().toLowerCase(),
          password,
          username: trimmedUsername,
          referral_code: referralCode || undefined,
          turnstile_token: turnstileToken ?? undefined,
        },
      });

      if (error) throw new Error(await getFunctionErrorMessage(error));
      if (data?.error) throw new Error(data.error);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) await saveDispatchAddress(session.user.id);

      toast.success("Account created! You're signed in.");
      navigate(await getPostLoginPath());
    } catch (error: unknown) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mfaRequired && mfaFactorId) {
        const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
          factorId: mfaFactorId,
        });
        if (chErr) throw chErr;
        const { error: verifyErr } = await supabase.auth.mfa.verify({
          factorId: mfaFactorId,
          challengeId: challenge.id,
          code: mfaCode.trim(),
        });
        if (verifyErr) throw verifyErr;
        toast.success("Signed in successfully!");
        navigate(await getPostLoginPath());
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
        if (fErr) throw fErr;
        const totp = factors?.totp?.find((f) => f.status === "verified");
        if (totp) {
          setMfaRequired(true);
          setMfaFactorId(totp.id);
          toast.message("Enter the 6-digit code from your authenticator app");
          return;
        }
      }

      toast.success("Signed in successfully!");
      navigate(await getPostLoginPath());
    } catch (error: unknown) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md lg:max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-gradient-hero" />
          <CardTitle className="text-2xl">VelvetBazzar</CardTitle>
          <CardDescription>Sign in to buy and sell</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                {!mfaRequired ? (
                  <>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="ty@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="mfa-signin-code">Authenticator code</Label>
                    <Input
                      id="mfa-signin-code"
                      inputMode="numeric"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:underline"
                      onClick={() => {
                        setMfaRequired(false);
                        setMfaFactorId(null);
                        setMfaCode("");
                      }}
                    >
                      Back to password
                    </button>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading || (mfaRequired && mfaCode.length < 6)}>
                  {loading ? "Signing in..." : mfaRequired ? "Verify code" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="ty@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                      minLength={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      At least 10 characters with a letter and a number.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 p-4 space-y-3">
                  <p className="text-sm font-medium">Your UK address *</p>
                  <p className="text-xs text-muted-foreground">
                    Required for shipping when you buy or sell.
                  </p>
                  <DispatchAddressFields
                    values={dispatch}
                    onChange={handleDispatchChange}
                    idPrefix="signup-dispatch"
                  />
                </div>
                {referralCode && (
                  <p className="text-xs text-muted-foreground rounded-md bg-muted/50 p-2">
                    Referral code applied: <strong>{referralCode}</strong>
                  </p>
                )}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptedTerms}
                    onCheckedChange={(v) => setAcceptedTerms(v === true)}
                  />
                  <Label htmlFor="accept-terms" className="text-sm leading-snug font-normal">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline" target="_blank">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                <TurnstileWidget
                  onToken={(t) => setTurnstileToken(t)}
                  onExpire={() => setTurnstileToken(null)}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !acceptedTerms || (isTurnstileEnabled() && !turnstileToken)}
                >
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

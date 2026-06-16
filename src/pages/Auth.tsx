import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const emptyDispatch = (): DispatchAddressValues => ({
  dispatch_name: "",
  dispatch_line1: "",
  dispatch_line2: "",
  dispatch_city: "",
  dispatch_postcode: "",
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [dispatch, setDispatch] = useState<DispatchAddressValues>(emptyDispatch);

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
        toast.error("Nazwa użytkownika jest zajęta — wybierz inną");
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

      const { data, error } = await supabase.functions.invoke("auth-signup", {
        body: { email: email.trim().toLowerCase(), password, username: trimmedUsername },
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

      toast.success("Konto utworzone! Zalogowano pomyślnie.");
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
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      toast.success("Zalogowano pomyślnie!");
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
          <CardDescription>Zaloguj się, aby kupować i sprzedawać</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Logowanie</TabsTrigger>
              <TabsTrigger value="signup">Rejestracja</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
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
                  <Label htmlFor="signin-password">Hasło</Label>
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
                      aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Logowanie..." : "Zaloguj się"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Nazwa użytkownika</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="janek"
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
                  <Label htmlFor="signup-password">Hasło</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Tworzenie konta..." : "Załóż konto"}
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

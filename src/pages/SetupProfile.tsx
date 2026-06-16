import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";
import {
  DispatchAddressFields,
  validateDispatchAddress,
  type DispatchAddressValues,
} from "@/components/DispatchAddressFields";
import { hasCompleteDispatchAddress } from "@/lib/profileSetup";

const SetupProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [values, setValues] = useState<DispatchAddressValues>({
    dispatch_name: "",
    dispatch_line1: "",
    dispatch_line2: "",
    dispatch_city: "",
    dispatch_postcode: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      const { data } = await supabase
        .from("profiles")
        .select("dispatch_name, dispatch_line1, dispatch_line2, dispatch_city, dispatch_postcode, full_name, username")
        .eq("id", session.user.id)
        .maybeSingle();

      if (hasCompleteDispatchAddress(data)) {
        navigate("/", { replace: true });
        return;
      }

      setValues({
        dispatch_name: data?.dispatch_name || data?.full_name || data?.username || "",
        dispatch_line1: data?.dispatch_line1 || "",
        dispatch_line2: data?.dispatch_line2 || "",
        dispatch_city: data?.dispatch_city || "",
        dispatch_postcode: data?.dispatch_postcode || "",
      });
      setLoading(false);
    });
  }, [navigate]);

  const handleChange = (field: keyof DispatchAddressValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateDispatchAddress(values);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!userId) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        dispatch_name: values.dispatch_name.trim() || null,
        dispatch_line1: values.dispatch_line1.trim(),
        dispatch_line2: values.dispatch_line2.trim() || null,
        dispatch_city: values.dispatch_city.trim(),
        dispatch_postcode: values.dispatch_postcode.trim().toUpperCase(),
        dispatch_country: "GB",
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      toast.error("Could not save address — try again");
      return;
    }

    toast.success("Address saved — you can buy and sell now");
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-hero">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Your UK address</CardTitle>
          <CardDescription>
            Required for shipping labels and deliveries. All sellers and buyers need a UK address on file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <DispatchAddressFields values={values} onChange={handleChange} idPrefix="setup" />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue to VelvetBazzar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupProfile;

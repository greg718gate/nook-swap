import { supabase } from "@/integrations/supabase/client";

export type DispatchProfile = {
  dispatch_line1?: string | null;
  dispatch_city?: string | null;
  dispatch_postcode?: string | null;
};

export function hasCompleteDispatchAddress(profile: DispatchProfile | null | undefined): boolean {
  return Boolean(
    profile?.dispatch_line1?.trim() &&
      profile?.dispatch_city?.trim() &&
      profile?.dispatch_postcode?.trim(),
  );
}

export async function getPostLoginPath(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return "/auth";

  const { data } = await supabase
    .from("profiles")
    .select("dispatch_line1, dispatch_city, dispatch_postcode")
    .eq("id", session.user.id)
    .maybeSingle();

  return hasCompleteDispatchAddress(data) ? "/" : "/setup";
}

export const DISPATCH_SELECT =
  "dispatch_name, dispatch_line1, dispatch_line2, dispatch_city, dispatch_postcode, dispatch_country";

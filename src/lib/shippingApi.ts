import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export type ShippingLabelResult = {
  success?: boolean;
  label_url?: string;
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
  already_created?: boolean;
  error?: string;
  code?: string;
};

export async function createShippingLabel(orderId: string): Promise<ShippingLabelResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const { data, error } = await supabase.functions.invoke("create-shipping-label", {
    body: { order_id: orderId },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json();
        return body as ShippingLabelResult;
      } catch {
        // ignore
      }
    }
    throw error;
  }

  return data as ShippingLabelResult;
}

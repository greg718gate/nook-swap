import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWishlist = (userId?: string) => {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return setIds(new Set());
    setLoading(true);
    const { data } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", userId);
    setIds(new Set((data ?? []).map((r: any) => r.product_id)));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = async (productId: string) => {
    if (!userId) {
      toast.error("Sign in to add to wishlist");
      return;
    }
    if (ids.has(productId)) {
      await supabase.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", productId);
      setIds((prev) => {
        const n = new Set(prev);
        n.delete(productId);
        return n;
      });
      toast.success("Removed from wishlist");
    } else {
      const { error } = await supabase
        .from("wishlist_items")
        .insert({ user_id: userId, product_id: productId });
      if (!error) {
        setIds((prev) => new Set(prev).add(productId));
        toast.success("Added to wishlist");
      }
    }
  };

  return { ids, loading, toggle, refresh, isWishlisted: (id: string) => ids.has(id) };
};

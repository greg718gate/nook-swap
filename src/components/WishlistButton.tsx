import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWishlist } from "@/hooks/useWishlist";

interface Props {
  productId: string;
  className?: string;
  size?: "sm" | "icon" | "default";
}

export const WishlistButton = ({ productId, className, size = "icon" }: Props) => {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setUserId(s?.user.id)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const { isWishlisted, toggle } = useWishlist(userId);
  const active = isWishlisted(productId);

  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      className={cn(
        "backdrop-blur-sm bg-background/90 hover:bg-background shadow-md",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          active ? "fill-destructive text-destructive" : "text-foreground"
        )}
      />
    </Button>
  );
};

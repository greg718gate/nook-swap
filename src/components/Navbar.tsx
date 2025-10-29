import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";

export const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchCartCount = async () => {
        const { count } = await supabase
          .from("cart_items")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        setCartCount(count || 0);
      };
      fetchCartCount();

      const channel = supabase
        .channel("cart_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "cart_items",
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchCartCount()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-hero" />
          <span className="text-xl font-bold text-foreground">MarketHub</span>
        </Link>

        <div className="flex flex-1 items-center justify-center px-8">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(`/products?search=${e.currentTarget.value}`);
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/sell")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Sell
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/cart")}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
              >
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")}>Sign In</Button>
          )}
        </div>
      </div>
    </nav>
  );
};

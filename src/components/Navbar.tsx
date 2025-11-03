import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Plus, Search, BarChart3 } from "lucide-react";
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
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-md">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="group flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-hero shadow-glow transition-all duration-300 group-hover:scale-110 group-hover:shadow-glow" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">MarketHub</span>
        </Link>

        <div className="flex flex-1 items-center justify-center px-8">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors" />
            <Input
              placeholder="Search products..."
              className="pl-12 h-12 rounded-xl bg-muted/50 border-border/50 backdrop-blur-sm focus:bg-background transition-all shadow-sm focus:shadow-md"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(`/products?search=${e.currentTarget.value}`);
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/sell")}
                className="gap-2 hover:bg-primary/10 hover:text-primary transition-all"
              >
                <Plus className="h-4 w-4" />
                Sell
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="gap-2 hover:bg-accent/10 hover:text-accent transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/cart")}
                className="relative hover:bg-primary/10 hover:text-primary transition-all"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-accent text-xs font-bold text-accent-foreground shadow-lg animate-scale-in">
                    {cartCount}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                className="hover:bg-primary/10 hover:text-primary transition-all"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:text-destructive transition-all">
                Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="shadow-lg hover:shadow-xl transition-all">Sign In</Button>
          )}
        </div>
      </div>
    </nav>
  );
};

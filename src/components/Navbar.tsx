import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Plus, Search, BarChart3, MessageCircle, Menu, LogOut, Package, Store, Home, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { useMessages } from "@/hooks/useMessages";
import { NotificationBell } from "@/components/NotificationBell";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useMessages(user?.id);

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
          { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` },
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
    setMobileOpen(false);
    navigate("/");
  };

  const go = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-md">
      <div className="container flex h-16 md:h-20 items-center justify-between gap-2">
        <Link to="/" className="group flex items-center space-x-2 shrink-0">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gradient-hero shadow-glow transition-all duration-300 group-hover:scale-110" />
          <span className="text-base md:text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent whitespace-nowrap">
            VelvetBazzar
          </span>
        </Link>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 items-center justify-center px-8">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-12 h-12 rounded-xl bg-muted/50 border-border/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/products?search=${e.currentTarget.value}`);
              }}
            />
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>Home</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/products")}>Browse</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/sell")} className="gap-2">
            <Plus className="h-4 w-4" /> Sell
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/my-orders")}>Zakupy</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/sales")}>Sprzedaż</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
                <BarChart3 className="h-4 w-4" /> Dashboard
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile?tab=messages")} className="relative">
                <MessageCircle className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-orange text-xs font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              <NotificationBell userId={user.id} />
              <Button variant="ghost" size="icon" onClick={() => navigate("/cart")} className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-accent text-xs font-bold text-accent-foreground">
                    {cartCount}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:text-destructive">
                Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="shadow-lg">Log In / Sign Up</Button>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="flex md:hidden items-center gap-1">
          {user && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/cart")} className="relative h-10 w-10">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-accent text-xs font-bold text-accent-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          )}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 relative">
                <Menu className="h-6 w-6" />
                {user && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-orange text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[85vw] max-w-sm p-0 flex flex-col"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="text-left">
                  {user ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-muted-foreground">Zalogowany jako</span>
                      <span className="text-base font-semibold truncate">{user.email}</span>
                    </div>
                  ) : (
                    "Menu"
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="p-3">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Szukaj produktów..."
                    className="pl-9 h-11 rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = e.currentTarget.value;
                        setMobileOpen(false);
                        navigate(`/products?search=${v}`);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-4">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => go("/")}>
                    <Home className="h-5 w-5" /> Home
                  </Button>
                  <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => go("/products")}>
                    <Search className="h-5 w-5" /> Przeglądaj
                  </Button>
                  <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => go("/sell")}>
                    <Plus className="h-5 w-5" /> Wystaw przedmiot
                  </Button>

                  {user ? (
                    <>
                      <div className="h-px bg-border my-2" />
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => go("/profile")}>
                        <User className="h-5 w-5" /> Mój profil
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12 relative" onClick={() => go("/profile?tab=messages")}>
                        <MessageCircle className="h-5 w-5" /> Wiadomości
                        {unreadCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-accent-orange text-xs font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => go("/my-orders")}>
                        <ShoppingBag className="h-5 w-5" /> Moje zakupy
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => go("/sales")}>
                        <Package className="h-5 w-5" /> Moja sprzedaż
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => go("/dashboard")}>
                        <BarChart3 className="h-5 w-5" /> Dashboard
                      </Button>
                      <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => go("/cart")}>
                        <ShoppingCart className="h-5 w-5" /> Koszyk
                        {cartCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {cartCount}
                          </span>
                        )}
                      </Button>
                      <div className="h-px bg-border my-2" />
                      <Button variant="ghost" className="justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
                        <LogOut className="h-5 w-5" /> Wyloguj się
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="h-px bg-border my-2" />
                      <Button className="h-12 mt-2" onClick={() => go("/auth")}>
                        Zaloguj / Zarejestruj
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

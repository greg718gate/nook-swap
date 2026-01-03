import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Loader2, Package, Download, Shield } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

interface CartItem {
  id: string;
  quantity: number;
  products: {
    id: string;
    title: string;
    price: number;
    images: string[];
    status: string;
    seller_id: string;
    product_type: string;
    shipping_evri: number;
    shipping_royal_mail: number;
    shipping_inpost: number;
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<string>("evri");
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        navigate("/auth");
      } else {
        fetchCart();
      }
    });
  }, [navigate]);

  const fetchCart = async () => {
    const { data } = await supabase
      .from("cart_items")
      .select(`
        id,
        quantity,
        products (id, title, price, images, status, seller_id, product_type, shipping_evri, shipping_royal_mail, shipping_inpost)
      `)
      .order("created_at", { ascending: false });

    if (data) setCartItems(data as CartItem[]);
    setLoading(false);
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase.from("cart_items").delete().eq("id", itemId);

    if (error) {
      toast.error("Nie udało się usunąć produktu");
    } else {
      toast.success("Produkt usunięty z koszyka");
      fetchCart();
    }
  };

  const getShippingCost = () => {
    return cartItems.reduce((sum, item) => {
      // Only count shipping for physical products
      if (item.products.product_type === "digital") return sum;
      
      const shippingCost =
        shippingMethod === "evri"
          ? item.products.shipping_evri
          : shippingMethod === "royal_mail"
          ? item.products.shipping_royal_mail
          : item.products.shipping_inpost;
      return sum + shippingCost;
    }, 0);
  };

  const hasPhysicalProducts = cartItems.some(
    (item) => item.products.product_type === "physical"
  );

  const hasDigitalProducts = cartItems.some(
    (item) => item.products.product_type === "digital"
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.products.price * item.quantity,
    0
  );

  const shippingCost = getShippingCost();
  const platformFee = (subtotal + shippingCost) * 0.05;
  const total = subtotal + shippingCost;

  const handleCheckout = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (hasPhysicalProducts && !shippingAddress.trim()) {
      toast.error("Podaj adres dostawy dla produktów fizycznych");
      return;
    }

    // Check for sold items
    const soldItems = cartItems.filter((item) => item.products.status === "sold");
    if (soldItems.length > 0) {
      toast.error("Niektóre produkty są już niedostępne. Usuń je z koszyka.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Musisz być zalogowany");
      }

      const items = cartItems.map((item) => ({
        product_id: item.products.id,
        quantity: item.quantity,
        title: item.products.title,
        price: item.products.price,
        seller_id: item.products.seller_id,
        image_url: item.products.images?.[0] || undefined,
        product_type: item.products.product_type,
        shipping_cost:
          item.products.product_type === "physical"
            ? shippingMethod === "evri"
              ? item.products.shipping_evri
              : shippingMethod === "royal_mail"
              ? item.products.shipping_royal_mail
              : item.products.shipping_inpost
            : 0,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            items,
            shipping_method: shippingMethod,
            shipping_address: shippingAddress,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Błąd podczas tworzenia płatności");
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Nie otrzymano linku do płatności");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Błąd podczas przechodzenia do płatności");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="mb-8 text-3xl font-bold">Koszyk</h1>

          {cartItems.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="mb-4 text-muted-foreground">Twój koszyk jest pusty</p>
              <Button onClick={() => navigate("/products")}>
                Przeglądaj produkty
              </Button>
            </Card>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {cartItems.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-4">
                      <div className="h-24 w-24 overflow-hidden rounded-lg bg-muted">
                        {item.products.images && item.products.images[0] ? (
                          <img
                            src={item.products.images[0]}
                            alt={item.products.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs">
                            Brak zdjęcia
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{item.products.title}</h3>
                            {item.products.product_type === "digital" ? (
                              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                <Download className="h-3 w-3" />
                                Cyfrowy
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                <Package className="h-3 w-3" />
                                Fizyczny
                              </span>
                            )}
                          </div>
                          {item.products.status === "sold" && (
                            <p className="text-sm text-destructive">Niedostępny</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-primary">
                            £{item.products.price.toFixed(2)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24 p-6">
                  <h2 className="mb-4 text-xl font-semibold">Podsumowanie</h2>
                  
                  {/* Shipping Method - only if physical products */}
                  {hasPhysicalProducts && (
                    <div className="mb-6 space-y-3">
                      <h3 className="font-medium">Metoda wysyłki</h3>
                      <div className="space-y-2">
                        <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shipping"
                              value="evri"
                              checked={shippingMethod === "evri"}
                              onChange={(e) => setShippingMethod(e.target.value)}
                              className="h-4 w-4"
                            />
                            <span>Evri</span>
                          </div>
                          <span className="font-medium">
                            £{cartItems
                              .filter((i) => i.products.product_type === "physical")
                              .reduce((sum, i) => sum + i.products.shipping_evri, 0)
                              .toFixed(2)}
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shipping"
                              value="royal_mail"
                              checked={shippingMethod === "royal_mail"}
                              onChange={(e) => setShippingMethod(e.target.value)}
                              className="h-4 w-4"
                            />
                            <span>Royal Mail</span>
                          </div>
                          <span className="font-medium">
                            £{cartItems
                              .filter((i) => i.products.product_type === "physical")
                              .reduce((sum, i) => sum + i.products.shipping_royal_mail, 0)
                              .toFixed(2)}
                          </span>
                        </label>
                        <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-accent">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="shipping"
                              value="inpost"
                              checked={shippingMethod === "inpost"}
                              onChange={(e) => setShippingMethod(e.target.value)}
                              className="h-4 w-4"
                            />
                            <span>InPost</span>
                          </div>
                          <span className="font-medium">
                            £{cartItems
                              .filter((i) => i.products.product_type === "physical")
                              .reduce((sum, i) => sum + i.products.shipping_inpost, 0)
                              .toFixed(2)}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Shipping Address - only if physical products */}
                  {hasPhysicalProducts && (
                    <div className="mb-6 space-y-2">
                      <Label htmlFor="shipping_address">Adres dostawy *</Label>
                      <Textarea
                        id="shipping_address"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Imię i nazwisko&#10;Ulica i numer&#10;Kod pocztowy, Miasto&#10;Kraj"
                        rows={4}
                        required={hasPhysicalProducts}
                      />
                    </div>
                  )}

                  {hasDigitalProducts && !hasPhysicalProducts && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm">
                      <Download className="h-5 w-5 text-primary" />
                      <span>Produkty cyfrowe - bez wysyłki</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Produkty</span>
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    {hasPhysicalProducts && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>
                          Wysyłka ({shippingMethod === "evri" ? "Evri" : shippingMethod === "royal_mail" ? "Royal Mail" : "InPost"})
                        </span>
                        <span>£{shippingCost.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Razem</span>
                        <span className="text-primary">£{total.toFixed(2)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Prowizja platformy (5%): £{platformFee.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <Button 
                    className="mt-6 w-full" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={checkoutLoading || cartItems.some(i => i.products.status === "sold")}
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Przetwarzanie...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Przejdź do płatności
                      </>
                    )}
                  </Button>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Płatność bezpieczna przez Stripe
                  </p>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;

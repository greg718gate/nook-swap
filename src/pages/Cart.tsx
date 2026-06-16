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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

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
      toast.error("Could not remove item");
    } else {
      toast.success("Item removed from cart");
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
  const discount = appliedCoupon?.discount ?? 0;
  const platformFee = (subtotal + shippingCost - discount) * 0.05;
  const total = Math.max(0, subtotal + shippingCost - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (cartItems.length === 0) return;
    // Coupons are per-seller; require single-seller cart
    const sellers = new Set(cartItems.map((i) => i.products.seller_id));
    if (sellers.size > 1) {
      toast.error("Coupons apply only when all items are from one seller");
      return;
    }
    setCouponLoading(true);
    const sellerId = [...sellers][0];
    const { data, error } = await supabase.rpc("validate_coupon", {
      _code: couponCode.trim().toUpperCase(),
      _seller_id: sellerId,
      _subtotal: subtotal,
    });
    setCouponLoading(false);
    if (error || !data || data.length === 0) {
      toast.error("Coupon validation error");
      return;
    }
    const r = data[0] as any;
    if (!r.coupon_id) {
      toast.error(r.message || "Invalid code");
      return;
    }
    setAppliedCoupon({ code: couponCode.trim().toUpperCase(), discount: Number(r.discount) });
    toast.success(`Discount applied — £${Number(r.discount).toFixed(2)} off`);
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (hasPhysicalProducts && !shippingAddress.trim()) {
      toast.error("Enter a delivery address for physical items");
      return;
    }

    // Check for sold items
    const soldItems = cartItems.filter((item) => item.products.status === "sold");
    if (soldItems.length > 0) {
      toast.error("Some items are no longer available. Remove them from your cart.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("You must be signed in");
      }

      const items = cartItems.map((item) => ({
        product_id: item.products.id,
        quantity: item.quantity,
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
            coupon_code: appliedCoupon?.code,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Could not create payment");
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No payment link received");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Could not proceed to payment");
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
          <h1 className="mb-8 text-3xl font-bold">Basket</h1>

          {cartItems.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="mb-4 text-muted-foreground">Your basket is empty</p>
              <Button onClick={() => navigate("/products")}>
                Browse products
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
                            No image
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
                                Digital
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                <Package className="h-3 w-3" />
                                Physical
                              </span>
                            )}
                          </div>
                          {item.products.status === "sold" && (
                            <p className="text-sm text-destructive">Unavailable</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-primary">
                            £{Number(item.products.price ?? 0).toFixed(2)}
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
                  <h2 className="mb-4 text-xl font-semibold">Summary</h2>
                  
                  {/* Shipping Method - only if physical products */}
                  {hasPhysicalProducts && (
                    <div className="mb-6 space-y-3">
                      <h3 className="font-medium">Shipping method</h3>
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
                              .reduce((sum, i) => sum + Number(i.products.shipping_evri ?? 0), 0)
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
                              .reduce((sum, i) => sum + Number(i.products.shipping_royal_mail ?? 0), 0)
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
                            <span>InPost Lockers</span>
                          </div>
                          <span className="font-medium">
                            £{cartItems
                              .filter((i) => i.products.product_type === "physical")
                              .reduce((sum, i) => sum + Number(i.products.shipping_inpost ?? 0), 0)
                              .toFixed(2)}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Shipping Address - only if physical products */}
                  {hasPhysicalProducts && (
                    <div className="mb-6 space-y-2">
                      <Label htmlFor="shipping_address">Delivery address *</Label>
                      <Textarea
                        id="shipping_address"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Full name&#10;Street and number&#10;Postcode, City&#10;Country"
                        rows={4}
                        required={hasPhysicalProducts}
                      />
                    </div>
                  )}

                  {hasDigitalProducts && !hasPhysicalProducts && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm">
                      <Download className="h-5 w-5 text-primary" />
                      <span>Digital items — no shipping</span>
                    </div>
                  )}

                  <div className="mb-4 space-y-2">
                    <Label htmlFor="coupon">Discount code</Label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 p-3">
                        <span className="font-mono font-bold text-primary">{appliedCoupon.code}</span>
                        <Button variant="ghost" size="sm" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          id="coupon"
                          placeholder="e.g. SUMMER20"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <Button variant="outline" onClick={applyCoupon} disabled={couponLoading}>
                          Apply
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items</span>
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>
                    {hasPhysicalProducts && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>
                          Shipping ({shippingMethod === "evri" ? "Evri" : shippingMethod === "royal_mail" ? "Royal Mail" : "InPost"})
                        </span>
                        <span>£{shippingCost.toFixed(2)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-primary font-medium">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span>-£{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span className="text-primary">£{total.toFixed(2)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Platform fee (5%): £{platformFee.toFixed(2)}
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
                        Processing...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Proceed to payment
                      </>
                    )}
                  </Button>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Secure payment via Stripe
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

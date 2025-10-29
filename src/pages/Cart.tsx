import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
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
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

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
        products (id, title, price, images, status)
      `)
      .order("created_at", { ascending: false });

    if (data) setCartItems(data as CartItem[]);
    setLoading(false);
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase.from("cart_items").delete().eq("id", itemId);

    if (error) {
      toast.error("Failed to remove item");
    } else {
      toast.success("Item removed from cart");
      fetchCart();
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.products.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">Loading...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>

          {cartItems.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="mb-4 text-muted-foreground">Your cart is empty</p>
              <Button onClick={() => navigate("/products")}>
                Continue Shopping
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
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h3 className="font-semibold">{item.products.title}</h3>
                          {item.products.status === "sold" && (
                            <p className="text-sm text-destructive">No longer available</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold text-primary">
                            ${item.products.price.toFixed(2)}
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
                  <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="mt-6 w-full" size="lg">
                    Proceed to Checkout
                  </Button>
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

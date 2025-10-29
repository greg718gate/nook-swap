import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        navigate("/auth");
      } else {
        fetchProfile(currentUser.id);
        fetchProducts(currentUser.id);
        fetchOrders(currentUser.id);
      }
    });
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
  };

  const fetchProducts = async (userId: string) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const fetchOrders = async (userId: string) => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", userId)
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (!error) {
      setProducts(products.filter((p) => p.id !== productId));
    }
  };

  if (!user || !profile) {
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
          <Card className="mb-8 p-6">
            <div className="flex items-start gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-hero">
                <User className="h-12 w-12 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold">{profile.username}</h1>
                <div className="mb-4 flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span>{profile.rating.toFixed(1)} rating</span>
                  </div>
                  <span>•</span>
                  <span>{profile.total_reviews} reviews</span>
                  {profile.location && (
                    <>
                      <span>•</span>
                      <span>{profile.location}</span>
                    </>
                  )}
                </div>
                {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
              </div>
            </div>
          </Card>

          <Tabs defaultValue="listings">
            <TabsList className="mb-6">
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="orders">My Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="listings" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Listings</h2>
                <Button onClick={() => navigate("/sell")}>Add New Listing</Button>
              </div>

              {products.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="mb-4 text-muted-foreground">
                    You haven't listed any items yet
                  </p>
                  <Button onClick={() => navigate("/sell")}>List Your First Item</Button>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-square bg-muted">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h3 className="font-semibold">{product.title}</h3>
                          <Badge
                            variant={
                              product.status === "active" ? "default" : "secondary"
                            }
                          >
                            {product.status}
                          </Badge>
                        </div>
                        <p className="mb-3 text-xl font-bold text-primary">
                          ${product.price.toFixed(2)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/product/${product.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders">
              <h2 className="mb-6 text-2xl font-bold">My Orders</h2>
              {orders.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No orders yet</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            ${order.total_amount.toFixed(2)}
                          </p>
                          <Badge>{order.status}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

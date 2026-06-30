import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Star, User, Edit, Eye, Trash2, MessageCircle, Coins } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { MessagesSection } from "@/components/MessagesSection";
import { useMessages } from "@/hooks/useMessages";
import { ProfileEditForm } from "@/components/ProfileEditForm";
import { StripeConnectSection } from "@/components/StripeConnectSection";
import { VelvetCoinSection } from "@/components/VelvetCoinSection";
import { MfaSecurityPanel } from "@/components/MfaSecurityPanel";

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const { unreadCount } = useMessages(user?.id);
  
  const activeTab = searchParams.get('tab') || 'listings';
  const initialConversationId = searchParams.get('conversation');

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'listings') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    if (tab !== 'messages') {
      params.delete('conversation');
    }
    const query = params.toString();
    navigate(query ? `/profile?${query}` : '/profile', { replace: true });
  };

  useEffect(() => {
    let cancelled = false;

    const loadFor = async (currentUser: SupabaseUser | null) => {
      if (cancelled) return;
      setUser(currentUser);
      if (!currentUser) {
        navigate("/auth");
        return;
      }
      try {
        await Promise.all([
          fetchProfile(currentUser.id),
          fetchProducts(currentUser.id),
          fetchOrders(currentUser.id),
        ]);
      } catch (err) {
        console.error("Profile load error:", err);
        // ensure we never get stuck on a blank screen
        setProfile((prev) => prev ?? { id: currentUser.id, username: null, rating: 0, total_reviews: 0 });
      }
    };

    // Set up listener FIRST, then check session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadFor(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadFor(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, location, rating, total_reviews, stripe_onboarded, created_at, updated_at, dispatch_name, dispatch_line1, dispatch_line2, dispatch_city, dispatch_postcode, dispatch_country")
        .eq("id", userId)
        .maybeSingle();
      setProfile(data ?? { id: userId, username: null, rating: 0, total_reviews: 0 });
    } catch (err) {
      console.error("fetchProfile error:", err);
      setProfile({ id: userId, username: null, rating: 0, total_reviews: 0 });
    }
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
      toast.success("Product deleted");
    } else {
      toast.error("Could not delete product");
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("id", productId);

    if (!error) {
      setProducts(products.map((p) => 
        p.id === productId ? { ...p, status: newStatus } : p
      ));
      toast.success(newStatus === "active" ? "Product activated" : "Product deactivated");
    } else {
      toast.error("Could not update status");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Active";
      case "inactive": return "Inactive";
      case "sold": return "Sold";
      default: return status;
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
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-hero">
                  <User className="h-12 w-12 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold">{profile.username || "User"}</h1>
                <div className="mb-4 flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span>{(profile.rating ?? 0).toFixed(1)} rating</span>
                  </div>
                  <span>•</span>
                  <span>{profile.total_reviews ?? 0} reviews</span>
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

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="listings">My Listings</TabsTrigger>
              <TabsTrigger value="orders">My Orders</TabsTrigger>
              <TabsTrigger value="coins" className="gap-1">
                <Coins className="h-4 w-4" />
                Velvet Coins
              </TabsTrigger>
              <TabsTrigger value="edit">Edit Profile</TabsTrigger>
              <TabsTrigger value="messages" className="relative">
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
                {unreadCount > 0 && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-accent-orange text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="listings" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Listings</h2>
                <Button onClick={() => navigate("/sell")}>Add New</Button>
              </div>

              {products.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="mb-4 text-muted-foreground">
                    You do not have any listings yet
                  </p>
                  <Button onClick={() => navigate("/sell")}>List Your First Item</Button>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-square bg-muted relative">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            No image
                          </div>
                        )}
                        {product.status !== "active" && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                            <span className="text-lg font-semibold">{getStatusLabel(product.status)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="font-semibold line-clamp-2">{product.title}</h3>
                          <Badge
                            variant={
                              product.status === "active" ? "default" : 
                              product.status === "sold" ? "secondary" : "outline"
                            }
                          >
                            {getStatusLabel(product.status)}
                          </Badge>
                        </div>
                        <p className="mb-3 text-xl font-bold text-primary">
                          £{Number(product.price ?? 0).toFixed(2)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/product/${product.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/edit-product/${product.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {product.status !== "sold" && (
                            <Button
                              variant={product.status === "active" ? "secondary" : "default"}
                              size="sm"
                              onClick={() => toggleProductStatus(product.id, product.status)}
                            >
                              {product.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete product?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The product will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteProduct(product.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
                            {new Date(order.created_at).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            £{Number(order.total_amount ?? 0).toFixed(2)}
                          </p>
                          <Badge>{order.status}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="coins">
              <VelvetCoinSection />
            </TabsContent>

            <TabsContent value="edit" className="space-y-6">
              <ProfileEditForm
                profile={profile}
                onSaved={() => fetchProfile(user.id)}
              />
              <MfaSecurityPanel />
              <StripeConnectSection
                userId={user.id}
                stripeOnboarded={profile.stripe_onboarded}
              />
            </TabsContent>

            <TabsContent value="messages">
              <h2 className="mb-6 text-2xl font-bold">Messages</h2>
              <MessagesSection userId={user.id} initialConversationId={initialConversationId} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;

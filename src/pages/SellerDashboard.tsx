import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Package, Star, Eye, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CouponsManager } from "@/components/CouponsManager";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  activeListings: number;
  averageRating: number;
  totalViews: number;
  soldItems: number;
}

interface TrendData {
  category: string;
  sales: number;
  trend: number;
}

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    activeListings: 0,
    averageRating: 0,
    totalViews: 0,
    soldItems: 0,
  });
  const [trends, setTrends] = useState<TrendData[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access your dashboard",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setUserId(session.user.id);
    fetchDashboardData(session.user.id);
  };

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch products
      const { data: products } = await supabase
        .from("products")
        .select("*, reviews(rating)")
        .eq("seller_id", userId);

      // Fetch orders
      const { data: orders } = await supabase
        .from("order_items")
        .select("*, orders(total_amount, status)")
        .eq("seller_id", userId);

      if (products) {
        const activeListings = products.filter(p => p.status === "active").length;
        const soldItems = products.filter(p => p.status === "sold").length;
        const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
        
        // Calculate average rating
        const allRatings = products.flatMap(p => p.reviews?.map((r: any) => r.rating) || []);
        const averageRating = allRatings.length > 0 
          ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
          : 0;

        setStats(prev => ({
          ...prev,
          activeListings,
          soldItems,
          totalViews,
          averageRating,
        }));
      }

      if (orders) {
        const totalRevenue = orders.reduce((sum, item) => {
          return sum + (Number(item.price) * item.quantity);
        }, 0);
        const totalOrders = new Set(orders.map(o => o.order_id)).size;

        setStats(prev => ({
          ...prev,
          totalRevenue,
          totalOrders,
        }));
      }

      // Generate trend data (mock for now, could be enhanced with real analytics)
      setTrends([
        { category: "Electronics", sales: 45, trend: 12 },
        { category: "Fashion", sales: 38, trend: -5 },
        { category: "Home", sales: 32, trend: 8 },
        { category: "Books", sales: 28, trend: 15 },
        { category: "Sports", sales: 22, trend: 3 },
      ]);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-xl text-muted-foreground">Loading dashboard...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container py-12">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              Seller Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">Track your performance and market insights</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card className="bg-gradient-card shadow-lg hover:shadow-xl transition-all border-primary/20 animate-scale-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">£{stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {stats.totalOrders} orders
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-lg hover:shadow-xl transition-all border-accent/20 animate-scale-in" style={{ animationDelay: '0.05s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
                <Package className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{stats.activeListings}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.soldItems} sold
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-lg hover:shadow-xl transition-all border-primary/20 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                <Star className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Customer satisfaction
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-lg hover:shadow-xl transition-all border-accent/20 animate-scale-in" style={{ animationDelay: '0.15s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.totalViews}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Product impressions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card shadow-lg hover:shadow-xl transition-all border-primary/20 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sold Items</CardTitle>
                <ShoppingBag className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{stats.soldItems}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successfully sold
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="trends" className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1">
              <TabsTrigger value="trends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
                Market Trends
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
                Insights
              </TabsTrigger>
              <TabsTrigger value="coupons" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white">
                Kupony
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trends">
              <Card className="bg-gradient-card shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Category Performance
                  </CardTitle>
                  <CardDescription>
                    Top selling categories and their growth trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trends.map((trend, index) => (
                      <div
                        key={trend.category}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all border border-border/50 animate-scale-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white font-bold shadow-md">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{trend.category}</p>
                            <p className="text-sm text-muted-foreground">{trend.sales} sales this month</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 font-semibold ${trend.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trend.trend >= 0 ? '↑' : '↓'} {Math.abs(trend.trend)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights">
              <Card className="bg-gradient-card shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">AI-Powered Insights</CardTitle>
                  <CardDescription>
                    Recommendations to grow your business
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 animate-scale-in">
                      <h4 className="font-semibold text-lg mb-2 text-primary">📈 Peak Selling Hours</h4>
                      <p className="text-muted-foreground">
                        Most of your sales happen between 6 PM - 9 PM. Consider listing new items during these hours for maximum visibility.
                      </p>
                    </div>
                    <div className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 animate-scale-in" style={{ animationDelay: '0.05s' }}>
                      <h4 className="font-semibold text-lg mb-2 text-accent">💡 Pricing Optimization</h4>
                      <p className="text-muted-foreground">
                        Items priced between £15-£35 have the highest conversion rate in your category. Consider adjusting your pricing strategy.
                      </p>
                    </div>
                    <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 animate-scale-in" style={{ animationDelay: '0.1s' }}>
                      <h4 className="font-semibold text-lg mb-2 text-primary">🎯 Category Opportunity</h4>
                      <p className="text-muted-foreground">
                        Electronics category is trending up 12%. This might be a good time to list tech items.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coupons">
              {userId && <CouponsManager sellerId={userId} />}
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              onClick={() => navigate("/profile")}
              className="shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              View My Listings
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerDashboard;

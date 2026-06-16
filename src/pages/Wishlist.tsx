import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { SeoHead } from "@/components/SeoHead";

const Wishlist = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        navigate("/auth");
        return;
      }
      const { data } = await supabase
        .from("wishlist_items")
        .select("product_id, products(id, title, price, images, condition, status, public_profiles:seller_id(username, rating))")
        .eq("user_id", session.session.user.id);
      setProducts((data ?? []).map((r: any) => r.products).filter(Boolean));
      setLoading(false);
    })();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col">
      <SeoHead title="My wishlist | VelvetBazzar" description="Saved products for later." />
      <Navbar />
      <main className="flex-1">
        <div className="container py-8">
          <h1 className="mb-6 text-3xl font-bold flex items-center gap-2">
            <Heart className="h-7 w-7 text-destructive fill-destructive" /> Wishlist
          </h1>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : products.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="mb-4 text-muted-foreground">You have no saved items yet</p>
              <Button onClick={() => navigate("/products")}>Browse products</Button>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  title={p.title}
                  price={p.price}
                  image={p.images?.[0]}
                  condition={p.condition}
                  seller={{ username: p.public_profiles?.username ?? "—", rating: p.public_profiles?.rating ?? 0 }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;

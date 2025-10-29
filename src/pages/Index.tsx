import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
  profiles: {
    username: string;
    rating: number;
  };
}

const Index = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, title, price, images, condition, profiles(username, rating)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);

    if (data) setFeaturedProducts(data as Product[]);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Hero />
      <main className="flex-1">
        <section className="container py-16">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground">
              Discover amazing deals from trusted sellers
            </p>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 py-20 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-lg text-muted-foreground">
                No products listed yet. Be the first to list an item!
              </p>
              <Button onClick={() => navigate("/sell")}>List Your First Item</Button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    title={product.title}
                    price={product.price}
                    image={product.images[0]}
                    condition={product.condition}
                    seller={{
                      username: product.profiles.username,
                      rating: product.profiles.rating,
                    }}
                  />
                ))}
              </div>
              <div className="mt-12 text-center">
                <Button size="lg" onClick={() => navigate("/products")}>
                  View All Products
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="bg-muted/30 py-16">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                  <Package className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Easy Listing</h3>
                <p className="text-muted-foreground">
                  List your items in minutes with our simple interface
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                  🛡️
                </div>
                <h3 className="mb-2 text-xl font-semibold">Secure Payments</h3>
                <p className="text-muted-foreground">
                  Buy and sell with confidence using secure transactions
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
                  ⭐
                </div>
                <h3 className="mb-2 text-xl font-semibold">Trusted Community</h3>
                <p className="text-muted-foreground">
                  Join thousands of verified buyers and sellers
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;

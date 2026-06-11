import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ChatAssistant } from "@/components/ChatAssistant";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
  public_profiles: {
    username?: string | null;
    rating?: number | null;
  } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    if (data) setCategories(data);
  };

  const fetchFeaturedProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, title, price, images, condition, public_profiles:seller_id(username, rating)")
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
        <CategoryGrid categories={categories} />
        
        <section className="container py-20">
          <div className="mb-16 text-center animate-fade-in">
            <h2 className="mb-4 text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              Featured Products
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover amazing deals from trusted sellers
            </p>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-muted-foreground/25 py-24 text-center bg-gradient-card shadow-lg animate-fade-in">
              <Package className="mx-auto mb-6 h-16 w-16 text-primary drop-shadow-md" />
              <p className="mb-6 text-xl font-semibold text-foreground">
                No products listed yet
              </p>
              <p className="mb-8 text-muted-foreground">
                Be the first to list an item and start selling!
              </p>
              <Button size="lg" onClick={() => navigate("/sell")} className="shadow-lg hover:shadow-xl transition-all">
                List Your First Item
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {featuredProducts.map((product, index) => (
                  <div key={product.id} className="animate-scale-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <ProductCard
                      id={product.id}
                      title={product.title}
                      price={product.price}
                      image={product.images?.[0]}
                      condition={product.condition}
                      seller={{
                        username: product.public_profiles?.username,
                        rating: product.public_profiles?.rating,
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-16 text-center animate-fade-in">
                <Button size="lg" onClick={() => navigate("/products")} className="shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  View All Products
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="relative overflow-hidden bg-gradient-to-br from-muted/40 via-primary/5 to-accent/5 py-24">
          <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5" />
          <div className="container relative">
            <div className="grid gap-12 md:grid-cols-3">
              <div className="text-center group animate-fade-in">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-lg group-hover:shadow-glow transition-all duration-300 group-hover:scale-110">
                  <Package className="h-10 w-10" />
                </div>
                <h3 className="mb-3 text-2xl font-bold group-hover:text-primary transition-colors duration-300">
                  Easy Listing
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  List your items in minutes with our simple and intuitive interface
                </p>
              </div>
              <div className="text-center group animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-hover text-white shadow-lg group-hover:shadow-glow-accent transition-all duration-300 group-hover:scale-110 text-3xl">
                  🛡️
                </div>
                <h3 className="mb-3 text-2xl font-bold group-hover:text-accent transition-colors duration-300">
                  Secure Payments
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Buy and sell with confidence using our secure transaction system
                </p>
              </div>
              <div className="text-center group animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-accent text-white shadow-lg group-hover:shadow-glow-accent transition-all duration-300 group-hover:scale-110 text-3xl">
                  ⭐
                </div>
                <h3 className="mb-3 text-2xl font-bold group-hover:text-accent transition-colors duration-300">
                  Trusted Community
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Join thousands of verified buyers and sellers worldwide
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ChatAssistant userType="general" />
    </div>
  );
};

export default Index;

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom";

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [searchParams]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("id, title, price, images, condition, profiles(username, rating)")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    const search = searchParams.get("search");
    const category = searchParams.get("category");

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    if (category) {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .single();
      
      if (categoryData) {
        query = query.eq("category_id", categoryData.id);
        setSelectedCategory(category);
      }
    }

    const { data } = await query;
    if (data) setProducts(data as Product[]);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="mb-4 text-3xl font-bold">Browse Products</h1>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => {
                  setSelectedCategory(null);
                  window.location.href = "/products";
                }}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.slug ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory(category.slug);
                    window.location.href = `/products?category=${category.slug}`;
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Products;

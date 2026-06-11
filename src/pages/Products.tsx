import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { ChatAssistant } from "@/components/ChatAssistant";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SeoHead } from "@/components/SeoHead";

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
}

type SortOption = "newest" | "price_asc" | "price_desc";

const PAGE_SIZE = 12;

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [conditionFilter, setConditionFilter] = useState<string>("all");

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset and fetch when search/category/sort changes
    setProducts([]);
    setPage(0);
    setHasMore(true);
    fetchProducts(0, true);
  }, [searchParams, sortBy, /* filters */ priceMin, priceMax, conditionFilter]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    if (data) setCategories(data);
  };

  const buildQuery = useCallback(
    (offset: number) => {
      let query = supabase
        .from("products")
        .select("id, title, price, images, condition, public_profiles:seller_id(username, rating)")
        .eq("status", "active");

      const search = searchParams.get("search");
      const category = searchParams.get("category");

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      const minP = parseFloat(priceMin);
      const maxP = parseFloat(priceMax);
      if (!isNaN(minP)) query = query.gte("price", minP);
      if (!isNaN(maxP)) query = query.lte("price", maxP);
      if (conditionFilter !== "all") query = query.eq("condition", conditionFilter);

      // Sort
      if (sortBy === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price_desc") {
        query = query.order("price", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      query = query.range(offset, offset + PAGE_SIZE - 1);

      return { query, category };
    },
    [searchParams, sortBy, priceMin, priceMax, conditionFilter]
  );

  const fetchProducts = async (pageNum: number, reset: boolean) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const offset = pageNum * PAGE_SIZE;
    const { query, category } = buildQuery(offset);

    let finalQuery = query;

    if (category) {
      const { data: categoryData } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .single();

      if (categoryData) {
        finalQuery = finalQuery.eq("category_id", categoryData.id);
        setSelectedCategory(category);
      }
    } else {
      setSelectedCategory(searchParams.get("category"));
    }

    const { data } = await finalQuery;

    if (data) {
      const typed = data as Product[];
      if (reset) {
        setProducts(typed);
      } else {
        setProducts((prev) => [...prev, ...typed]);
      }
      setHasMore(typed.length === PAGE_SIZE);
      setPage(pageNum);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  const handleLoadMore = () => {
    fetchProducts(page + 1, false);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SeoHead
        title="Przeglądaj produkty | VelvetBazzar UK"
        description="Tysiące unikalnych produktów: moda, vintage, handmade i więcej. Bezpieczne zakupy w UK."
      />
      <Navbar />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8">
            <h1 className="mb-6 text-3xl font-bold">Browse by Category</h1>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                className="h-auto flex-col gap-2 py-4"
                onClick={() => {
                  setSelectedCategory(null);
                  window.location.href = "/products";
                }}
              >
                <span className="text-2xl">🛍️</span>
                <span>All Products</span>
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.slug ? "default" : "outline"}
                  className="h-auto flex-col gap-2 py-4"
                  onClick={() => {
                    setSelectedCategory(category.slug);
                    window.location.href = `/products?category=${category.slug}`;
                  }}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Filters + Sort */}
          <div className="mb-6 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <p className="text-xs text-muted-foreground mb-1">Cena (£)</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Stan</p>
              <Select value={conditionFilter} onValueChange={setConditionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="new">Nowy</SelectItem>
                  <SelectItem value="like_new">Jak nowy</SelectItem>
                  <SelectItem value="good">Dobry</SelectItem>
                  <SelectItem value="fair">Akceptowalny</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sortuj</p>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Najnowsze</SelectItem>
                  <SelectItem value="price_asc">Cena: rosnąco</SelectItem>
                  <SelectItem value="price_desc">Cena: malejąco</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {!loading && `${products.length} produkt${products.length !== 1 ? "ów" : ""}`}
          </p>

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
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
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
                ))}
              </div>

              {hasMore && (
                <div className="mt-10 text-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="min-w-[200px]"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ładowanie...
                      </>
                    ) : (
                      "Załaduj więcej"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <ChatAssistant userType="buyer" />
    </div>
  );
};

export default Products;

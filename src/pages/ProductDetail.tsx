import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReviewSection } from "@/components/ReviewSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Star, ShoppingCart, User, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useMessages } from "@/hooks/useMessages";
import { ReportButton } from "@/components/ReportButton";
import { SeoHead } from "@/components/SeoHead";
import { WishlistButton } from "@/components/WishlistButton";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactingLoading, setContactingLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { startConversation } = useMessages(user?.id);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from("products")
      .select(`
        *,
        profiles:seller_id (username, rating, total_reviews),
        categories (name)
      `)
      .eq("id", id)
      .single();

    if (data) {
      setProduct(data);
      await supabase
        .from("products")
        .update({ views: (data.views || 0) + 1 })
        .eq("id", id);
    }
    setLoading(false);
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please sign in to add items to cart");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: id,
        quantity: 1,
      });

      if (error) throw error;
      toast.success("Added to cart!");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Item already in cart");
      } else {
        toast.error("Failed to add to cart");
      }
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      toast.error("Zaloguj się, aby skontaktować się ze sprzedawcą");
      navigate("/auth");
      return;
    }

    if (user.id === product.seller_id) {
      toast.error("Nie możesz napisać do siebie");
      return;
    }

    setContactingLoading(true);
    try {
      const conversationId = await startConversation(product.seller_id, id);
      if (conversationId) {
        navigate(`/profile?tab=messages&conversation=${conversationId}`);
        toast.success("Rozmowa rozpoczęta!");
      }
    } finally {
      setContactingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">Product not found</div>
        </div>
        <Footer />
      </div>
    );
  }

  const seoTitle = `${product.title} - £${Number(product.price).toFixed(2)} | VelvetBazzar`;
  const seoDesc = (product.description || product.title).slice(0, 160);
  const productImage = product.images?.[0];

  return (
    <div className="flex min-h-screen flex-col">
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        image={productImage}
        jsonLd={{
          "@context": "https://schema.org/",
          "@type": "Product",
          name: product.title,
          description: product.description,
          image: product.images || [],
          offers: {
            "@type": "Offer",
            priceCurrency: "GBP",
            price: Number(product.price).toFixed(2),
            availability:
              product.status === "active"
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
          aggregateRating: product.profiles?.total_reviews
            ? {
                "@type": "AggregateRating",
                ratingValue: Number(product.profiles.rating).toFixed(1),
                reviewCount: product.profiles.total_reviews,
              }
            : undefined,
        }}
      />
      <Navbar />
      <main className="flex-1">
        <div className="container py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                {product.images && product.images[selectedImageIndex] ? (
                  <img
                    src={product.images[selectedImageIndex]}
                    alt={`${product.title} - image ${selectedImageIndex + 1}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    No Image
                  </div>
                )}
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev: number) => (prev - 1 + product.images.length) % product.images.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev: number) => (prev + 1) % product.images.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                        idx === selectedImageIndex
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="mb-2 text-3xl font-bold">{product.title}</h1>
                {product.categories && (
                  <Badge variant="secondary">{product.categories.name}</Badge>
                )}
              </div>

              <div className="text-4xl font-bold text-primary">
                £{product.price.toFixed(2)}
              </div>

              {product.condition && (
                <div>
                  <span className="text-sm text-muted-foreground">Condition: </span>
                  <Badge variant="outline">{product.condition}</Badge>
                </div>
              )}

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{product.profiles.username}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        <span>{product.profiles.rating.toFixed(1)}</span>
                      </div>
                      <span>•</span>
                      <span>{product.profiles.total_reviews} reviews</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </Card>

              <div>
                <h2 className="mb-2 text-lg font-semibold">Description</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              <div className="flex gap-4">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                  disabled={product.status !== "active"}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={handleContactSeller}
                  disabled={contactingLoading || product.seller_id === user?.id}
                >
                  <MessageCircle className="h-5 w-5" />
                  {contactingLoading ? "Łączenie..." : "Napisz do sprzedawcy"}
                </Button>
              </div>

              {user && product.seller_id !== user.id && (
                <div className="pt-2">
                  <ReportButton targetType="product" targetId={product.id} variant="ghost" size="sm" />
                </div>
              )}

              {product.status === "sold" && (
                <div className="rounded-lg bg-destructive/10 p-4 text-center text-destructive">
                  This item has been sold
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="container py-12">
          <ReviewSection productId={id!} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;

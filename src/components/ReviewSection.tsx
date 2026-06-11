import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  public_profiles: {
    username: string;
    avatar_url: string;
  };
}

interface ReviewSectionProps {
  productId: string;
}

export const ReviewSection = ({ productId }: ReviewSectionProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkUser();
  }, [productId]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const u = session?.user || null;
    setUser(u);
    if (!u) return;

    // Already reviewed?
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("reviewer_id", u.id)
      .maybeSingle();
    if (existing) {
      setAlreadyReviewed(true);
      return;
    }

    // Eligible to review? (delivered or completed order containing this product)
    const { data: items } = await supabase
      .from("order_items")
      .select("order_id, orders!inner(buyer_id, status)")
      .eq("product_id", productId)
      .eq("orders.buyer_id", u.id)
      .in("orders.status", ["delivered", "completed"])
      .limit(1);
    setCanReview((items?.length ?? 0) > 0);
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          comment,
          created_at,
          public_profiles(username, avatar_url)
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to leave a review",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please write a comment with your review",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        reviewer_id: user.id,
        rating,
        comment: comment.trim(),
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your review has been posted",
      });

      setComment("");
      setRating(5);
      setAlreadyReviewed(true);
      fetchReviews();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="bg-gradient-card shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-2xl">Customer Reviews</span>
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 fill-amber-500 text-amber-500" />
              <span className="text-2xl font-bold text-amber-500">
                {averageRating > 0 ? averageRating.toFixed(1) : "No ratings yet"}
              </span>
              <span className="text-muted-foreground text-sm">({reviews.length})</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user && alreadyReviewed && (
            <div className="mb-6 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              You have already reviewed this product. Thank you!
            </div>
          )}
          {user && !alreadyReviewed && !canReview && (
            <div className="mb-6 p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              Only buyers who received this product can leave a review.
            </div>
          )}
          {user && canReview && !alreadyReviewed && (
            <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
              <h3 className="font-semibold text-lg mb-4">Leave a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-all hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= rating
                              ? "fill-amber-500 text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Comment</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={handleSubmitReview} 
                  disabled={submitting}
                  className="w-full shadow-lg hover:shadow-xl transition-all"
                >
                  {submitting ? "Posting..." : "Post Review"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg">No reviews yet. Be the first to review this product!</p>
              </div>
            ) : (
              reviews.map((review, index) => (
                <Card 
                  key={review.id} 
                  className="bg-muted/30 hover:bg-muted/50 transition-all border-border/50 animate-scale-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={review.public_profiles.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                          {review.public_profiles.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold">{review.public_profiles.username}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('en-GB', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-amber-500 text-amber-500"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

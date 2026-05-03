import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { WishlistButton } from "@/components/WishlistButton";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image?: string;
  condition?: string;
  seller: {
    username?: string | null;
    rating?: number | string | null;
  };
}

export const ProductCard = ({
  id,
  title,
  price,
  image,
  condition,
  seller,
}: ProductCardProps) => {
  const safePrice = Number(price) || 0;
  const safeRating = Number(seller?.rating) || 0;
  const sellerName = seller?.username || "Sprzedawca";

  return (
    <Link to={`/product/${id}`} className="group">
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50 hover:border-primary/30 bg-gradient-card">
        <div className="aspect-square overflow-hidden bg-muted relative">
          {image ? (
            <>
              <img
                src={image}
                alt={title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-card text-muted-foreground">
              No Image
            </div>
          )}
          <WishlistButton productId={id} className="absolute top-3 left-3 h-9 w-9" />
          {condition && (
            <Badge variant="secondary" className="absolute top-3 right-3 shadow-lg backdrop-blur-sm bg-background/90">
              {condition}
            </Badge>
          )}
        </div>
        <div className="p-5">
          <h3 className="mb-3 line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
            {title}
          </h3>
          <div className="mb-4 text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            £{safePrice.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border/50 pt-3">
            <span className="font-medium">{sellerName}</span>
            <div className="flex items-center gap-1.5 bg-accent/10 px-2 py-1 rounded-full">
              <Star className="h-3.5 w-3.5 fill-accent text-accent drop-shadow-sm" />
              <span className="font-semibold text-accent-foreground">{safeRating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

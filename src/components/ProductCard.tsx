import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image?: string;
  condition?: string;
  seller: {
    username: string;
    rating: number;
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
  return (
    <Link to={`/product/${id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="aspect-square overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-card text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <h3 className="line-clamp-2 text-base font-semibold text-foreground">
              {title}
            </h3>
            {condition && (
              <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                {condition}
              </Badge>
            )}
          </div>
          <div className="mb-3 text-2xl font-bold text-primary">
            ${price.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{seller.username}</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span>{seller.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

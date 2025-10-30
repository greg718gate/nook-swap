import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

interface CategoryGridProps {
  categories: Category[];
}

export const CategoryGrid = ({ categories }: CategoryGridProps) => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container">
        <h2 className="mb-4 text-center text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Shop by Category
        </h2>
        <p className="mb-12 text-center text-muted-foreground text-lg">
          Explore our diverse collection
        </p>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Button
              key={category.id}
              variant="outline"
              className="group h-auto flex-col gap-4 py-8 hover:border-primary hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => navigate(`/products?category=${category.slug}`)}
            >
              <span className="text-5xl transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">
                {category.icon}
              </span>
              <div className="text-center">
                <div className="font-semibold text-lg group-hover:text-primary transition-colors duration-300">
                  {category.name}
                </div>
                {category.description && (
                  <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {category.description}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
};

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
    <section className="py-16">
      <div className="container">
        <h2 className="mb-8 text-center text-3xl font-bold">Shop by Category</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              className="h-auto flex-col gap-3 py-6 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate(`/products?category=${category.slug}`)}
            >
              <span className="text-4xl">{category.icon}</span>
              <div className="text-center">
                <div className="font-semibold">{category.name}</div>
                {category.description && (
                  <div className="mt-1 text-xs text-muted-foreground">
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

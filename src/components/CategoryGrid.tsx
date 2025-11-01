import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import electronicsImg from "@/assets/category-electronics.jpg";
import fashionImg from "@/assets/category-fashion.jpg";
import homeImg from "@/assets/category-home.jpg";
import sportsImg from "@/assets/category-sports.jpg";
import booksImg from "@/assets/category-books.jpg";
import toysImg from "@/assets/category-toys.jpg";

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

const categoryImages: Record<string, string> = {
  electronics: electronicsImg,
  fashion: fashionImg,
  home: homeImg,
  sports: sportsImg,
  books: booksImg,
  toys: toysImg,
};

export const CategoryGrid = ({ categories }: CategoryGridProps) => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover amazing products across all categories
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => navigate(`/products?category=${category.slug}`)}
              className="group relative overflow-hidden rounded-2xl bg-gradient-card hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 border border-border/50 hover:border-primary/50"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="aspect-square overflow-hidden relative">
                {categoryImages[category.slug] ? (
                  <>
                    <img
                      src={categoryImages[category.slug]}
                      alt={category.name}
                      className="h-full w-full object-cover transition-all duration-500 group-hover:scale-125 group-hover:rotate-3"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                  </>
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center transform transition-all duration-300 group-hover:scale-110">
                    {category.icon && (
                      <span className="text-5xl mb-2 block drop-shadow-lg filter group-hover:drop-shadow-2xl transition-all duration-300">
                        {category.icon}
                      </span>
                    )}
                    <span className="text-white font-bold text-lg drop-shadow-lg px-4">
                      {category.name}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

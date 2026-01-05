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

// Gradient backgrounds for categories without images
const categoryGradients: Record<string, string> = {
  "womens-clothing": "from-pink-400 to-rose-500",
  "mens-clothing": "from-blue-400 to-indigo-500",
  "shoes-bags": "from-amber-400 to-orange-500",
  "accessories-jewellery": "from-purple-400 to-fuchsia-500",
  "beauty-health": "from-rose-300 to-pink-500",
  "home-garden": "from-green-400 to-emerald-500",
  "kids-baby": "from-yellow-300 to-amber-400",
  "electronics-tech": "from-slate-400 to-gray-600",
  "handmade-crafts": "from-orange-300 to-red-400",
  "sports-outdoors": "from-teal-400 to-cyan-500",
  "books-media-hobbies": "from-indigo-400 to-violet-500",
  "other": "from-gray-400 to-slate-500",
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => navigate(`/products?category=${category.slug}`)}
              className="group relative overflow-hidden rounded-2xl bg-gradient-card hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 border border-border/50 hover:border-primary/50"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="aspect-square overflow-hidden relative">
                <div className={`h-full w-full bg-gradient-to-br ${categoryGradients[category.slug] || "from-primary/20 to-accent/20"}`} />
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

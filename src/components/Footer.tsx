import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="relative border-t border-border/50 bg-gradient-to-br from-muted/30 via-background to-muted/20 backdrop-blur-sm">
      <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-5" />
      <div className="container py-16 relative">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 group">
              <div className="h-10 w-10 rounded-xl bg-gradient-hero shadow-md group-hover:shadow-glow transition-all duration-300" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">MarketHub</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your trusted marketplace for buying and selling with confidence.
            </p>
          </div>
          <div>
            <h3 className="mb-6 text-lg font-bold text-foreground">Shop</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/products" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Browse Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=electronics" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/products?category=fashion" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Fashion
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-6 text-lg font-bold text-foreground">Sell</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/sell" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  List an Item
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  My Listings
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-6 text-lg font-bold text-foreground">Support</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Safety Tips
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors duration-200 hover:translate-x-1 inline-block">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-border/50 pt-8 text-center">
          <p className="text-sm text-muted-foreground">&copy; 2025 <span className="font-semibold text-foreground">MarketHub</span>. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

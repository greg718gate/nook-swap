import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-hero" />
              <span className="text-xl font-bold">MarketHub</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted marketplace for buying and selling with confidence.
            </p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products" className="text-muted-foreground hover:text-foreground">
                  Browse Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=electronics" className="text-muted-foreground hover:text-foreground">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/products?category=fashion" className="text-muted-foreground hover:text-foreground">
                  Fashion
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Sell</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/sell" className="text-muted-foreground hover:text-foreground">
                  List an Item
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-muted-foreground hover:text-foreground">
                  My Listings
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Safety Tips
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 MarketHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Truck, Package, MapPin } from "lucide-react";

const Shipping = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Navbar />
      <main className="container max-w-4xl py-16">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-hero p-4 shadow-glow">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Shipping & Delivery
          </h1>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              UK Delivery Options
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Sellers set their own shipping prices in pounds (£). Buyers choose a carrier at checkout.
              All prices below are typical UK rates — actual cost is shown on each listing.
            </p>

            <div className="space-y-6">
              <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Evri</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Parcel up to 2kg (small):</span>
                    <span className="font-semibold text-foreground">from £2.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcel up to 5kg (medium):</span>
                    <span className="font-semibold text-foreground">from £4.49</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcel up to 10kg (large):</span>
                    <span className="font-semibold text-foreground">from £6.99</span>
                  </div>
                  <p className="text-sm mt-4 pt-4 border-t border-border/30">
                    Delivery: 2–4 working days across the UK
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Royal Mail</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Parcel up to 1kg (small):</span>
                    <span className="font-semibold text-foreground">from £3.49</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcel up to 5kg (medium):</span>
                    <span className="font-semibold text-foreground">from £5.49</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcel up to 10kg (large):</span>
                    <span className="font-semibold text-foreground">from £7.99</span>
                  </div>
                  <p className="text-sm mt-4 pt-4 border-t border-border/30">
                    Delivery: 1–3 working days | Tracked delivery available
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-primary/5 to-muted/5 border border-primary/20 p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">InPost Lockers</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Small parcel (locker):</span>
                    <span className="font-semibold text-foreground">from £2.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medium parcel (locker):</span>
                    <span className="font-semibold text-foreground">from £3.99</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Large parcel (locker):</span>
                    <span className="font-semibold text-foreground">from £5.49</span>
                  </div>
                  <p className="text-sm mt-4 pt-4 border-t border-border/30">
                    Delivery: 1–2 working days | Collect 24/7 from InPost lockers across the UK
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              Shipping Rules
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Sellers must dispatch within 3 working days of payment</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Shipping cost is always shown before you pay</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Buyers receive a tracking number when the seller provides one</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Items must be securely packaged by the seller</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Report damage within 48 hours of delivery</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 p-8 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-foreground">Free Shipping</h2>
            <p className="text-muted-foreground leading-relaxed">
              Some sellers offer free shipping. If available, it will be shown on the product listing.
            </p>
          </div>

          <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-foreground">Track Your Parcel</h2>
            <p className="text-muted-foreground leading-relaxed">
              Once dispatched, the seller should share a tracking number. You can find it in your order
              details under Profile → My Orders.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shipping;

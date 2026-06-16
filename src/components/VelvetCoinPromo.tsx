import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, Gift, Share2, TrendingDown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const VelvetCoinPromo = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Coins className="h-4 w-4" />
              Velvet Coins (VC)
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Earn rewards. Pay less when you sell.
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Velvet Coins are our platform-only reward currency — not crypto, not cash.
              Collect VC when you join, sell, or refer friends, then use them to lower your
              selling fee from 5% down to as little as 2.5%.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/80 p-4">
                <Gift className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">25 VC on signup</p>
                  <p className="text-xs text-muted-foreground">Welcome bonus for new members</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/80 p-4">
                <TrendingDown className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">100 VC = −1% fee</p>
                  <p className="text-xs text-muted-foreground">Max 250 VC per sale (2.5% fee)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/80 p-4">
                <Coins className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">100 VC first sale</p>
                  <p className="text-xs text-muted-foreground">Bonus when you complete a sale</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/80 p-4">
                <Share2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Refer friends</p>
                  <p className="text-xs text-muted-foreground">50 VC signup + 75 VC their first sale</p>
                </div>
              </div>
            </div>
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
              Start earning VC
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <Card className="p-8 bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/20 shadow-xl animate-fade-in">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-hero shadow-glow">
                <Coins className="h-10 w-10 text-white" />
              </div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                Example seller saving
              </p>
              <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                <span className="text-muted-foreground line-through">5%</span>
                <ArrowRight className="h-5 w-5 text-primary" />
                <span className="text-primary">3% fee</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Redeem 200 Velvet Coins on your next sale and keep more of what you earn.
              </p>
              <Button variant="outline" onClick={() => navigate("/terms")} className="w-full">
                Read full Velvet Coin rules
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

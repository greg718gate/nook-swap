import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden py-32 text-white">
      {/* Hero background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-accent/80 backdrop-blur-sm" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-white/20 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-accent/30 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary-glow/20 blur-3xl animate-pulse" />
      
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-block rounded-full bg-white/20 px-6 py-2 backdrop-blur-md animate-fade-in">
            <span className="text-sm font-semibold">🎉 Join 10,000+ Happy Users</span>
          </div>
          <h1 className="mb-6 text-6xl font-extrabold leading-tight md:text-8xl animate-fade-in drop-shadow-2xl" style={{ animationDelay: '0.1s' }}>
            Buy & Sell with{" "}
            <span className="bg-gradient-to-r from-white via-accent-foreground to-white bg-clip-text text-transparent animate-shimmer">
              Confidence
            </span>
          </h1>
          <p className="mb-12 text-xl md:text-2xl text-white/95 animate-fade-in drop-shadow-lg leading-relaxed" style={{ animationDelay: '0.2s' }}>
            Join thousands of buyers and sellers in the most trusted marketplace.
            <br className="hidden md:block" />
            Find great deals or turn your items into cash today.
          </p>
          <div className="flex flex-col items-center justify-center gap-5 sm:flex-row animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button
              size="lg"
              onClick={() => navigate("/products")}
              className="group w-full sm:w-auto text-lg px-10 py-7 bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-glow hover:scale-110 transition-all duration-300 font-bold"
            >
              <span className="relative flex items-center gap-2">
                🛍️ Start Shopping
              </span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/sell")}
              className="group w-full text-lg px-10 py-7 border-3 border-white/90 bg-white/10 text-white hover:bg-white hover:text-primary sm:w-auto backdrop-blur-md shadow-2xl hover:shadow-glow hover:scale-110 transition-all duration-300 font-bold"
            >
              <span className="relative flex items-center gap-2">
                💰 Start Selling
              </span>
            </Button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2 text-white/90">
              <span className="text-2xl">✓</span>
              <span className="font-medium">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <span className="text-2xl">✓</span>
              <span className="font-medium">Fast Shipping</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <span className="text-2xl">✓</span>
              <span className="font-medium">24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full drop-shadow-lg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="hsl(var(--background))"
        >
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" />
        </svg>
      </div>
    </section>
  );
};

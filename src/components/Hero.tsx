import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-hero py-24 text-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-hero-overlay" />
      <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10" />
      
      {/* Floating circles */}
      <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-white/5 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary-glow/10 blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-7xl animate-fade-in drop-shadow-lg">
            Buy & Sell with <span className="bg-gradient-to-r from-white to-primary-glow bg-clip-text text-transparent">Confidence</span>
          </h1>
          <p className="mb-10 text-xl text-white/95 animate-fade-in drop-shadow-md" style={{ animationDelay: '0.1s' }}>
            Join thousands of buyers and sellers in the most trusted marketplace.
            Find great deals or turn your items into cash today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/products")}
              className="group w-full sm:w-auto shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <span className="relative">
                Start Shopping
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/sell")}
              className="group w-full border-2 border-white/80 bg-white/10 text-white hover:bg-white hover:text-primary sm:w-auto backdrop-blur-sm shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              <span className="relative">
                Start Selling
              </span>
            </Button>
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

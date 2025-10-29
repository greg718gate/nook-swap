import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-hero py-20 text-white">
      <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10" />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
            Buy & Sell with Confidence
          </h1>
          <p className="mb-8 text-xl text-white/90">
            Join thousands of buyers and sellers in the most trusted marketplace.
            Find great deals or turn your items into cash today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/products")}
              className="w-full sm:w-auto"
            >
              Start Shopping
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/sell")}
              className="w-full border-2 border-white bg-white/10 text-white hover:bg-white hover:text-primary sm:w-auto"
            >
              Start Selling
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          className="w-full"
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

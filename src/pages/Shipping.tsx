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
            Wysyłka i Dostawa
          </h1>
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              Dostępne Metody Wysyłki
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Każdy sprzedający może wybrać preferowane metody wysyłki. Dostępne opcje i przykładowe ceny:
            </p>

            <div className="space-y-6">
              <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Evri</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Paczka do 2kg (mała):</span>
                    <span className="font-semibold text-foreground">od 9,99 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paczka do 5kg (średnia):</span>
                    <span className="font-semibold text-foreground">od 14,99 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paczka do 10kg (duża):</span>
                    <span className="font-semibold text-foreground">od 19,99 zł</span>
                  </div>
                  <p className="text-sm mt-4 pt-4 border-t border-border/30">
                    Czas dostawy: 2-4 dni robocze
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">Royal Mail</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Paczka do 1kg (mała):</span>
                    <span className="font-semibold text-foreground">od 11,99 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paczka do 5kg (średnia):</span>
                    <span className="font-semibold text-foreground">od 16,99 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paczka do 10kg (duża):</span>
                    <span className="font-semibold text-foreground">od 22,99 zł</span>
                  </div>
                  <p className="text-sm mt-4 pt-4 border-t border-border/30">
                    Czas dostawy: 1-3 dni robocze | Możliwość śledzenia przesyłki
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-primary/5 to-muted/5 border border-primary/20 p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">InPost Paczkomaty</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Paczka mała (8x38x64 cm):</span>
                    <span className="font-semibold text-foreground">od 10,99 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paczka średnia (19x38x64 cm):</span>
                    <span className="font-semibold text-foreground">od 13,99 zł</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paczka duża (41x38x64 cm):</span>
                    <span className="font-semibold text-foreground">od 16,99 zł</span>
                  </div>
                  <p className="text-sm mt-4 pt-4 border-t border-border/30">
                    Czas dostawy: 1-2 dni robocze | Odbiór 24/7 z paczkomatu
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-foreground flex items-center gap-3">
              <MapPin className="h-6 w-6 text-primary" />
              Zasady Wysyłki
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Sprzedający wysyła produkt w ciągu 3 dni roboczych od otrzymania płatności</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Koszt wysyłki jest zawsze widoczny przed finalizacją zakupu</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Kupujący otrzymuje numer śledzenia przesyłki (jeśli dostępny)</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>Produkt powinien być bezpiecznie zapakowany przez sprzedającego</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <p>W przypadku uszkodzenia przesyłki, należy zgłosić to w ciągu 48 godzin</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 p-8 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-foreground">Darmowa Wysyłka</h2>
            <p className="text-muted-foreground leading-relaxed">
              Niektórzy sprzedający oferują darmową wysyłkę dla wybranych produktów. Informacja o darmowej wysyłce 
              jest zawsze widoczna w ogłoszeniu produktu.
            </p>
          </div>

          <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-foreground">Śledzenie Przesyłki</h2>
            <p className="text-muted-foreground leading-relaxed">
              Po wysłaniu produktu, sprzedający powinien przekazać numer śledzenia przesyłki. Możesz go znaleźć 
              w szczegółach swojego zamówienia w profilu.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shipping;

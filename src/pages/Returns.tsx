import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RotateCcw } from "lucide-react";

const Returns = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Navbar />
      <main className="container max-w-4xl py-16">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-hero p-4 shadow-glow">
            <RotateCcw className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Zwroty i Reklamacje
          </h1>
        </div>

        <div className="space-y-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Prawo do Zwrotu</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Zgodnie z prawem konsumenckim, kupujący ma prawo do zwrotu produktu w ciągu <strong className="text-foreground">14 dni</strong> od 
              daty otrzymania przesyłki, bez podania przyczyny.
            </p>
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 space-y-3">
              <h3 className="font-bold text-foreground">Warunki zwrotu:</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Produkt nie był używany</li>
                <li>Zachowano oryginalne opakowanie (jeśli było)</li>
                <li>Produkt jest kompletny</li>
                <li>Kupujący pokrywa koszt zwrotu</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Reklamacje</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Jeśli otrzymany produkt jest:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
              <li>Niezgodny z opisem</li>
              <li>Uszkodzony podczas transportu</li>
              <li>Wadliwy lub niedziałający</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Możesz złożyć reklamację w ciągu <strong className="text-foreground">48 godzin</strong> od otrzymania przesyłki.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Jak Zgłosić Zwrot lub Reklamację?</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-primary/20 w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Skontaktuj się ze sprzedającym</h4>
                  <p className="text-muted-foreground text-sm">
                    Najpierw spróbuj rozwiązać problem bezpośrednio ze sprzedającym przez wiadomości na platformie
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-primary/20 w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Udokumentuj problem</h4>
                  <p className="text-muted-foreground text-sm">
                    Zrób zdjęcia produktu, opakowania i ewentualnych uszkodzeń
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-primary/20 w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Złóż zgłoszenie</h4>
                  <p className="text-muted-foreground text-sm">
                    Jeśli nie dojdziesz do porozumienia ze sprzedającym, skontaktuj się z naszym wsparciem
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-primary/20 w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Oczekuj na decyzję</h4>
                  <p className="text-muted-foreground text-sm">
                    Rozpatrzymy zgłoszenie w ciągu 3-5 dni roboczych
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Zwrot Pieniędzy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Po zaakceptowaniu zwrotu lub reklamacji:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Sprzedający przekazuje adres do zwrotu produktu</li>
              <li>Kupujący odsyła produkt (lub zatrzymuje w przypadku uzasadnionej reklamacji)</li>
              <li>Po otrzymaniu zwrotu, sprzedający zwraca pieniądze w ciągu 7 dni</li>
              <li>Pieniądze wracają na pierwotną metodę płatności</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Wyjątki od Zwrotów</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Prawo do zwrotu nie przysługuje w przypadku:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Produktów wykonanych na zamówienie lub spersonalizowanych</li>
              <li>Produktów podlegających szybkiemu zepsuciu</li>
              <li>Produktów w zapieczętowanym opakowaniu, które zostało otwarte (np. oprogramowanie)</li>
              <li>Treści cyfrowych dostarczonych online</li>
            </ul>
          </section>

          <section className="rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/30 p-6">
            <h2 className="mb-3 text-xl font-bold text-foreground">Potrzebujesz pomocy?</h2>
            <p className="text-muted-foreground">
              Skontaktuj się z naszym zespołem wsparcia: <span className="text-foreground font-semibold">support@velvetbazzar.co.uk</span>
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8 pt-4 border-t border-border/50">
            Ostatnia aktualizacja: 01.01.2025
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Returns;

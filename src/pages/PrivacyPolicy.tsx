import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Navbar />
      <main className="container max-w-4xl py-16">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-hero p-4 shadow-glow">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Polityka Prywatności
          </h1>
        </div>

        <div className="space-y-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">1. Informacje Ogólne</h2>
            <p className="text-muted-foreground leading-relaxed">
              MarketHub zobowiązuje się do ochrony prywatności użytkowników. Niniejsza polityka prywatności wyjaśnia, 
              jakie dane zbieramy, w jaki sposób je wykorzystujemy i jakie prawa przysługują użytkownikom.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">2. Zbierane Dane</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Zbieramy następujące kategorie danych osobowych:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Dane rejestracyjne (nazwa użytkownika, adres email)</li>
              <li>Dane profilowe (zdjęcie, biografia, lokalizacja)</li>
              <li>Dane transakcyjne (historia zakupów i sprzedaży)</li>
              <li>Dane o produktach wystawionych na sprzedaż</li>
              <li>Dane komunikacyjne (wiadomości, recenzje)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">3. Cel Przetwarzania Danych</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Dane osobowe przetwarzamy w celu:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Świadczenia usług marketplace</li>
              <li>Realizacji transakcji kupna-sprzedaży</li>
              <li>Komunikacji między użytkownikami</li>
              <li>Zapewnienia bezpieczeństwa platformy</li>
              <li>Doskonalenia naszych usług</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">4. Udostępnianie Danych</h2>
            <p className="text-muted-foreground leading-relaxed">
              Dane osobowe mogą być udostępniane innym użytkownikom platformy w zakresie niezbędnym do realizacji 
              transakcji (np. adres wysyłki). Nie sprzedajemy danych osobowych osobom trzecim.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">5. Prawa Użytkownika</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Zgodnie z RODO, użytkownik ma prawo do:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Dostępu do swoich danych osobowych</li>
              <li>Sprostowania danych</li>
              <li>Usunięcia danych ("prawo do bycia zapomnianym")</li>
              <li>Ograniczenia przetwarzania</li>
              <li>Przenoszenia danych</li>
              <li>Wniesienia sprzeciwu wobec przetwarzania</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">6. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Używamy plików cookie do poprawy funkcjonalności strony i analizy ruchu. Użytkownik może zarządzać 
              ustawieniami cookies w swojej przeglądarce.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">7. Bezpieczeństwo</h2>
            <p className="text-muted-foreground leading-relaxed">
              Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony danych osobowych przed 
              nieuprawnionym dostępem, utratą lub zniszczeniem.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">8. Kontakt</h2>
            <p className="text-muted-foreground leading-relaxed">
              W sprawach dotyczących ochrony danych osobowych prosimy o kontakt: privacy@markethub.pl
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

export default PrivacyPolicy;

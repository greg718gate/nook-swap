import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Navbar />
      <main className="container max-w-4xl py-16">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-hero p-4 shadow-glow">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Regulamin
          </h1>
        </div>

        <div className="space-y-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">1. Postanowienia Ogólne</h2>
            <p className="text-muted-foreground leading-relaxed">
              Niniejszy regulamin określa zasady korzystania z platformy MarketHub, warunki zawierania umów 
              kupna-sprzedaży oraz prawa i obowiązki użytkowników.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">2. Definicje</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li><strong className="text-foreground">Platforma</strong> - serwis internetowy MarketHub</li>
              <li><strong className="text-foreground">Użytkownik</strong> - osoba korzystająca z platformy</li>
              <li><strong className="text-foreground">Sprzedający</strong> - użytkownik wystawiający produkty na sprzedaż</li>
              <li><strong className="text-foreground">Kupujący</strong> - użytkownik dokonujący zakupu</li>
              <li><strong className="text-foreground">Produkt</strong> - przedmiot wystawiony na sprzedaż</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">3. Rejestracja Konta</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Aby korzystać z pełnej funkcjonalności platformy, użytkownik musi:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Ukończyć 18 lat lub posiadać zgodę opiekuna prawnego</li>
              <li>Podać prawdziwe dane podczas rejestracji</li>
              <li>Zabezpieczyć swoje dane logowania</li>
              <li>Nie udostępniać konta innym osobom</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">4. Wystawianie Produktów</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Sprzedający zobowiązuje się do:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Umieszczania prawdziwych zdjęć i opisów produktów</li>
              <li>Podawania uczciwych informacji o stanie produktu</li>
              <li>Przestrzegania przepisów prawa przy sprzedaży</li>
              <li>Niewystawiania przedmiotów zabronionych lub nielegalnych</li>
              <li>Wysyłki produktu w terminie do 3 dni roboczych po otrzymaniu płatności</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">5. Zakupy</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Kupujący zobowiązuje się do:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Dokonania płatności w ciągu 24 godzin od złożenia zamówienia</li>
              <li>Podania prawidłowego adresu dostawy</li>
              <li>Odebrania przesyłki w odpowiednim czasie</li>
              <li>Kontaktu ze sprzedającym w przypadku problemów</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">6. Płatności</h2>
            <p className="text-muted-foreground leading-relaxed">
              Wszystkie transakcje są przetwarzane bezpiecznie. MarketHub nie przechowuje danych kart płatniczych. 
              Płatności są realizowane przez zaufanych partnerów płatniczych.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">7. Zwroty i Reklamacje</h2>
            <p className="text-muted-foreground leading-relaxed">
              Kupujący ma prawo do zwrotu produktu w ciągu 14 dni od otrzymania, jeśli produkt jest niezgodny z opisem 
              lub uszkodzony. Szczegóły w polityce zwrotów.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">8. Zakazy</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Na platformie zabrania się:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Sprzedaży produktów nielegalnych lub podróbek</li>
              <li>Wprowadzania w błąd innych użytkowników</li>
              <li>Manipulowania opiniami i ocenami</li>
              <li>Spamu i nieuzasadnionego kontaktu</li>
              <li>Prowadzenia transakcji poza platformą</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">9. Odpowiedzialność</h2>
            <p className="text-muted-foreground leading-relaxed">
              MarketHub pełni rolę pośrednika między kupującym a sprzedającym. Nie ponosimy odpowiedzialności za jakość 
              produktów, terminowość wysyłki czy spory między użytkownikami, chociaż staramy się wspierać w ich rozwiązaniu.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">10. Zmiany Regulaminu</h2>
            <p className="text-muted-foreground leading-relaxed">
              Zastrzegamy sobie prawo do zmiany regulaminu. Użytkownicy zostaną poinformowani o zmianach z wyprzedzeniem 
              14 dni.
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

export default Terms;

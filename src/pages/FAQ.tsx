import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Navbar />
      <main className="container max-w-4xl py-16">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-hero p-4 shadow-glow">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Najczęściej Zadawane Pytania
          </h1>
        </div>

        <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Jak zacząć sprzedawać na VelvetBazaar.co.uk?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Aby zacząć sprzedawać, musisz najpierw założyć konto. Następnie kliknij przycisk "Sprzedaj" w menu, 
                wypełnij formularz z opisem produktu, dodaj zdjęcia i ustaw cenę. Po zatwierdzeniu, Twoje ogłoszenie 
                pojawi się na platformie.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Czy mogę anulować zamówienie?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Możesz anulować zamówienie tylko przed wysyłką produktu przez sprzedającego. Skontaktuj się ze 
                sprzedającym jak najszybciej. Po wysłaniu produktu możesz skorzystać z prawa do zwrotu (14 dni).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Jakie metody płatności są dostępne?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Akceptujemy karty kredytowe/debetowe (Visa, Mastercard), BLIK, przelewy bankowe oraz płatności przez 
                PayPal. Wszystkie transakcje są bezpieczne i szyfrowane.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Ile kosztuje wystawienie produktu?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Wystawienie produktu na VelvetBazaar.co.uk jest całkowicie darmowe! Pobieramy jedynie małą prowizję od 
                sprzedaży (3-5% w zależności od kategorii) tylko wtedy, gdy produkt zostanie sprzedany.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Jak długo trwa wysyłka?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Czas wysyłki zależy od wybranej metody dostawy i lokalizacji. Zazwyczaj:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>InPost Paczkomaty: 1-2 dni robocze</li>
                  <li>Royal Mail: 1-3 dni robocze</li>
                  <li>Evri: 2-4 dni robocze</li>
                </ul>
                Sprzedający wysyła produkt w ciągu 3 dni roboczych od otrzymania płatności.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Co zrobić, jeśli otrzymam uszkodzony produkt?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Jeśli produkt jest uszkodzony, zrób zdjęcia i natychmiast skontaktuj się ze sprzedającym oraz naszym 
                wsparciem w ciągu 48 godzin. Rozpatrzymy reklamację i pomożemy w uzyskaniu zwrotu lub wymiany.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Jak śledzić moją przesyłkę?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Po wysłaniu produktu przez sprzedającego otrzymasz numer śledzenia na email. Możesz również sprawdzić 
                status przesyłki w swoim profilu w sekcji "Moje zamówienia".
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Czy mogę negocjować cenę z sprzedającym?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Tak! Możesz skontaktować się ze sprzedającym przez wiadomości i zapytać o możliwość negocjacji ceny. 
                Niektórzy sprzedający są otwarci na negocjacje, szczególnie przy zakupie kilku produktów.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Jak działa system ocen i recenzji?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Po zakończeniu transakcji, zarówno kupujący jak i sprzedający mogą wystawić sobie nawzajem ocenę 
                (1-5 gwiazdek) i napisać recenzję. Oceny są publiczne i pomagają budować zaufanie w społeczności.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Co zrobić, jeśli mam problem ze sprzedającym?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Jeśli napotkasz problem, najpierw spróbuj rozwiązać go bezpośrednio ze sprzedającym przez wiadomości. 
                Jeśli to nie pomoże, skontaktuj się z naszym zespołem wsparcia pod adresem support@velvetbazaar.co.uk - 
                jesteśmy tu, aby pomóc!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Czy mogę sprzedawać produkty używane?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Tak! VelvetBazaar.co.uk jest świetnym miejscem do sprzedaży produktów używanych. Po prostu uczciwie opisz stan 
                produktu przy wystawianiu ogłoszenia (nowy, jak nowy, używany, wymaga naprawy).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Jak mogę zwiększyć szanse na sprzedaż?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Kilka wskazówek:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Dodaj wysokiej jakości zdjęcia z różnych kątów</li>
                  <li>Napisz szczegółowy i uczciwy opis</li>
                  <li>Ustal konkurencyjną cenę</li>
                  <li>Odpowiadaj szybko na wiadomości</li>
                  <li>Oferuj darmową wysyłkę, jeśli możesz</li>
                  <li>Zbuduj pozytywną reputację przez dobre oceny</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-8 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 p-6">
            <h3 className="text-lg font-bold text-foreground mb-2">Nie znalazłeś odpowiedzi?</h3>
            <p className="text-muted-foreground mb-4">
              Jeśli masz inne pytanie, skontaktuj się z nami:
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                📧 Email: <span className="text-foreground font-semibold">support@velvetbazaar.co.uk</span>
              </p>
              <p className="text-muted-foreground">
                📞 Telefon: <span className="text-foreground font-semibold">+48 123 456 789</span>
              </p>
              <p className="text-muted-foreground">
                🕐 Pon-Pt: 9:00-18:00, Sob: 10:00-14:00
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;

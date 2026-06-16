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
            Returns &amp; Refunds
          </h1>
        </div>

        <div className="space-y-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Your right to return</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Under UK consumer law, buyers may return most items within{" "}
              <strong className="text-foreground">14 days</strong> of receiving them, without
              giving a reason. This applies to distance sales on VelvetBazzar.co.uk.
            </p>
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-6 space-y-3">
              <h3 className="font-bold text-foreground">Return conditions:</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>The item has not been used beyond what is needed to inspect it</li>
                <li>Original packaging is included where possible</li>
                <li>The item is complete with any accessories</li>
                <li>The buyer usually pays return postage unless the item is faulty or misdescribed</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Faulty or misdescribed items</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may be entitled to a refund or replacement if the item is:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
              <li>Not as described in the listing</li>
              <li>Damaged in transit</li>
              <li>Faulty or not working as expected</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Report the issue within <strong className="text-foreground">48 hours</strong> of
              delivery, with photos where possible.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">How to request a return or refund</h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-primary/20 w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Contact the seller</h4>
                  <p className="text-muted-foreground text-sm">
                    Message the seller on VelvetBazzar first to explain the issue and agree next steps.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-primary/20 w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Document the problem</h4>
                  <p className="text-muted-foreground text-sm">
                    Take photos of the item, packaging, and any damage.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-primary/20 w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Escalate if needed</h4>
                  <p className="text-muted-foreground text-sm">
                    If you cannot reach an agreement with the seller, contact our support team.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="rounded-full bg-primary/20 w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Await a decision</h4>
                  <p className="text-muted-foreground text-sm">
                    We aim to review cases within 3–5 working days.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Refunds</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Once a return or claim is accepted:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>The seller provides a return address (where applicable)</li>
              <li>The buyer sends the item back, or keeps it if the claim is accepted without return</li>
              <li>After the seller receives the return, the refund is processed within 7 days</li>
              <li>Funds are returned to the original payment method via Stripe</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Exceptions</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              The 14-day return right may not apply to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Custom or personalised items</li>
              <li>Perishable goods</li>
              <li>Sealed goods that have been opened after delivery (e.g. software)</li>
              <li>Digital content supplied immediately after purchase</li>
            </ul>
          </section>

          <section className="rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/30 p-6">
            <h2 className="mb-3 text-xl font-bold text-foreground">Need help?</h2>
            <p className="text-muted-foreground">
              Contact our support team:{" "}
              <span className="text-foreground font-semibold">support@velvetbazzar.co.uk</span>
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8 pt-4 border-t border-border/50">
            Last updated: 1 January 2025
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Returns;

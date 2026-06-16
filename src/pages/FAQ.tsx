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
            Frequently Asked Questions
          </h1>
        </div>

        <div className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl">
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                How do I start selling on VelvetBazzar.co.uk?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Create an account first, then click &quot;Sell&quot; in the menu. Fill in the listing
                form with a product description, add photos, and set your price. Once published,
                your listing will appear on the marketplace.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Can I cancel an order?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                You can cancel an order only before the seller dispatches the item. Contact the
                seller as soon as possible. After dispatch, you may still have a 14-day right to
                return under UK consumer law.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                What payment methods are available?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                We accept debit and credit cards (Visa, Mastercard, Amex) via Stripe.
                All payments are in British pounds (£). Transactions are encrypted and secure.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                How much does it cost to list a product?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Listing on VelvetBazzar.co.uk is completely free. We only charge a{" "}
                <strong className="text-foreground">5% platform fee</strong> when your item sells
                (this can be reduced with Velvet Coins — see below).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-velvet-coins" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                What are Velvet Coins and how do they work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Velvet Coins (VC) are a platform-only reward currency — not crypto and not cash.
                You earn VC when you sign up, complete your first sale, or refer friends. Sellers
                can redeem VC to lower the standard 5% selling fee: 100 VC reduces the fee by 1
                percentage point (e.g. from 5% to 4%), up to 250 VC per sale (minimum 2.5% fee).
                Manage your balance, referral link, and redemptions in Profile → Velvet Coins.
                Full rules are in our{" "}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                How long does delivery take?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Delivery times depend on the carrier and location. Typically:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>InPost Lockers: 1–2 working days (UK)</li>
                  <li>Royal Mail: 1–3 working days (UK)</li>
                  <li>Evri: 2–4 working days (UK)</li>
                </ul>
                Sellers dispatch within 3 working days of receiving payment.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                What if I receive a damaged item?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                If an item arrives damaged, take photos and contact the seller and our support
                team within 48 hours. We will review your claim and help arrange a refund or
                replacement where appropriate.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                How do I track my parcel?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                After the seller dispatches your order, you will receive a tracking number by
                email. You can also check delivery status in your profile under &quot;My Orders&quot;.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Can I negotiate the price with a seller?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Yes. Message the seller to ask about a better price. Some sellers are open to
                negotiation, especially when you buy multiple items.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-9" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                How do ratings and reviews work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                After a transaction completes, buyers and sellers can rate each other (1–5 stars)
                and leave a review. Ratings are public and help build trust in the community.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                What if I have a problem with a seller?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Try to resolve the issue directly with the seller via messages first. If that
                does not help, contact our support team at support@velvetbazzar.co.uk — we are
                here to help.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                Can I sell used items?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Yes. VelvetBazzar.co.uk is a great place to sell pre-owned items. Describe the
                condition honestly when listing (new, like new, good, fair).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-12" className="border-b border-border/50 pb-4">
              <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
                How can I improve my chances of selling?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                A few tips:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Add high-quality photos from multiple angles</li>
                  <li>Write a detailed, honest description</li>
                  <li>Price competitively</li>
                  <li>Reply to messages quickly</li>
                  <li>Offer free shipping if you can</li>
                  <li>Build a positive reputation through good reviews</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-8 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 p-6">
            <h3 className="text-lg font-bold text-foreground mb-2">Still have a question?</h3>
            <p className="text-muted-foreground mb-4">
              If you need more help, get in touch:
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Email: <span className="text-foreground font-semibold">support@velvetbazzar.co.uk</span>
              </p>
              <p className="text-muted-foreground">
                We aim to reply within 1–2 working days.
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

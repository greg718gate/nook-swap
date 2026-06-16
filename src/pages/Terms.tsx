import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

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
            Terms of Service
          </h1>
        </div>

        <div className="space-y-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl text-muted-foreground leading-relaxed">
          <p className="text-sm">
            These Terms of Service (&quot;Terms&quot;) govern your use of VelvetBazzar
            (&quot;we&quot;, &quot;us&quot;, &quot;the Platform&quot;) at{" "}
            <a href="https://velvetbazzar.co.uk" className="text-primary hover:underline">
              velvetbazzar.co.uk
            </a>
            . By creating an account or using the Platform, you agree to these Terms.
          </p>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">1. Who we are</h2>
            <p>
              VelvetBazzar is a UK marketplace that connects buyers and sellers of
              pre-owned and new items. We provide listing, messaging, checkout, and
              payment tools. We are not the seller of items listed by users unless
              explicitly stated.
            </p>
            <p className="mt-3">
              Contact:{" "}
              <a href="mailto:support@velvetbazzar.co.uk" className="text-primary hover:underline">
                support@velvetbazzar.co.uk
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">2. Eligibility &amp; accounts</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>You must be at least 18 years old (or have guardian consent).</li>
              <li>You must provide accurate registration details and a valid UK dispatch address if you buy or sell physical items.</li>
              <li>You are responsible for keeping your login credentials secure.</li>
              <li>One person must not operate multiple accounts to abuse promotions or fees.</li>
              <li>We may suspend or close accounts that breach these Terms or applicable law.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">3. Buying &amp; selling</h2>
            <p className="mb-3">
              A contract of sale is between the buyer and the seller. VelvetBazzar facilitates
              the transaction but is not a party to that contract.
            </p>
            <p className="font-medium text-foreground mb-2">Sellers agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li>List only items they are entitled to sell, with honest photos and descriptions.</li>
              <li>Dispatch physical items within 3 working days of payment (unless otherwise agreed in writing via Platform messages).</li>
              <li>Comply with UK consumer law, including accurate descriptions and safe products.</li>
              <li>Not list prohibited, illegal, counterfeit, or stolen goods.</li>
            </ul>
            <p className="font-medium text-foreground mb-2">Buyers agree to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Pay promptly through the Platform checkout.</li>
              <li>Provide a correct UK delivery address.</li>
              <li>Communicate in good faith if there is a problem with an order.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">4. Fees &amp; payments</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>All prices on the Platform are shown in British pounds (GBP, £).</li>
              <li>Payments are processed by Stripe. We do not store full card details.</li>
              <li>
                Sellers pay a <strong className="text-foreground">5% platform fee</strong> on
                the sale value (including the buyer&apos;s share of shipping where applicable),
                unless reduced through Velvet Coins (see section 5).
              </li>
              <li>Payouts to sellers are made via Stripe Connect to the seller&apos;s connected account after a successful payment.</li>
              <li>Shipping costs are set by sellers and shown at checkout.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">5. Velvet Coins</h2>
            <p className="mb-3">
              Velvet Coins (&quot;VC&quot;) are a <strong className="text-foreground">platform-only reward currency</strong>.
              They are not cryptocurrency, legal tender, or withdrawable cash.
            </p>
            <p className="font-medium text-foreground mb-2">Earning VC</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li>Welcome bonus when you create an account (currently 25 VC).</li>
              <li>First completed sale as a seller (currently 100 VC).</li>
              <li>Referral bonus when someone registers using your referral link (currently 50 VC).</li>
              <li>Additional bonus when a referred user completes their first sale (currently 75 VC).</li>
            </ul>
            <p className="font-medium text-foreground mb-2">Using VC</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
              <li>Sellers may redeem VC to reduce the platform selling fee on a future sale.</li>
              <li>100 VC reduces the fee by 1 percentage point (e.g. from 5% to 4%).</li>
              <li>Maximum redemption per sale: 250 VC (lowering the fee to 2.5%).</li>
              <li>VC are deducted when payment for that sale is successfully completed.</li>
            </ul>
            <p className="font-medium text-foreground mb-2">General rules</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>VC cannot be transferred, sold, or exchanged for money outside the Platform.</li>
              <li>We may adjust earn rates, redemption rules, or retire the programme with reasonable notice.</li>
              <li>Abuse (fake accounts, self-referrals, manipulation) may result in forfeiture of VC and account closure.</li>
              <li>Unused VC have no cash value if your account is closed.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">6. Shipping &amp; delivery</h2>
            <p>
              Sellers are responsible for packing and dispatch. Buyers should track parcels
              and report non-delivery promptly. Our{" "}
              <Link to="/shipping" className="text-primary hover:underline">Shipping</Link> page
              describes available carriers (Evri, Royal Mail, InPost Lockers). Risk passes in
              line with UK law and the carrier&apos;s terms once the item is handed to the carrier.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">7. Returns, refunds &amp; UK consumer rights</h2>
            <p className="mb-3">
              If you buy as a consumer in the UK, you may have statutory rights under the
              Consumer Rights Act 2015 and Consumer Contracts Regulations 2013, including
              rights where goods are faulty, not as described, or not delivered.
            </p>
            <p>
              See our{" "}
              <Link to="/returns" className="text-primary hover:underline">Returns Policy</Link>{" "}
              for practical steps. Refunds for eligible orders may be processed through Stripe
              in line with our refund procedures. Private sales between individuals may have
              different rights than business sellers — sellers who trade as businesses must
              comply with all applicable consumer regulations.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">8. Prohibited conduct</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Fraud, chargeback abuse, or payment circumvention (e.g. asking buyers to pay off-platform).</li>
              <li>Harassment, hate speech, spam, or fake reviews.</li>
              <li>Automated scraping, bots, or attempts to disrupt the Platform.</li>
              <li>Listing weapons, drugs, stolen goods, counterfeits, or other prohibited items.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">9. Content &amp; intellectual property</h2>
            <p>
              You retain ownership of photos and descriptions you upload. You grant us a
              licence to display and process that content to operate the Platform. You must
              not infringe third-party rights. We may remove content that violates these Terms
              or receives valid legal complaints.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">10. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, VelvetBazzar is not liable for the
              quality, safety, or legality of items listed by users, actions of buyers or
              sellers, or indirect losses. Nothing in these Terms limits liability for death
              or personal injury caused by negligence, fraud, or any liability that cannot be
              excluded under UK law.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">11. Privacy</h2>
            <p>
              We process personal data as described in our{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">12. Changes &amp; governing law</h2>
            <p className="mb-3">
              We may update these Terms. Material changes will be notified on the Platform
              or by email where appropriate. Continued use after changes take effect constitutes
              acceptance.
            </p>
            <p>
              These Terms are governed by the laws of England and Wales. Disputes are subject
              to the exclusive jurisdiction of the courts of England and Wales, without prejudice
              to your mandatory consumer rights in Scotland or Northern Ireland.
            </p>
          </section>

          <p className="text-sm mt-8 pt-4 border-t border-border/50">
            Last updated: 16 June 2026
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;

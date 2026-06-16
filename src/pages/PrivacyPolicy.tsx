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
            Privacy Policy
          </h1>
        </div>

        <div className="space-y-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 shadow-xl text-muted-foreground leading-relaxed">
          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">1. Overview</h2>
            <p>
              VelvetBazzar.co.uk (&quot;we&quot;, &quot;us&quot;) is committed to protecting your privacy.
              This policy explains what personal data we collect, how we use it, and your rights under UK GDPR.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">2. Data we collect</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account data (username, email, password hash)</li>
              <li>Profile data (avatar, bio, UK dispatch address)</li>
              <li>Transaction data (orders, payments via Stripe)</li>
              <li>Listing data (photos, descriptions, prices)</li>
              <li>Messages and reviews between users</li>
              <li>Velvet Coin balance and referral activity</li>
              <li>Technical data (IP address, device, anti-fraud signals)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">3. How we use your data</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Operating the marketplace and processing orders</li>
              <li>Connecting buyers and sellers</li>
              <li>Payments and payouts via Stripe</li>
              <li>Platform security (including anti-bot protection)</li>
              <li>Customer support and service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">4. Sharing data</h2>
            <p>
              We share data only as needed: with other users for transactions (e.g. shipping address),
              with payment processors (Stripe), email providers, and hosting (Supabase).
              We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">5. Your rights (UK)</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Request erasure (&quot;right to be forgotten&quot;)</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Lodge a complaint with the ICO (ico.org.uk)</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">6. Cookies</h2>
            <p>
              We use essential cookies for login sessions and platform functionality.
              You can manage cookies in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">7. Security</h2>
            <p>
              We use encryption, access controls, and secure payment processing.
              No method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold text-foreground">8. Contact</h2>
            <p>
              Privacy enquiries:{" "}
              <a href="mailto:privacy@velvetbazzar.co.uk" className="text-primary hover:underline">
                privacy@velvetbazzar.co.uk
              </a>
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

export default PrivacyPolicy;

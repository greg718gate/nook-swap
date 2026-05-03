import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Package, Download, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Purchase {
  id: string;
  product_id: string;
  download_count: number;
  max_downloads: number;
  products: {
    title: string;
    product_type: string;
    digital_file_url: string | null;
    digital_file_name: string | null;
  } | null;
}

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      navigate("/");
      return;
    }

    fetchPurchases();
  }, [searchParams, navigate]);

  const fetchPurchases = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("purchases")
      .select(`
        id,
        product_id,
        download_count,
        max_downloads,
        products (title, product_type, digital_file_url, digital_file_name)
      `)
      .eq("buyer_id", session.session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setPurchases(data as unknown as Purchase[]);
    }
    setLoading(false);
  };

  const handleDownload = async (purchase: Purchase) => {
    // Server-side check + atomic increment via RPC
    const { data: rpcData, error: rpcError } = await supabase
      .rpc("request_digital_download", { _purchase_id: purchase.id });

    if (rpcError || !rpcData || rpcData.length === 0) {
      console.error("Download error:", rpcError);
      return;
    }

    const { file_url, file_name } = rpcData[0] as { file_url: string; file_name: string | null };

    const { data, error } = await supabase.storage
      .from("digital-products")
      .download(file_url);

    if (error) {
      console.error("Download error:", error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file_name || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Refresh purchases to update download count
    fetchPurchases();
  };

  const digitalPurchases = purchases.filter(
    (p) => p.products?.product_type === "digital"
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container py-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>

            <h1 className="mb-4 text-3xl font-bold">
              Dziękujemy za zamówienie!
            </h1>
            <p className="mb-8 text-muted-foreground">
              Twoja płatność została potwierdzona. Otrzymasz e-mail z
              potwierdzeniem zamówienia.
            </p>

            {digitalPurchases.length > 0 && (
              <Card className="mb-8 p-6 text-left">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                  <Download className="h-5 w-5" />
                  Produkty cyfrowe do pobrania
                </h2>
                <div className="space-y-4">
                  {digitalPurchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{purchase.products?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Pobrano: {purchase.download_count}/{purchase.max_downloads}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleDownload(purchase)}
                        disabled={purchase.download_count >= purchase.max_downloads}
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Pobierz
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="mb-8 p-6 text-left">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Package className="h-5 w-5" />
                Co dalej?
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>
                    Sprzedawca został powiadomiony o Twoim zamówieniu
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>
                    Otrzymasz e-mail z informacją o wysyłce
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-primary" />
                  <span>
                    Możesz śledzić status zamówienia w swoim profilu
                  </span>
                </li>
              </ul>
            </Card>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link to="/profile?tab=orders">Moje zamówienia</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/products">Kontynuuj zakupy</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutSuccess;

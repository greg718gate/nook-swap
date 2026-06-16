import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Truck, Download, Package } from "lucide-react";
import { createShippingLabel } from "@/lib/shippingApi";

interface SaleItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  orders: {
    id: string;
    status: string;
    total_amount: number;
    shipping_method: string | null;
    shipping_address: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
    shipping_label_url: string | null;
    shipment_status: string | null;
    carrier: string | null;
    buyer_id: string;
  };
}

const statusLabel: Record<string, string> = {
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const SellerOrders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [tracking, setTracking] = useState<Record<string, { num: string; carrier: string }>>({});
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await fetchSales(session.user.id);
  };

  const fetchSales = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("order_items")
      .select("*, orders(*)")
      .eq("seller_id", uid)
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load sales");
    else setSales((data as SaleItem[]) || []);
    setLoading(false);
  };

  const markShipped = async (orderId: string) => {
    const t = tracking[orderId];
    if (!t?.num || !t?.carrier) {
      toast.error("Enter tracking number and carrier");
      return;
    }
    setActing(orderId);
    const { error } = await supabase
      .from("orders")
      .update({
        status: "shipped",
        tracking_number: t.num,
        carrier: t.carrier,
        shipped_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    setActing(null);
    if (error) toast.error("Could not update order");
    else {
      toast.success("Marked as shipped");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await fetchSales(session.user.id);
    }
  };

  const generateLabel = async (orderId: string) => {
    setActing(orderId);
    try {
      const result = await createShippingLabel(orderId);
      if (result.error) {
        if (result.code === "DISPATCH_ADDRESS_REQUIRED") {
          toast.error("Add your dispatch address in Profile → Edit first");
        } else if (result.code === "SHIPPO_NOT_CONFIGURED") {
          toast.error("Auto labels coming soon — use manual tracking below");
        } else {
          toast.error(result.error);
        }
        return;
      }
      toast.success("Shipping label ready — tracking linked automatically");
      if (result.label_url) window.open(result.label_url, "_blank");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await fetchSales(session.user.id);
    } catch {
      toast.error("Could not generate shipping label");
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Group by order
  const byOrder = sales.reduce<Record<string, SaleItem[]>>((acc, s) => {
    (acc[s.order_id] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/20">
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-6">Sales</h1>
          {Object.keys(byOrder).length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                No sold items yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(byOrder).map(([orderId, items]) => {
                const order = items[0].orders;
                const sellerTotal = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
                const showShipBox = order.status === "paid";
                return (
                  <Card key={orderId}>
                    <CardHeader className="flex flex-row items-start justify-between pb-3">
                      <div>
                        <CardTitle className="text-base font-mono">#{orderId.slice(0, 8)}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {items.length} items · £{sellerTotal.toFixed(2)}
                        </p>
                      </div>
                      <Badge>{statusLabel[order.status] || order.status}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {order.shipping_address && (
                        <div className="rounded-md bg-muted p-3 text-sm">
                          <div className="font-medium mb-1">Delivery address</div>
                          <div className="text-muted-foreground whitespace-pre-line">{order.shipping_address}</div>
                          {order.shipping_method && (
                            <div className="text-xs text-muted-foreground mt-1">Method: {order.shipping_method}</div>
                          )}
                        </div>
                      )}
                      {order.tracking_number && (
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            {order.carrier} — {order.tracking_number}
                            {order.shipment_status && (
                              <Badge variant="outline" className="text-xs">
                                {order.shipment_status.replace("_", " ")}
                              </Badge>
                            )}
                          </div>
                          {order.tracking_url && (
                            <a
                              href={order.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-xs hover:underline"
                            >
                              Track parcel →
                            </a>
                          )}
                        </div>
                      )}
                      {order.shipping_label_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={order.shipping_label_url} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            Download label
                          </a>
                        </Button>
                      )}
                      {showShipBox && (
                        <div className="space-y-3 rounded-lg border border-dashed border-primary/30 p-4">
                          <p className="text-sm text-muted-foreground">
                            Generate a prepaid label — tracking updates automatically on VelvetBazzar.
                          </p>
                          <Button
                            onClick={() => generateLabel(orderId)}
                            disabled={acting === orderId}
                            className="w-full sm:w-auto"
                          >
                            {acting === orderId ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Package className="mr-2 h-4 w-4" />
                            )}
                            Generate shipping label
                          </Button>
                          <p className="text-xs text-muted-foreground">Or enter tracking manually:</p>
                        <div className="grid gap-2 sm:grid-cols-3 items-end">
                          <div>
                            <label className="text-xs text-muted-foreground">Carrier</label>
                            <Select
                              value={tracking[orderId]?.carrier || ""}
                              onValueChange={(v) =>
                                setTracking((p) => ({ ...p, [orderId]: { ...(p[orderId] || { num: "" }), carrier: v } }))
                              }
                            >
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Royal Mail">Royal Mail</SelectItem>
                                <SelectItem value="Evri">Evri</SelectItem>
                                <SelectItem value="InPost">InPost Lockers</SelectItem>
                                <SelectItem value="DPD">DPD</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Tracking number</label>
                            <Input
                              value={tracking[orderId]?.num || ""}
                              onChange={(e) =>
                                setTracking((p) => ({ ...p, [orderId]: { ...(p[orderId] || { carrier: "" }), num: e.target.value } }))
                              }
                              placeholder="Tracking..."
                            />
                          </div>
                          <Button onClick={() => markShipped(orderId)} disabled={acting === orderId}>
                            Mark as shipped
                          </Button>
                        </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerOrders;

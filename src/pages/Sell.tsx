import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Sell = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    condition: "good",
    shipping_evri: "",
    shipping_royal_mail: "",
    shipping_inpost: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        navigate("/auth");
      }
    });

    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    if (data) setCategories(data);
  };

  const handleAIAnalysis = async () => {
    if (!formData.title && !formData.description && !imagePreview) {
      toast.error("Dodaj przynajmniej tytuł, opis lub zdjęcie produktu");
      return;
    }

    setAiAnalyzing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-tag-product`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            imageUrl: imagePreview || null,
            title: formData.title,
            description: formData.description,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze");
      }

      const result = await response.json();
      
      // Apply AI suggestions
      if (result.suggestedTitle && !formData.title) {
        setFormData(prev => ({ ...prev, title: result.suggestedTitle }));
      }
      
      if (result.category) {
        const matchedCategory = categories.find(
          c => c.name.toLowerCase() === result.category.toLowerCase()
        );
        if (matchedCategory) {
          setFormData(prev => ({ ...prev, category_id: matchedCategory.id }));
        }
      }

      if (result.condition) {
        const conditionMap: Record<string, string> = {
          new: "new",
          used: "good",
          "like new": "like-new",
        };
        const mappedCondition = conditionMap[result.condition.toLowerCase()] || "good";
        setFormData(prev => ({ ...prev, condition: mappedCondition }));
      }

      toast.success(`AI Analysis: ${result.insights || "Analiza zakończona!"}`);
      
      if (result.tags && result.tags.length > 0) {
        toast.info(`Sugerowane tagi: ${result.tags.join(", ")}`);
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Nie udało się przeanalizować produktu");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("products").insert({
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        condition: formData.condition,
        status: "active",
        shipping_evri: parseFloat(formData.shipping_evri) || 0,
        shipping_royal_mail: parseFloat(formData.shipping_royal_mail) || 0,
        shipping_inpost: parseFloat(formData.shipping_inpost) || 0,
      });

      if (error) throw error;

      toast.success("Product listed successfully!");
      navigate("/profile");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-8 text-3xl font-bold">List an Item</h1>

            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Automatyczne Tagowanie AI</h2>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAIAnalysis}
                      disabled={aiAnalyzing}
                      className="gap-2"
                    >
                      {aiAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analizuję...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Analizuj z AI
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI przeanalizuje Twój produkt i automatycznie wypełni kategorię, tagi i stan.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Zdjęcie Produktu</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., iPhone 13 Pro Max"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your item..."
                    rows={5}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) =>
                        setFormData({ ...formData, condition: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like-new">Like New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Shipping Options (£)</h3>
                  <p className="text-sm text-muted-foreground">
                    Set shipping costs for each carrier. Buyer will pay for shipping.
                  </p>
                  
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="shipping_evri">Evri</Label>
                      <Input
                        id="shipping_evri"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.shipping_evri}
                        onChange={(e) =>
                          setFormData({ ...formData, shipping_evri: e.target.value })
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shipping_royal_mail">Royal Mail</Label>
                      <Input
                        id="shipping_royal_mail"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.shipping_royal_mail}
                        onChange={(e) =>
                          setFormData({ ...formData, shipping_royal_mail: e.target.value })
                        }
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shipping_inpost">InPost</Label>
                      <Input
                        id="shipping_inpost"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.shipping_inpost}
                        onChange={(e) =>
                          setFormData({ ...formData, shipping_inpost: e.target.value })
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Listing..." : "List Item"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Sell;

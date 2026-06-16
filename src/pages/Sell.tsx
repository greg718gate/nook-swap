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
import { Sparkles, Loader2, X, Upload, ImagePlus, FileUp } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const MAX_IMAGES = 5;
const MIN_IMAGES = 1;

const Sell = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [uploadingDigitalFile, setUploadingDigitalFile] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category_id: "",
    condition: "good",
    product_type: "physical",
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
    if (!formData.title && !formData.description && imagePreviews.length === 0) {
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
            imageUrl: imagePreviews[0] || null,
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
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Możesz dodać maksymalnie ${MAX_IMAGES} zdjęć`);
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} nie jest obrazem`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} jest zbyt duży (max 5MB)`);
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles]);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImagesToStorage = async (): Promise<string[]> => {
    if (!user || images.length === 0) return [];

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { contentType: file.type, upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Nie udało się przesłać zdjęć. Spróbuj ponownie lub wybierz mniejsze pliki.');
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDigitalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Plik jest zbyt duży (max 100MB)");
      return;
    }

    setDigitalFile(file);
  };

  const uploadDigitalFile = async (): Promise<{ url: string; name: string } | null> => {
    if (!user || !digitalFile) return null;

    setUploadingDigitalFile(true);
    try {
      const fileExt = digitalFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('digital-products')
        .upload(fileName, digitalFile, { contentType: digitalFile.type || 'application/octet-stream', upsert: false });

      if (uploadError) throw uploadError;

      return { url: fileName, name: digitalFile.name };
    } catch (error) {
      console.error('Error uploading digital file:', error);
      throw error;
    } finally {
      setUploadingDigitalFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (images.length < MIN_IMAGES) {
      toast.error(`Dodaj przynajmniej ${MIN_IMAGES} zdjęcie produktu`);
      return;
    }

    if (formData.product_type === "digital" && !digitalFile) {
      toast.error("Dodaj plik do pobrania dla produktu cyfrowego");
      return;
    }

    setLoading(true);

    try {
      // Upload images first
      const imageUrls = await uploadImagesToStorage();

      // Upload digital file if digital product
      let digitalFileData = null;
      if (formData.product_type === "digital") {
        digitalFileData = await uploadDigitalFile();
      }

      const { error } = await supabase.from("products").insert({
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: formData.category_id || null,
        condition: formData.product_type === "digital" ? null : formData.condition,
        status: "active",
        images: imageUrls,
        product_type: formData.product_type,
        digital_file_url: digitalFileData?.url || null,
        digital_file_name: digitalFileData?.name || null,
        shipping_evri: formData.product_type === "physical" ? (parseFloat(formData.shipping_evri) || 0) : 0,
        shipping_royal_mail: formData.product_type === "physical" ? (parseFloat(formData.shipping_royal_mail) || 0) : 0,
        shipping_inpost: formData.product_type === "physical" ? (parseFloat(formData.shipping_inpost) || 0) : 0,
      });

      if (error) throw error;

      toast.success("Produkt został dodany pomyślnie!");
      navigate("/profile");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Nie udało się dodać produktu';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="container py-8">
          <div className="mx-auto max-w-2xl">
            <h1 className="mb-8 text-3xl font-bold">Wystaw Przedmiot</h1>

            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* AI Analysis Section */}
                <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
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

                {/* Multi-Image Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Zdjęcia Produktu *</Label>
                    <span className="text-sm text-muted-foreground">
                      {images.length}/{MAX_IMAGES} (min. {MIN_IMAGES})
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Główne
                          </span>
                        )}
                      </div>
                    ))}
                    
                    {images.length < MAX_IMAGES && (
                      <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
                        <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Dodaj zdjęcie</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pierwsze zdjęcie będzie głównym zdjęciem produktu. Maksymalny rozmiar: 5MB na zdjęcie.
                  </p>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Tytuł *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="np. iPhone 13 Pro Max 256GB"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Opis *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Opisz szczegółowo swój przedmiot - stan, parametry, wady/zalety..."
                    rows={5}
                    required
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.description.length}/2000
                  </p>
                </div>

                {/* Product Type */}
                <div className="space-y-2">
                  <Label>Typ produktu *</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, product_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Fizyczny (do wysyłki)</SelectItem>
                      <SelectItem value="digital">Cyfrowy (do pobrania)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Digital File Upload */}
                {formData.product_type === "digital" && (
                  <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <Label>Plik do pobrania *</Label>
                      {digitalFile && (
                        <span className="text-sm text-muted-foreground">
                          {digitalFile.name} ({(digitalFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </div>
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
                      <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {digitalFile ? "Zmień plik" : "Wybierz plik do pobrania"}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        Max 100MB
                      </span>
                      <input
                        type="file"
                        onChange={handleDigitalFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Price and Condition */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Cena (£) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {formData.product_type === "physical" && (
                    <div className="space-y-2">
                      <Label htmlFor="condition">Stan *</Label>
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
                          <SelectItem value="new">Nowy</SelectItem>
                          <SelectItem value="like-new">Jak nowy</SelectItem>
                          <SelectItem value="good">Dobry</SelectItem>
                          <SelectItem value="fair">Używany</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Kategoria *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wybierz kategorię" />
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

                {/* Shipping Options - only for physical products */}
                {formData.product_type === "physical" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">UK Shipping (£)</h3>
                    <p className="text-sm text-muted-foreground">
                      Set shipping prices in pounds for UK carriers. Buyers pay the cost at checkout.
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
                        <Label htmlFor="shipping_inpost">InPost Lockers</Label>
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
                )}

                {/* Submit Buttons */}
                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={loading || uploadingImages}
                  >
                    {loading || uploadingImages ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {uploadingImages ? "Przesyłanie zdjęć..." : "Dodawanie..."}
                      </>
                    ) : (
                      "Wystaw Przedmiot"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Anuluj
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
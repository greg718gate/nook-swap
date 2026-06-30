import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
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
import { hasCompleteDispatchAddress } from "@/lib/profileSetup";
import { validateImageFile, validateDigitalFile } from "@/lib/uploadValidation";

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
    seller_type: "private" as "private" | "business",
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("dispatch_line1, dispatch_city, dispatch_postcode, seller_type")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profile?.seller_type === "business" || profile?.seller_type === "private") {
        setFormData((prev) => ({ ...prev, seller_type: profile.seller_type as "private" | "business" }));
      }

      if (!hasCompleteDispatchAddress(profile)) {
        toast.error("Add your UK address before selling");
        navigate("/setup");
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
      toast.error("Add at least a title, description, or product photo");
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

      toast.success(`AI Analysis: ${result.insights || "Analysis complete!"}`);
      
      if (result.tags && result.tags.length > 0) {
        toast.info(`Suggested tags: ${result.tags.join(", ")}`);
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      toast.error(error instanceof Error ? error.message : "Could not analyse product");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`You can add up to ${MAX_IMAGES} photos`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const err = await validateImageFile(file);
      if (err) {
        toast.error(err);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
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
      toast.error('Could not upload photos. Try again or choose smaller files.');
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDigitalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const err = validateDigitalFile(file);
    if (err) {
      toast.error(err);
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
      toast.error(`Add at least ${MIN_IMAGES} product photo`);
      return;
    }

    if (formData.product_type === "digital" && !digitalFile) {
      toast.error("Add a download file for digital products");
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
        seller_type: formData.seller_type,
      });

      await supabase
        .from("profiles")
        .update({ seller_type: formData.seller_type })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Product listed successfully!");
      navigate("/profile");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not add product';
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
            <h1 className="mb-8 text-3xl font-bold">List an Item</h1>

            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* AI Analysis Section */}
                <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">AI Auto-Tagging</h2>
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
                          Analysing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Analyse with AI
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI will analyse your product and suggest category, tags, and condition.
                  </p>
                </div>

                {/* Multi-Image Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Product Photos *</Label>
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
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                    
                    {images.length < MAX_IMAGES && (
                      <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
                        <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Add photo</span>
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
                    The first photo will be the main product image. Maximum size: 5MB per photo.
                  </p>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. iPhone 13 Pro Max 256GB"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your item in detail — condition, specs, flaws..."
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
                  <Label>Product type *</Label>
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
                      <SelectItem value="physical">Physical (shipped)</SelectItem>
                      <SelectItem value="digital">Digital (download)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* UK seller classification (Consumer Rights Act) */}
                <div className="space-y-2">
                  <Label>I am selling as *</Label>
                  <Select
                    value={formData.seller_type}
                    onValueChange={(value: "private" | "business") =>
                      setFormData({ ...formData, seller_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">
                        Private individual (C2C — buyer beware applies)
                      </SelectItem>
                      <SelectItem value="business">
                        Business / trader (full UK consumer rights apply)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.seller_type === "business"
                      ? "Buyers may have a 14-day return right and other protections under UK consumer law."
                      : "Private sales between individuals — items should be accurately described."}
                  </p>
                </div>

                {/* Digital File Upload */}
                {formData.product_type === "digital" && (
                  <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <Label>Download file *</Label>
                      {digitalFile && (
                        <span className="text-sm text-muted-foreground">
                          {digitalFile.name} ({(digitalFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                    </div>
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all">
                      <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {digitalFile ? "Change file" : "Choose download file"}
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
                    <Label htmlFor="price">Price (£) *</Label>
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
                          <SelectItem value="like-new">Like new</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
                        {uploadingImages ? "Uploading photos..." : "Listing..."}
                      </>
                    ) : (
                      "List Item"
                    )}
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
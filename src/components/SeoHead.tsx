import { useEffect } from "react";

interface SeoHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  jsonLd?: Record<string, any>;
}

const upsertMeta = (selector: string, attr: string, key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

export const SeoHead = ({ title, description, canonical, image, jsonLd }: SeoHeadProps) => {
  useEffect(() => {
    const finalTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
    document.title = finalTitle;

    if (description) {
      const desc = description.length > 160 ? description.slice(0, 157) + "..." : description;
      upsertMeta('meta[name="description"]', "name", "description", desc);
      upsertMeta('meta[property="og:description"]', "property", "og:description", desc);
    }
    upsertMeta('meta[property="og:title"]', "property", "og:title", finalTitle);
    if (image) {
      upsertMeta('meta[property="og:image"]', "property", "og:image", image);
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    }
    const url = canonical || window.location.href;
    upsertLink("canonical", url);
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);

    let script = document.getElementById("seo-jsonld") as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = "seo-jsonld";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, canonical, image, JSON.stringify(jsonLd)]);

  return null;
};

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Allowed tags list
    const allowedTags = new Set([
      "p", "br", "strong", "em", "u", "s", "ol", "ul", "li", "span",
      "h1", "h2", "h3", "h4", "h5", "h6", "pre", "code", "blockquote", 
      "a", "img", "table", "thead", "tbody", "tr", "th", "td", "hr"
    ]);

    // Recursively sanitize nodes
    const clean = (node: Node) => {
      if (node.nodeType === 1) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toLowerCase();
        
        if (!allowedTags.has(tagName)) {
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) {
              parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);
          }
          return;
        }
        
        const attrs = Array.from(el.attributes);
        for (const attr of attrs) {
          const name = attr.name.toLowerCase();
          const value = attr.value.trim().toLowerCase();
          
          if (name.startsWith("on") || value.startsWith("javascript:") || value.startsWith("data:")) {
            el.removeAttribute(attr.name);
            continue;
          }

          if ((name === "href" || name === "src") && attr.value.trim()) {
            try {
              const parsed = new URL(attr.value, window.location.origin);
              if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                el.removeAttribute(attr.name);
                continue;
              }
            } catch {
              el.removeAttribute(attr.name);
              continue;
            }
          }
          
          const allowedAttrs = ["href", "src", "alt", "title", "class", "target", "rel"];
          if (!allowedAttrs.includes(name)) {
            el.removeAttribute(attr.name);
          }
          
          if (tagName === "a" && name === "target" && attr.value === "_blank") {
            el.setAttribute("rel", "noopener noreferrer");
          }
        }
      }
      
      const children = Array.from(node.childNodes);
      for (const child of children) {
        clean(child);
      }
    };

    const body = doc.body;
    const children = Array.from(body.childNodes);
    for (const child of children) {
      clean(child);
    }
    
    return body.innerHTML;
  } catch (e) {
    console.error("Sanitization failed, falling back to empty string", e);
    return "";
  }
}


export function updateMetaTags(meta: {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
}) {
  document.title = meta.title;

  // Description meta tag
  let descTag = document.querySelector('meta[name="description"]');
  if (!descTag) {
    descTag = document.createElement('meta');
    descTag.setAttribute('name', 'description');
    document.head.appendChild(descTag);
  }
  descTag.setAttribute('content', meta.description);

  // Canonical link tag
  if (meta.canonicalUrl) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', meta.canonicalUrl);
  }

  // Helper to update or insert property-based meta tags (like OpenGraph)
  const setMetaProperty = (property: string, content: string) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  setMetaProperty("og:title", meta.title);
  setMetaProperty("og:description", meta.description);
  setMetaProperty("og:type", meta.ogType || "website");
  if (meta.canonicalUrl) {
    setMetaProperty("og:url", meta.canonicalUrl);
  }
  if (meta.ogImage) {
    setMetaProperty("og:image", meta.ogImage);
  }
}

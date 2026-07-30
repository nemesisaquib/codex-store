/**
 * Smart Image Optimization Engine for E-shop Marketplace
 * Automatically injects high-resolution & format parameters into Cloudinary and Unsplash URLs
 */

export interface ImageOptimizationOptions {
  width?: number;
  quality?: number;
  crop?: "fill" | "fit" | "cover" | "crop";
  format?: "auto" | "webp" | "avif" | "jpg";
}

/**
 * Returns a high-DPI, ultra-crisp optimized URL for any given image source.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageOptimizationOptions = {}
): string {
  const { width = 800, quality = 85, crop = "fill", format = "auto" } = options;

  if (!url || typeof url !== "string" || url.trim() === "") {
    return "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85&auto=format&fit=crop";
  }

  const cleanUrl = url.trim();

  // 1. Cloudinary URLs (res.cloudinary.com)
  if (cleanUrl.includes("res.cloudinary.com") && cleanUrl.includes("/upload/")) {
    // Avoid double transformation injection
    if (cleanUrl.includes("/f_auto") || cleanUrl.includes("/w_")) {
      return cleanUrl;
    }
    const transformStr = `upload/f_auto,q_auto,w_${width},c_${crop === "cover" ? "fill" : "limit"}/`;
    return cleanUrl.replace("upload/", transformStr);
  }

  // 2. Unsplash URLs (images.unsplash.com)
  if (cleanUrl.includes("images.unsplash.com")) {
    try {
      const urlObj = new URL(cleanUrl);
      urlObj.searchParams.set("w", String(width));
      urlObj.searchParams.set("q", String(quality));
      urlObj.searchParams.set("auto", format);
      if (!urlObj.searchParams.has("fit")) {
        urlObj.searchParams.set("fit", crop);
      }
      return urlObj.toString();
    } catch {
      return cleanUrl;
    }
  }

  // 3. Regular external/relative URLs
  return cleanUrl;
}

/**
 * Curated high-resolution fallback placeholder images
 */
export const HIGH_RES_PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1000&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1434389678278-be43e498c41f?w=1000&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542272604-787c3835535d?w=1000&q=85&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=85&auto=format&fit=crop",
];

export function getFallbackImage(seedString: string): string {
  const sum = (seedString || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return HIGH_RES_PLACEHOLDERS[sum % HIGH_RES_PLACEHOLDERS.length];
}

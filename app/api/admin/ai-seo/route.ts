import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { title = "", content = "", type = "blog" } = await req.json();

    if (!title && !content) {
      return NextResponse.json({ error: "Title or content required" }, { status: 400 });
    }

    const cleanTitle = title.trim() || "Premium Global Fashion Guide";
    const cleanExcerpt = content.replace(/<[^>]*>?/gm, '').slice(0, 300).trim();

    // Smart AI SEO Engine Generation Rules
    const brandSuffix = " | E-shop Fashion";
    let metaTitle = `${cleanTitle}`;
    if (metaTitle.length + brandSuffix.length <= 60) {
      metaTitle += brandSuffix;
    }
    if (metaTitle.length > 60) {
      metaTitle = metaTitle.slice(0, 57) + "...";
    }

    let metaDesc = cleanExcerpt
      ? `Explore ${cleanTitle}. ${cleanExcerpt.slice(0, 100)}... Discover the latest apparel, styling tips & trends at E-shop.`
      : `Discover ${cleanTitle}. Shop premium international fashion, exclusive apparel releases & luxury style guides at E-shop. Worldwide shipping available.`;
    
    if (metaDesc.length > 160) {
      metaDesc = metaDesc.slice(0, 157) + "...";
    }

    // Extract focus keywords from title and content
    const words = `${cleanTitle} ${cleanExcerpt}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3 && !["this", "that", "with", "from", "your", "have", "more", "they", "will", "about"].includes(w));
    
    const uniqueKeywords = Array.from(new Set(words)).slice(0, 8);
    const keywords = uniqueKeywords.join(", ") || "fashion, style guide, luxury apparel, streetwear, e-shop";

    const ogTitle = cleanTitle;
    const ogDesc = metaDesc;

    // Calculate AI SEO Quality Score (0 - 100)
    let seoScore = 0;
    if (metaTitle.length >= 40 && metaTitle.length <= 60) seoScore += 35;
    else if (metaTitle.length > 0) seoScore += 20;

    if (metaDesc.length >= 120 && metaDesc.length <= 160) seoScore += 35;
    else if (metaDesc.length > 0) seoScore += 20;

    if (uniqueKeywords.length >= 5) seoScore += 30;
    else if (uniqueKeywords.length > 0) seoScore += 15;

    return NextResponse.json({
      ok: true,
      metaTitle,
      metaDesc,
      keywords,
      ogTitle,
      ogDesc,
      seoScore
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

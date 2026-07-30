import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = getDb();

    const post = (await db.execute({
      sql: "SELECT * FROM blog_posts WHERE slug=? OR id=?",
      args: [slug, slug]
    })).rows[0] as unknown as any;

    if (!post) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Increment view count
    db.execute({ sql: "UPDATE blog_posts SET views = views + 1 WHERE id=?", args: [post.id] }).catch(() => {});

    return NextResponse.json(post);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = getDb();
    const body = await req.json();

    const existing = (await db.execute({ sql: "SELECT id FROM blog_posts WHERE id=? OR slug=?", args: [slug, slug] })).rows[0] as unknown as { id: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) { updates.push("title=?"); values.push(body.title); }
    if (body.slug !== undefined) { updates.push("slug=?"); values.push(body.slug); }
    if (body.author !== undefined) { updates.push("author=?"); values.push(body.author); }
    if (body.category !== undefined) { updates.push("category=?"); values.push(body.category); }
    if (body.tags !== undefined) { updates.push("tags=?"); values.push(body.tags); }
    if (body.featured_image !== undefined) { updates.push("featured_image=?"); values.push(body.featured_image); }
    if (body.excerpt !== undefined) { updates.push("excerpt=?"); values.push(body.excerpt); }
    if (body.content !== undefined) {
      updates.push("content=?");
      values.push(body.content);
      const readTime = Math.max(1, Math.ceil(body.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length / 200));
      updates.push("read_time=?");
      values.push(readTime);
    }
    if (body.status !== undefined) { updates.push("status=?"); values.push(body.status); }
    if (body.meta_title !== undefined) { updates.push("meta_title=?"); values.push(body.meta_title); }
    if (body.meta_desc !== undefined) { updates.push("meta_desc=?"); values.push(body.meta_desc); }
    if (body.meta_keywords !== undefined) { updates.push("meta_keywords=?"); values.push(body.meta_keywords); }

    updates.push("updated_at=CURRENT_TIMESTAMP");

    if (updates.length) {
      values.push(existing.id);
      await db.execute({ sql: `UPDATE blog_posts SET ${updates.join(",")} WHERE id=?`, args: values });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const db = getDb();

    await db.execute({ sql: "DELETE FROM blog_posts WHERE id=? OR slug=?", args: [slug, slug] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

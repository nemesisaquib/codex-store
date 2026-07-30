import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

/** Get or create an isolated cart session identifier (Logged-in customer ID or Guest Cart UUID) */
async function getCartSession(req: NextRequest): Promise<{ cartId: string; newGuestToken?: string }> {
  const db = getDb();
  
  // 1. Check logged-in customer session
  const customerToken = req.cookies.get("customer_session")?.value;
  if (customerToken) {
    try {
      const sess = (await db.execute({
        sql: "SELECT customer_id FROM sessions WHERE token=? AND expires > datetime('now')",
        args: [customerToken],
      })).rows[0] as unknown as { customer_id: string } | undefined;
      
      if (sess?.customer_id) {
        return { cartId: sess.customer_id };
      }
    } catch {}
  }

  // 2. Check per-browser guest cart session cookie
  const guestToken = req.cookies.get("cart_session")?.value;
  if (guestToken) {
    return { cartId: `guest_${guestToken}` };
  }

  // 3. Generate a brand new isolated guest cart token
  const newGuestToken = randomUUID();
  return { cartId: `guest_${newGuestToken}`, newGuestToken };
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { cartId, newGuestToken } = await getCartSession(req);

    const cart = (await db.execute({ sql: "SELECT items FROM cart WHERE customer_id=?", args: [cartId] })).rows[0] as unknown as { items: string } | undefined;
    const items = cart?.items ? JSON.parse(cart.items) : [];

    const res = NextResponse.json({ items });
    
    // Set guest cart session cookie if generated
    if (newGuestToken) {
      res.cookies.set("cart_session", newGuestToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 86400, // 30 days
      });
    }

    return res;
  } catch (e) {
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { cartId, newGuestToken } = await getCartSession(req);
    const { items } = await req.json();
    
    if (!Array.isArray(items)) {
      return NextResponse.json({ ok: false, error: "Invalid items format" }, { status: 400 });
    }

    const existing = (await db.execute({ sql: "SELECT id FROM cart WHERE customer_id=?", args: [cartId] })).rows[0];
    if (existing) {
      await db.execute({
        sql: "UPDATE cart SET items=?, updated_at=datetime('now') WHERE customer_id=?",
        args: [JSON.stringify(items), cartId],
      });
    } else {
      await db.execute({
        sql: "INSERT INTO cart (id, customer_id, items) VALUES (?, ?, ?)",
        args: [randomUUID(), cartId, JSON.stringify(items)],
      });
    }

    const res = NextResponse.json({ ok: true, cartId });
    if (newGuestToken) {
      res.cookies.set("cart_session", newGuestToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 86400,
      });
    }

    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const { cartId } = await getCartSession(req);

    await db.execute({ sql: "DELETE FROM cart WHERE customer_id=?", args: [cartId] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

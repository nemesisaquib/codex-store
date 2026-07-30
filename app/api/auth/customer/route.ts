import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import { createHash } from "crypto";

const hashPassword = (pwd: string) => createHash("sha256").update(pwd).digest("hex");
const SESSION_DAYS = 30;

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, firstName, lastName } = await req.json();
    const db = getDb();

    if (action === "register") {
      // Check if exists
      const exists = (await db.execute({ sql: "SELECT id FROM customers WHERE email=?", args: [email] })).rows[0];
      if (exists) return NextResponse.json({ ok: false, error: "Email already registered" }, { status: 400 });

      // Create customer
      const id = randomUUID();
      const hash = hashPassword(password);
      await db.execute({ sql: "INSERT INTO customers (id,email,first_name,last_name,password_hash,status,tier) VALUES (?,?,?,?,?,?,?)", args: [id, email, firstName || "Customer", lastName || "", hash, "active", "new"] });

      // Create session
      const token = randomUUID();
      const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
      await db.execute({ sql: "INSERT INTO sessions (token,customer_id,expires) VALUES (?,?,?)", args: [token, id, expires] });

      const res = NextResponse.json({ ok: true, customerId: id });
      res.cookies.set("customer_session", token, { httpOnly: true, maxAge: SESSION_DAYS * 86400, path: "/" });
      return res;
    }

    if (action === "login") {
      const cust = (await db.execute({ sql: "SELECT id,password_hash,first_name FROM customers WHERE email=?", args: [email] })).rows[0] as unknown as {id:string;password_hash:string;first_name:string}|undefined;
      if (!cust || cust.password_hash !== hashPassword(password)) {
        return NextResponse.json({ ok: false, error: "Invalid email or password" }, { status: 401 });
      }

      // Create session
      const token = randomUUID();
      const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
      await db.execute({ sql: "INSERT INTO sessions (token,customer_id,expires) VALUES (?,?,?)", args: [token, cust.id, expires] });

      const res = NextResponse.json({ ok: true, customerId: cust.id, name: cust.first_name });
      res.cookies.set("customer_session", token, { httpOnly: true, maxAge: SESSION_DAYS * 86400, path: "/" });
      return res;
    }

    return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const token = req.cookies.get("customer_session")?.value;
    if (!token) return NextResponse.json({ customer: null });

    // Check session
    const sess = (await db.execute({ sql: "SELECT customer_id,expires FROM sessions WHERE token=?", args: [token] })).rows[0] as unknown as {customer_id:string;expires:string}|undefined;
    if (!sess || new Date(sess.expires) < new Date()) {
      return NextResponse.json({ customer: null });
    }

    // Get customer
    const cust = (await db.execute({ sql: "SELECT id,email,first_name,last_name FROM customers WHERE id=?", args: [sess.customer_id] })).rows[0];
    return NextResponse.json({ customer: cust });
  } catch (e) {
    return NextResponse.json({ customer: null });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = getDb();
    const token = req.cookies.get("customer_session")?.value;
    if (token) {
      await db.execute({ sql: "DELETE FROM sessions WHERE token=?", args: [token] });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("customer_session", "", { httpOnly: true, maxAge: 0, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

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
      const exists = db.prepare("SELECT id FROM customers WHERE email=?").get(email);
      if (exists) return NextResponse.json({ ok: false, error: "Email already registered" }, { status: 400 });

      // Create customer
      const id = randomUUID();
      const hash = hashPassword(password);
      db.prepare(
        "INSERT INTO customers (id,email,first_name,last_name,password_hash,status,tier) VALUES (?,?,?,?,?,?,?)"
      ).run(id, email, firstName || "Customer", lastName || "", hash, "active", "new");

      // Create session
      const token = randomUUID();
      const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
      db.prepare("INSERT INTO sessions (token,customer_id,expires) VALUES (?,?,?)").run(token, id, expires);

      const res = NextResponse.json({ ok: true, customerId: id });
      res.cookies.set("customer_session", token, { httpOnly: true, maxAge: SESSION_DAYS * 86400, path: "/" });
      return res;
    }

    if (action === "login") {
      const cust = db.prepare("SELECT id,password_hash,first_name FROM customers WHERE email=?").get(email) as {id:string;password_hash:string;first_name:string}|undefined;
      if (!cust || cust.password_hash !== hashPassword(password)) {
        return NextResponse.json({ ok: false, error: "Invalid email or password" }, { status: 401 });
      }

      // Create session
      const token = randomUUID();
      const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
      db.prepare("INSERT INTO sessions (token,customer_id,expires) VALUES (?,?,?)").run(token, cust.id, expires);

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
    const sess = db.prepare("SELECT customer_id,expires FROM sessions WHERE token=?").get(token) as {customer_id:string;expires:string}|undefined;
    if (!sess || new Date(sess.expires) < new Date()) {
      return NextResponse.json({ customer: null });
    }

    // Get customer
    const cust = db.prepare("SELECT id,email,first_name,last_name FROM customers WHERE id=?").get(sess.customer_id);
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
      db.prepare("DELETE FROM sessions WHERE token=?").run(token);
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("customer_session", "", { httpOnly: true, maxAge: 0, path: "/" });
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

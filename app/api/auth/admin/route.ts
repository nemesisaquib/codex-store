import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const db = getDb();
    const admin = (await db.execute({ sql: "SELECT * FROM admin_users WHERE email=? AND password=?", args: [email, password] })).rows[0] as {id:string;name:string;email:string;role:string}|undefined;
    if (!admin) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    await db.execute({ sql: "UPDATE admin_users SET last_login=datetime('now') WHERE id=?", args: [admin.id] });

    const res = NextResponse.json({ ok: true, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
    res.cookies.set("admin_session", admin.id, {
      httpOnly: true, sameSite: "strict", path: "/",
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_session");
  return res;
}

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  const db = getDb();
  const admin = (await db.execute({ sql: "SELECT id,name,email,role,last_login FROM admin_users WHERE id=?", args: [session] })).rows[0] as {id:string;name:string;email:string;role:string;last_login:string}|undefined;
  if (!admin) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, admin });
}

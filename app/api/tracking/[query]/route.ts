import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ query: string }> }) {
  const { query } = await params;
  if (!query) {
    return NextResponse.json({ error: "Order or tracking number required" }, { status: 400 });
  }

  const db = getDb();
  const searchStr = decodeURIComponent(query).trim();

  try {
    // Find order by order_number or tracking_number or id
    const res = await db.execute({
      sql: "SELECT * FROM orders WHERE order_number = ? OR tracking_number = ? OR id = ? LIMIT 1",
      args: [searchStr, searchStr, searchStr]
    });

    const order = res.rows[0] as any;

    if (!order) {
      return NextResponse.json({ error: "Order or tracking number not found" }, { status: 404 });
    }

    // Fetch store shipping API carrier from settings DB
    const settingsRows = (await db.execute("SELECT key, value FROM settings WHERE key LIKE 'shipping_%'")).rows as { key: string; value: string }[];
    const settings = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));

    const carrier = settings.shipping_api_carrier || "DHL Express";
    const trackingNum = order.tracking_number || `TRK-${order.order_number.replace(/\D/g, "") || "849201948"}`;

    // Parse order date
    const orderDate = new Date(order.created_at || Date.now());
    const dayMs = 24 * 60 * 60 * 1000;

    // Generate realistic simulated tracking timeline events
    let events: any[] = [];
    const status = order.status || "pending";

    if (status === "pending") {
      events = [
        {
          status: "Order Placed & Verified",
          location: "E-shop Fulfillment Center",
          time: new Date(orderDate.getTime()).toLocaleString(),
          desc: "Order details received and sent to logistics warehouse.",
          done: true
        },
        {
          status: "Preparing for Dispatch",
          location: "Warehouse Packing Hub",
          time: "Pending",
          desc: "Items are being picked and packed for shipment.",
          done: false
        }
      ];
    } else if (status === "processing") {
      events = [
        {
          status: "Order Confirmed & Payment Verified",
          location: "E-shop HQ",
          time: new Date(orderDate.getTime()).toLocaleString(),
          desc: "Payment confirmed. Order queued for fulfillment.",
          done: true
        },
        {
          status: "Packed & Quality Inspected",
          location: "Logistics Hub Alpha",
          time: new Date(orderDate.getTime() + 0.3 * dayMs).toLocaleString(),
          desc: "Parcel sealed and labeled with tracking code.",
          done: true
        },
        {
          status: "Awaiting Carrier Pickup",
          location: `Carrier Facility (${carrier})`,
          time: new Date(orderDate.getTime() + 0.6 * dayMs).toLocaleString(),
          desc: `Courier driver dispatched for package pickup (${carrier}).`,
          done: false
        }
      ];
    } else if (status === "shipped") {
      events = [
        {
          status: "Order Confirmed",
          location: "E-shop Fulfillment Center",
          time: new Date(orderDate.getTime()).toLocaleString(),
          desc: "Order received.",
          done: true
        },
        {
          status: "Package Picked Up by Carrier",
          location: `${carrier} Sorting Hub`,
          time: new Date(orderDate.getTime() + 0.5 * dayMs).toLocaleString(),
          desc: `Manifest scanned by ${carrier}. Parcel in transit.`,
          done: true
        },
        {
          status: "In Transit at International Sorting Gateway",
          location: "Regional Distribution Center",
          time: new Date(orderDate.getTime() + 1.2 * dayMs).toLocaleString(),
          desc: "Parcel departed sorting facility en route to local hub.",
          done: true
        },
        {
          status: "Out for Delivery",
          location: "Local Courier Hub",
          time: "Expected Today by 6:00 PM",
          desc: "Driver is on the way to your delivery address.",
          done: false
        }
      ];
    } else if (status === "delivered") {
      events = [
        {
          status: "Order Confirmed",
          location: "E-shop Fulfillment Center",
          time: new Date(orderDate.getTime()).toLocaleString(),
          desc: "Order processed.",
          done: true
        },
        {
          status: "In Transit",
          location: `${carrier} Transit Depot`,
          time: new Date(orderDate.getTime() + 1 * dayMs).toLocaleString(),
          desc: "Parcel cleared customs & regional distribution.",
          done: true
        },
        {
          status: "Out for Delivery",
          location: "Local Courier Vehicle",
          time: new Date(orderDate.getTime() + 2 * dayMs).toLocaleString(),
          desc: "Courier out for final delivery attempt.",
          done: true
        },
        {
          status: "Delivered",
          location: order.shipping_address || "Customer Address",
          time: new Date(orderDate.getTime() + 2.5 * dayMs).toLocaleString(),
          desc: "Signed for by customer. Delivery complete.",
          done: true
        }
      ];
    } else {
      events = [
        {
          status: `Status: ${status.toUpperCase()}`,
          location: "Logistics Hub",
          time: new Date(orderDate.getTime()).toLocaleString(),
          desc: `Order status is currently ${status}.`,
          done: true
        }
      ];
    }

    return NextResponse.json({
      order_number: order.order_number,
      tracking_number: trackingNum,
      carrier,
      status: order.status,
      customer_name: order.customer_name,
      shipping_address: order.shipping_address,
      estimated_delivery: new Date(orderDate.getTime() + 3 * dayMs).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      events
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

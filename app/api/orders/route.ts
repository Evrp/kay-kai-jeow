import { NextResponse } from "next/server";
import { createOrder, getOrders } from "@/lib/services/orderService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lineUserId, customerName, items, note, deliveryAddress, paymentMethod } = body;

    if (!lineUserId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid order parameters: lineUserId and items are required" },
        { status: 400 }
      );
    }

    const order = await createOrder({
      lineUserId,
      customerName,
      items,
      note,
      deliveryAddress,
      paymentMethod,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Error creating order via API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get("lineUserId") || undefined;
    const status = searchParams.get("status") || undefined;

    const orders = await getOrders({ lineUserId, status });
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

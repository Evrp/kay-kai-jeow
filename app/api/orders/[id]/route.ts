import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrderStatus } from "@/lib/services/orderService";
import { verifyAdminAuth } from "@/lib/middleware/adminAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching single order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, paymentStatus } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Missing required parameter: status" },
        { status: 400 }
      );
    }

    const updatedOrder = await updateOrderStatus(id, status, paymentStatus);

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("Error patching order status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update order status" },
      { status: 500 }
    );
  }
}

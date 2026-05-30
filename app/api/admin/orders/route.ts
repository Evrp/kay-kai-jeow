import { NextRequest, NextResponse } from "next/server";
import { getOrders } from "@/lib/services/orderService";
import { verifyAdminAuth } from "@/lib/middleware/adminAuth";

export async function GET(request: NextRequest) {
  try {
    // 1. Verify admin authorization
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const lineUserId = searchParams.get("lineUserId") || undefined;

    const orders = await getOrders({ status, lineUserId });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error in admin orders retrieval:", error);
    return NextResponse.json(
      { error: "Failed to retrieve orders" },
      { status: 500 }
    );
  }
}

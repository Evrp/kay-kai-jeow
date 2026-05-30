import { NextRequest, NextResponse } from "next/server";
import { getAllMenus, createMenu } from "@/lib/services/menuService";
import { verifyAdminAuth } from "@/lib/middleware/adminAuth";

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const menus = await getAllMenus();
    return NextResponse.json({ menus });
  } catch (error) {
    console.error("Error in admin menu retrieval:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const menu = await createMenu(body);
    
    return NextResponse.json({ menu }, { status: 201 });
  } catch (error) {
    console.error("Error creating menu via admin API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create menu" },
      { status: 500 }
    );
  }
}

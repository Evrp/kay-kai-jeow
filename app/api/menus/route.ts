import { NextResponse } from "next/server";
import { getAvailableMenus, createMenu } from "@/lib/services/menuService";

export async function GET() {
  try {
    const menus = await getAvailableMenus();
    return NextResponse.json({ menus });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const menu = await createMenu(body);
    return NextResponse.json({ menu }, { status: 201 });
  } catch (error) {
    console.error("Error creating menu:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create menu" },
      { status: 500 }
    );
  }
}

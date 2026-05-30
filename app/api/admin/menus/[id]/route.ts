import { NextRequest, NextResponse } from "next/server";
import { updateMenu, deleteMenu } from "@/lib/services/menuService";
import { verifyAdminAuth } from "@/lib/middleware/adminAuth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const updatedMenu = await updateMenu(id, body);

    if (!updatedMenu) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ menu: updatedMenu });
  } catch (error) {
    console.error("Error updating menu via admin API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update menu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await deleteMenu(id);

    if (!deleted) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Menu item successfully deleted" });
  } catch (error) {
    console.error("Error deleting menu via admin API:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}

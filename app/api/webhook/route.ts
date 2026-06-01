import { NextRequest, NextResponse } from "next/server";
import {
  verifyLineSignature,
  replyMessage,
  menuFlexMessage,
  orderConfirmFlexMessage,
} from "@/lib/services/lineService";
import { getAvailableMenus, getMenuById } from "@/lib/services/menuService";
import {
  createOrder,
  getLatestOrderByUser,
  updateOrderStatus,
  getOrderById,
} from "@/lib/services/orderService";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    // 1. Verify LINE Signature
    if (!verifyLineSignature(rawBody, signature)) {
      console.warn("Unauthorized webhook request: invalid LINE signature");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { events } = JSON.parse(rawBody);

    if (!events || events.length === 0) {
      return NextResponse.json({ message: "OK" });
    }

    // 2. Process events
    for (const event of events) {
      const lineUserId = event.source?.userId;
      if (!lineUserId) continue;

      // Handle Text Messages
      if (event.type === "message" && event.message.type === "text") {
        const text = event.message.text.trim();
        await handleTextIntent(text, event.replyToken, lineUserId);
      }

      // Handle Postbacks (From Flex Message buttons)
      if (event.type === "postback") {
        const data = event.postback.data;
        await handlePostback(data, event.replyToken, lineUserId);
      }
    }

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Error handling LINE Webhook:", error);
    // Always return 200 to LINE to avoid webhook retries on minor application errors
    return NextResponse.json({ message: "Internal Server Error" }, { status: 200 });
  }
}

/**
 * Parses user text inputs to match BROWSE_MENU or CHECK_ORDER intents
 */
async function handleTextIntent(text: string, replyToken: string, lineUserId: string) {
  const browseIntents = ["สั่ง", "สั่งอาหาร", "เมนู", "order", "menu"];
  const checkIntents = ["ออเดอร์ของฉัน", "ดูออเดอร์", "สถานะออเดอร์", "status", "check order"];

  const textLower = text.toLowerCase();

  // A. Browse Menu Intent
  if (browseIntents.some((intent) => textLower.includes(intent))) {
    const menus = await getAvailableMenus();
    const flexMessage = menuFlexMessage(menus);
    await replyMessage(replyToken, [flexMessage]);
    return;
  }

  // B. Check Order Intent
  if (checkIntents.some((intent) => textLower.includes(intent))) {
    const latestOrder = await getLatestOrderByUser(lineUserId);

    if (!latestOrder) {
      await replyMessage(replyToken, [
        {
          type: "text",
          text: "คุณยังไม่มีประวัติการสั่งซื้อกับเราเลยค่ะ 🍳 พิมพ์ 'สั่งอาหาร' เพื่อลิ้มลองเมนูไข่เจียวแสนอร่อยได้ทันที!",
        },
      ]);
      return;
    }

    // Translate status
    const statusTranslations: Record<string, string> = {
      pending: "รอร้านค้ากดยืนยัน",
      confirmed: "ยืนยันออเดอร์แล้ว",
      preparing: "กำลังปรุงอาหารอย่างพิถีพิถัน",
      ready: "อาหารปรุงเสร็จเรียบร้อยพร้อมเสิร์ฟ/พร้อมส่ง",
      completed: "เสร็จสมบูรณ์ อร่อยเต็มคำ",
      cancelled: "ยกเลิกออเดอร์แล้ว",
    };

    const statusText = statusTranslations[latestOrder.status] || latestOrder.status;
    const itemsSummary = latestOrder.items
      .map((item) => `- ${item.name} x${item.quantity}`)
      .join("\n");

    const message = `ออเดอร์ล่าสุดของคุณ: #${latestOrder.orderId}\n\nรายการอาหาร:\n${itemsSummary}\n\nยอดรวม: ฿${latestOrder.totalPrice}\nสถานะออเดอร์: ${statusText}\nจัดส่งที่: ${latestOrder.deliveryAddress}\nวิธีชำระเงิน: เก็บเงินปลายทาง (COD)\n\nพิมพ์ 'ดูออเดอร์' อีกครั้งเพื่ออัปเดตสถานะล่าสุดนะคะ 😊`;

    await replyMessage(replyToken, [{ type: "text", text: message }]);
    return;
  }

  // C. Fallback instruction message
  const fallbackMessage = {
    type: "text",
    text: "สวัสดีค่ะ ยินดีต้อนรับสู่ร้านไข่เจียวปรุงสดใหม่! 🍳✨\n\n👉 พิมพ์ 'สั่งอาหาร' หรือ 'เมนู' เพื่อเลือกเมนูทั้งหมด\n👉 พิมพ์ 'ดูออเดอร์' เพื่อตรวจสอบออเดอร์ล่าสุดของคุณค่ะ",
  };
  await replyMessage(replyToken, [fallbackMessage]);
}

/**
 * Handles action callbacks from buttons in Flex Messages
 */
async function handlePostback(data: string, replyToken: string, lineUserId: string) {
  const params = new URLSearchParams(data);
  const action = params.get("action");

  if (!action) return;

  // 1. PLACE_ORDER Action (Customer selects "สั่งเลย" on a Menu item)
  if (action === "order") {
    const menuId = params.get("menuId");
    if (!menuId) return;

    // Validate menu is still available before creating order
    // (Old Flex Messages in chat can trigger orders for disabled menus)
    const menu = await getMenuById(menuId);
    if (!menu || !menu.isAvailable) {
      await replyMessage(replyToken, [
        {
          type: "text",
          text: "ขออภัยค่ะ เมนูนี้ปิดรับออเดอร์ชั่วคราว กรุณาพิมพ์ 'สั่ง' เพื่อดูเมนูที่เปิดอยู่",
        },
      ]);
      return;
    }

    // Fetch user profile display name
    let displayName = "ลูกค้า LINE";
    try {
      const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
      const response = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const profile = await response.json();
        displayName = profile.displayName;
      }
    } catch (err) {
      console.error("Failed to fetch customer profile details:", err);
    }

    // Create a pending order with 1 qty of selected menu item
    const order = await createOrder({
      lineUserId,
      customerName: displayName,
      items: [
        {
          menuId,
          quantity: 1,
          selectedOptions: [], // Default empty options in chatbot simple order
        },
      ],
      deliveryAddress: "รับที่ร้าน",
      paymentMethod: "cod",
    });

    // Send order confirmation Flex Message asking user to confirm
    const confirmationFlex = orderConfirmFlexMessage(order);
    await replyMessage(replyToken, [confirmationFlex]);
    return;
  }

  // 2. CONFIRM_ORDER Action
  if (action === "confirm_order") {
    const orderId = params.get("orderId");
    if (!orderId) return;

    const order = await getOrderById(orderId);
    if (!order) return;

    // Validate that order is in 'pending' status
    if (order.status !== "pending") {
      const statusTranslations: Record<string, string> = {
        confirmed: "ได้รับการยืนยันและกำลังเตรียมวัตถุดิบแล้วค่ะ 🍳",
        preparing: "กำลังปรุงอาหารอยู่ค่ะ 👩‍🍳",
        ready: "ปรุงเสร็จพร้อมจัดส่งแล้วค่ะ 📦",
        completed: "เสร็จสมบูรณ์แล้วค่ะ 🥰",
        cancelled: "ถูกยกเลิกแล้วค่ะ ❌",
      };

      const currentStatusText = statusTranslations[order.status] || order.status;

      await replyMessage(replyToken, [
        {
          type: "text",
          text: `❌ ไม่สามารถดำเนินการได้: ออเดอร์ #${order.orderId} นี้ได้รับการประมวลผลไปแล้วค่ะ\n(สถานะปัจจุบัน: ${currentStatusText})\n\nหากต้องการตรวจสอบสถานะล่าสุด สามารถพิมพ์ 'ดูออเดอร์' หรือสอบถามแอดมินได้ตลอดเวลานะคะ`,
        },
      ]);
      return;
    }

    const updatedOrder = await updateOrderStatus(orderId, "confirmed");

    if (updatedOrder) {
      await replyMessage(replyToken, [
        {
          type: "text",
          text: `🎉 ยืนยันออเดอร์ #${updatedOrder.orderId} สำเร็จแล้วค่ะ!\n\nทางร้านกำลังรีบจัดการและปรุงอาหารให้โดยเร็วที่สุด สามารถกด 'ดูออเดอร์' เพื่อติดตามขั้นตอนได้ตลอดเวลานะคะ`,
        },
      ]);
    }
    return;
  }

  // 3. CANCEL_ORDER Action
  if (action === "cancel_order") {
    const orderId = params.get("orderId");
    if (!orderId) return;

    const order = await getOrderById(orderId);
    if (!order) return;

    // Validate that order is in 'pending' status
    if (order.status !== "pending") {
      const statusTranslations: Record<string, string> = {
        confirmed: "ได้รับการยืนยันและกำลังเตรียมวัตถุดิบแล้วค่ะ 🍳",
        preparing: "กำลังปรุงอาหารอยู่ค่ะ 👩‍🍳",
        ready: "ปรุงเสร็จพร้อมจัดส่งแล้วค่ะ 📦",
        completed: "เสร็จสมบูรณ์แล้วค่ะ 🥰",
        cancelled: "ถูกยกเลิกแล้วค่ะ ❌",
      };

      const currentStatusText = statusTranslations[order.status] || order.status;

      await replyMessage(replyToken, [
        {
          type: "text",
          text: `❌ ไม่สามารถดำเนินการได้: ออเดอร์ #${order.orderId} นี้ได้รับการประมวลผลไปแล้วค่ะ\n(สถานะปัจจุบัน: ${currentStatusText})\n\nจึงไม่สามารถยกเลิกออเดอร์ได้แล้วในขณะนี้ค่ะ`,
        },
      ]);
      return;
    }

    const updatedOrder = await updateOrderStatus(orderId, "cancelled");

    if (updatedOrder) {
      await replyMessage(replyToken, [
        {
          type: "text",
          text: `❌ ยกเลิกออเดอร์ #${updatedOrder.orderId} สำเร็จแล้วค่ะ\n\nหากต้องการสั่งอาหารอีกครั้ง สามารถพิมพ์ 'เมนู' หรือ 'สั่งอาหาร' ได้เสมอนะคะ ทางร้านยินดีให้บริการค่ะ`,
        },
      ]);
    }
    return;
  }
}

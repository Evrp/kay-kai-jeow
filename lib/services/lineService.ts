import crypto from "crypto";
import { IMenu } from "../models/Menu";
import { IOrder } from "../models/Order";

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Verifies that the request payload comes genuinely from LINE
 */
export function verifyLineSignature(body: string, signature: string): boolean {
  if (!LINE_CHANNEL_SECRET) {
    console.error("LINE_CHANNEL_SECRET is not configured");
    return false;
  }
  const hash = crypto
    .createHmac("sha256", LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  return hash === signature;
}

/**
 * Sends a reply message to LINE using replyToken
 */
export async function replyMessage(replyToken: string, messages: any[]): Promise<void> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
    return;
  }

  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Failed to reply to LINE:", errText);
    throw new Error(`LINE Reply Error: ${errText}`);
  }
}

/**
 * Sends a push message to a specific LINE user ID
 */
export async function pushMessage(to: string, messages: any[]): Promise<void> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
    return;
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Failed to push to LINE:", errText);
    throw new Error(`LINE Push Error: ${errText}`);
  }
}

/**
 * Helper to construct a beautiful Flex Message Carousel of available menus
 */
export function menuFlexMessage(menus: IMenu[]): any {
  if (menus.length === 0) {
    return {
      type: "text",
      text: "ขออภัยด้วยค่ะ ขณะนี้ทางร้านยังไม่มีเมนูที่พร้อมให้บริการ",
    };
  }

  const bubbles = menus.map((menu) => {
    const defaultImage = "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80"; // Beautiful fallback omelette/food image
    const imageUrl = menu.imageUrl || defaultImage;

    return {
      type: "bubble",
      hero: {
        type: "image",
        url: imageUrl,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: menu.name,
            weight: "bold",
            size: "xl",
            color: "#1F2937",
          },
          {
            type: "text",
            text: menu.description || "ไข่เจียวปรุงพิเศษ รสชาติกลมกล่อม",
            size: "sm",
            color: "#6B7280",
            margin: "md",
            wrap: true,
          },
          {
            type: "box",
            layout: "baseline",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: `฿${menu.price}`,
                weight: "bold",
                size: "xxl",
                color: "#F59E0B",
                flex: 0,
              },
              {
                type: "text",
                text: "บาท",
                size: "sm",
                color: "#9CA3AF",
                margin: "sm",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#10B981",
            action: {
              type: "postback",
              label: "สั่งเลย",
              data: `action=order&menuId=${menu._id}&qty=1`,
              displayText: `ฉันอยากสั่ง ${menu.name}`,
            },
          },
          {
            type: "button",
            style: "link",
            color: "#4F46E5",
            action: {
              type: "uri",
              label: "ดูแบบจัดเต็ม (LIFF)",
              uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID || "dummy"}/order?menuId=${menu._id}`,
            },
          },
        ],
      },
    };
  });

  return {
    type: "flex",
    altText: "รายการเมนูของร้าน",
    contents: {
      type: "carousel",
      contents: bubbles.slice(0, 10), // LINE Carousel supports up to 10 bubbles
    },
  };
}

/**
 * Constructs a Flex Message summarizing the order details and asking for confirmation
 */
export function orderConfirmFlexMessage(order: IOrder): any {
  const itemContents = order.items.map((item) => {
    const optionsText = item.selectedOptions
      .map((opt) => `${opt.label}: ${opt.choice}`)
      .join(", ");
    
    const details = [
      {
        type: "text",
        text: `${item.name} x${item.quantity}`,
        weight: "bold",
        color: "#374151",
        size: "sm",
      },
    ];

    if (optionsText) {
      details.push({
        type: "text",
        text: `(${optionsText})`,
        color: "#6B7280",
        size: "xs",
      } as any);
    }

    return {
      type: "box",
      layout: "horizontal",
      margin: "md",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: details,
        },
        {
          type: "text",
          text: `฿${item.subtotal}`,
          align: "end",
          weight: "bold",
          color: "#374151",
          size: "sm",
        },
      ],
    };
  });

  return {
    type: "flex",
    altText: "ยืนยันการสั่งซื้อออเดอร์ของคุณ",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "สรุปรายการสั่งซื้อ",
            weight: "bold",
            size: "xl",
            color: "#1F2937",
          },
          {
            type: "text",
            text: `เลขที่ออเดอร์: ${order.orderId || "กำลังประมวลผล..."}`,
            size: "xs",
            color: "#9CA3AF",
            margin: "xs",
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            contents: itemContents,
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "ยอดรวมทั้งหมด",
                weight: "bold",
                size: "md",
                color: "#1F2937",
              },
              {
                type: "text",
                text: `฿${order.totalPrice}`,
                align: "end",
                weight: "bold",
                size: "lg",
                color: "#F59E0B",
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            backgroundColor: "#F3F4F6",
            paddingAll: "md",
            cornerRadius: "sm",
            contents: [
              {
                type: "text",
                text: `การจัดส่ง: ${order.deliveryAddress || "รับที่ร้าน"}`,
                size: "xs",
                color: "#4B5563",
                wrap: true,
              },
              {
                type: "text",
                text: `การชำระเงิน: เก็บเงินปลายทาง (COD)`,
                size: "xs",
                color: "#4B5563",
                margin: "xs",
              },
              ...(order.note
                ? [
                    {
                      type: "text",
                      text: `หมายเหตุ: ${order.note}`,
                      size: "xs",
                      color: "#4B5563",
                      margin: "xs",
                      wrap: true,
                    },
                  ]
                : []),
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        spacing: "md",
        contents: [
          {
            type: "button",
            style: "secondary",
            color: "#EF4444",
            action: {
              type: "postback",
              label: "ยกเลิก",
              data: `action=cancel_order&orderId=${order._id}`,
              displayText: "ขอยกเลิกออเดอร์นี้ค่ะ",
            },
          },
          {
            type: "button",
            style: "primary",
            color: "#10B981",
            action: {
              type: "postback",
              label: "ยืนยันสั่งซื้อ",
              data: `action=confirm_order&orderId=${order._id}`,
              displayText: "ฉันขอยืนยันการสั่งซื้อนี้ค่ะ",
            },
          },
        ],
      },
    },
  };
}

/**
 * Pushes status notification update to a customer when their order changes state
 */
export async function pushOrderStatusUpdate(order: IOrder): Promise<void> {
  const { lineUserId, orderId, status } = order;

  let messageText = "";
  let subText = "";

  switch (status) {
    case "confirmed":
      messageText = `✅ ออเดอร์ #${orderId} ของคุณได้รับการยืนยันเรียบร้อยแล้วค่ะ`;
      subText = "ร้านค้ากำลังเตรียมวัตถุดิบและเริ่มต้นขั้นตอนการปรุงอาหาร";
      break;
    case "preparing":
      messageText = `🍳 ร้านค้ากำลังปรุงอาหารเมนูออเดอร์ #${orderId} ของคุณอย่างพิถีพิถัน`;
      subText = "ไข่เจียวหอมกรุ่นปรุงสดใหม่จะเสร็จพร้อมเสิร์ฟใน ~15 นาทีค่ะ";
      break;
    case "ready":
      messageText = `📦 ออเดอร์ #${orderId} ของคุณพร้อมรับประทาน/จัดส่งเรียบร้อยแล้วค่ะ!`;
      subText = "กรุณาเตรียมตัวรับอาหารแสนอร่อยได้เลยค่ะ";
      break;
    case "completed":
      messageText = `🎉 ออเดอร์ #${orderId} เสร็จสิ้นสมบูรณ์เรียบร้อยแล้วค่ะ`;
      subText = "ขอบคุณที่อุดหนุนร้านไข่เจียวของเรานะคะ ทานให้อร่อยค่ะ! 🥰";
      break;
    case "cancelled":
      messageText = `❌ ออเดอร์ #${orderId} ได้ถูกยกเลิกแล้วค่ะ`;
      subText = "หากมีข้อสงสัยเพิ่มเติมหรือข้อผิดพลาด สามารถติดต่อสอบถามแอดมินผ่านช่องแชทได้ทันทีค่ะ";
      break;
    default:
      return;
  }

  const messages = [
    {
      type: "text",
      text: `${messageText}\n\n${subText}`,
    },
  ];

  await pushMessage(lineUserId, messages);
}

/**
 * Pushes real-time alerts to the owner (if OWNER_LINE_USER_ID is configured) when a new order is placed
 */
export async function pushNewOrderNotificationToOwner(order: IOrder): Promise<void> {
  const ownerId = process.env.OWNER_LINE_USER_ID;
  if (!ownerId) {
    return;
  }

  const itemsSummary = order.items
    .map((item) => `- ${item.name} x${item.quantity}`)
    .join("\n");

  const message = {
    type: "text",
    text: `🔔 มีออเดอร์ใหม่เข้ามา! [${order.orderId}]\n\nลูกค้า: ${order.customerName || "LINE User"}\nรายการ:\n${itemsSummary}\nรวม: ฿${order.totalPrice}\nที่อยู่/การส่ง: ${order.deliveryAddress}\n\nกรุณาตรวจสอบที่หน้าแดชบอร์ด:\n${NEXT_PUBLIC_APP_URL}/admin`,
  };

  await pushMessage(ownerId, [message]);
}

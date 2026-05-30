import { connectToDatabase } from "../db";
import Order, { IOrder, IOrderItem } from "../models/Order";
import Menu from "../models/Menu";
import Customer from "../models/Customer";
import { pushOrderStatusUpdate, pushNewOrderNotificationToOwner } from "./lineService";

/**
 * Generates a sequential order ID in the format: ORD-YYYYMMDD-XXX
 * Resets daily based on Thailand (Asia/Bangkok) timezone.
 */
export async function generateDailyOrderId(): Promise<string> {
  await connectToDatabase();

  // Get current date formatted in Asia/Bangkok
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === "year")?.value;
  const month = parts.find(p => p.type === "month")?.value;
  const day = parts.find(p => p.type === "day")?.value;
  
  const yyyymmdd = `${year}${month}${day}`;

  // Start & End of Thailand day in UTC
  const startOfDay = new Date(`${year}-${month}-${day}T00:00:00.000+07:00`);
  const endOfDay = new Date(`${year}-${month}-${day}T23:59:59.999+07:00`);

  const count = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const nextSeq = String(count + 1).padStart(3, "0");
  return `ORD-${yyyymmdd}-${nextSeq}`;
}

export async function createOrder(orderData: {
  lineUserId: string;
  customerName?: string;
  items: Array<{
    menuId: string;
    quantity: number;
    selectedOptions: Array<{ label: string; choice: string; priceAdded: number }>;
  }>;
  note?: string;
  deliveryAddress?: string;
  paymentMethod?: "cod" | "transfer" | "linepay";
}): Promise<IOrder> {
  await connectToDatabase();

  let totalPrice = 0;
  const processedItems: IOrderItem[] = [];

  for (const item of orderData.items) {
    const menu = await Menu.findById(item.menuId);
    if (!menu) {
      throw new Error(`Menu item not found: ${item.menuId}`);
    }

    const optionsCost = item.selectedOptions.reduce((acc, opt) => acc + opt.priceAdded, 0);
    const unitPrice = menu.price;
    const finalUnitPrice = unitPrice + optionsCost;
    const subtotal = finalUnitPrice * item.quantity;

    processedItems.push({
      menuId: menu._id as any,
      name: menu.name,
      quantity: item.quantity,
      unitPrice: finalUnitPrice,
      selectedOptions: item.selectedOptions.map(opt => ({
        label: opt.label,
        choice: opt.choice,
        priceAdded: opt.priceAdded,
      })),
      subtotal,
    });

    totalPrice += subtotal;
  }

  const orderId = await generateDailyOrderId();

  const newOrder = new Order({
    orderId,
    lineUserId: orderData.lineUserId,
    customerName: orderData.customerName,
    items: processedItems,
    totalPrice,
    note: orderData.note,
    deliveryAddress: orderData.deliveryAddress || "รับที่ร้าน",
    status: "pending",
    paymentMethod: orderData.paymentMethod || "cod",
    paymentStatus: "unpaid",
  });

  const savedOrder = await newOrder.save();

  // Increment total orders and update customer stats
  await Customer.findOneAndUpdate(
    { lineUserId: orderData.lineUserId },
    {
      $setOnInsert: { displayName: orderData.customerName || "Customer" },
      $inc: { totalOrders: 1 },
      $set: { lastOrderAt: new Date() },
    },
    { upsert: true, returnDocument: "after" }
  );

  // Send push notification to the owner about a new order!
  try {
    await pushNewOrderNotificationToOwner(savedOrder);
  } catch (err) {
    console.error("Failed to push order notification to owner:", err);
  }

  return savedOrder;
}

export async function getOrderById(id: string): Promise<IOrder | null> {
  await connectToDatabase();
  return Order.findById(id).populate("items.menuId").exec();
}

export async function getOrderByOrderId(orderId: string): Promise<IOrder | null> {
  await connectToDatabase();
  return Order.findOne({ orderId }).exec();
}

export async function getLatestOrderByUser(lineUserId: string): Promise<IOrder | null> {
  await connectToDatabase();
  return Order.findOne({ lineUserId }).sort({ createdAt: -1 }).exec();
}

export async function getOrders(filter: {
  status?: string;
  lineUserId?: string;
} = {}): Promise<IOrder[]> {
  await connectToDatabase();
  const query: any = {};
  if (filter.status) query.status = filter.status;
  if (filter.lineUserId) query.lineUserId = filter.lineUserId;

  return Order.find(query).sort({ createdAt: -1 }).exec();
}

export async function updateOrderStatus(
  id: string,
  status: IOrder["status"],
  paymentStatus?: IOrder["paymentStatus"]
): Promise<IOrder | null> {
  await connectToDatabase();

  const updateData: any = { status };
  if (paymentStatus) {
    updateData.paymentStatus = paymentStatus;
  } else if (status === "completed") {
    // If order is completed, mark payment as paid if cod or transfer
    updateData.paymentStatus = "paid";
  }

  const updatedOrder = await Order.findByIdAndUpdate(id, updateData, { returnDocument: "after" }).exec();

  if (updatedOrder) {
    // Push LINE status update to customer
    try {
      await pushOrderStatusUpdate(updatedOrder);
    } catch (err) {
      console.error(`Failed to push LINE notification for order status change of ${updatedOrder.orderId}:`, err);
    }
  }

  return updatedOrder;
}

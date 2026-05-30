import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISelectedOption {
  label: string;
  choice: string;
  priceAdded: number;
}

export interface IOrderItem {
  menuId: mongoose.Types.ObjectId;
  name: string; // Snapshot menu name when ordering
  quantity: number;
  unitPrice: number;
  selectedOptions: ISelectedOption[];
  subtotal: number;
}

export interface IOrder extends Document {
  orderId: string; // "ORD-20260601-001"
  lineUserId: string;
  customerName?: string;
  items: IOrderItem[];
  totalPrice: number;
  note?: string;
  deliveryAddress?: string; // or "รับที่ร้าน"
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  paymentMethod: "cod" | "transfer" | "linepay";
  paymentStatus: "unpaid" | "paid";
  createdAt: Date;
  updatedAt: Date;
}

const SelectedOptionSchema = new Schema<ISelectedOption>({
  label: { type: String, required: true },
  choice: { type: String, required: true },
  priceAdded: { type: Number, required: true, default: 0 },
});

const OrderItemSchema = new Schema<IOrderItem>({
  menuId: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  selectedOptions: [SelectedOptionSchema],
  subtotal: { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, unique: true, sparse: true }, // Optional or sparse to allow pre-saves or daily generation
    lineUserId: { type: String, required: true, index: true },
    customerName: { type: String },
    items: [OrderItemSchema],
    totalPrice: { type: Number, required: true },
    note: { type: String },
    deliveryAddress: { type: String, default: "รับที่ร้าน" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "transfer", "linepay"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
  },
  { timestamps: true }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;

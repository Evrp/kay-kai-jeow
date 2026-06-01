import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomer extends Document {
  lineUserId: string;
  displayName?: string;
  pictureUrl?: string;
  totalOrders: number;
  lastOrderAt?: Date;
  welcomeSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    lineUserId: { type: String, unique: true, required: true, index: true },
    displayName: { type: String },
    pictureUrl: { type: String },
    totalOrders: { type: Number, default: 0 },
    lastOrderAt: { type: Date },
    welcomeSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChoice {
  name: string;
  priceAdded: number;
}

export interface IMenuOption {
  label: string;
  choices: IChoice[];
}

export interface IMenu extends Document {
  name: string;
  description?: string;
  price: number;
  category: "main" | "drink" | "extra";
  imageUrl?: string;
  isAvailable: boolean;
  options: IMenuOption[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChoiceSchema = new Schema<IChoice>({
  name: { type: String, required: true },
  priceAdded: { type: Number, required: true, default: 0 },
});

const MenuOptionSchema = new Schema<IMenuOption>({
  label: { type: String, required: true },
  choices: [ChoiceSchema],
});

const MenuSchema = new Schema<IMenu>(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, enum: ["main", "drink", "extra"], default: "main" },
    imageUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
    options: [MenuOptionSchema],
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Prevent compiling model multiple times during development hot-reloads
const Menu: Model<IMenu> = mongoose.models.Menu || mongoose.model<IMenu>("Menu", MenuSchema);

export default Menu;

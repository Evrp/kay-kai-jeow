import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// 1. Standalone Env Loader for .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    
    const parts = trimmed.split("=");
    const key = parts[0]?.trim();
    let val = parts.slice(1).join("=").trim();
    
    if (key) {
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

// 2. Define Schema locally in script to run standalone without Next.js bundling issues
const MenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { type: String, default: "main" },
  imageUrl: String,
  isAvailable: { type: Boolean, default: true },
  options: [{
    label: String,
    choices: [{ name: String, priceAdded: Number }]
  }],
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

const Menu = mongoose.models.Menu || mongoose.model("Menu", MenuSchema);

const initialMenus = [
  {
    name: "ไข่เจียวหมูสับ",
    description: "ไข่เจียวกรอบนอกนุ่มใน ใส่หมูสับเน้นๆ เสิร์ฟเคียงพร้อมข้าวสวยร้อนๆ",
    price: 60,
    category: "main",
    imageUrl: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    sortOrder: 1,
    options: [
      {
        label: "เพิ่มไข่",
        choices: [
          { name: "ไม่เพิ่ม", priceAdded: 0 },
          { name: "+1 ฟอง", priceAdded: 10 }
        ]
      },
      {
        label: "ความเผ็ด",
        choices: [
          { name: "ไม่เผ็ด", priceAdded: 0 },
          { name: "เผ็ดน้อย", priceAdded: 0 },
          { name: "เผ็ดกลาง", priceAdded: 0 },
          { name: "เผ็ดมาก", priceAdded: 0 }
        ]
      }
    ]
  },
  {
    name: "ไข่เจียวชะอม",
    description: "ไข่เจียวใส่ชะอมหอมกรุ่น ปรุงรสด้วยน้ำปลาดีเสิร์ฟเคียงคู่น้ำพริกกะปิและข้าวสวย",
    price: 65,
    category: "main",
    imageUrl: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    sortOrder: 2,
    options: [
      {
        label: "ท็อปปิ้งเสริม",
        choices: [
          { name: "ไม่มี", priceAdded: 0 },
          { name: "เพิ่มกุ้งสับ", priceAdded: 25 },
          { name: "เพิ่มหมูสับ", priceAdded: 15 }
        ]
      }
    ]
  },
  {
    name: "น้ำลำไยมีเนื้อ",
    description: "น้ำลำไยต้มสดรสชาติหวานกำลังดี พร้อมเนื้อลำไยชิ้นโตจุใจ แช่เย็นชื่นใจ",
    price: 30,
    category: "drink",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    sortOrder: 3,
    options: []
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI is not defined in environment variables!");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected successfully!");

  console.log("Clearing existing menus...");
  await Menu.deleteMany({});
  console.log("Cleared existing items.");

  console.log("Seeding initial menu catalog items...");
  const inserted = await Menu.insertMany(initialMenus);
  console.log(`Seeded ${inserted.length} menus successfully!`);

  console.log("Closing connection...");
  await mongoose.connection.close();
  console.log("Database seed completed successfully! 🍳✨");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Database seed failed with error:", err);
  process.exit(1);
});

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-context -->
# Project Overview & Architecture

## What this project does
โปรเจกต์นี้คือระบบร้านอาหารออนไลน์ (ร้านไข่เจียวปรุงสดใหม่ "เก๋ไก๋เจียว") ที่เชื่อมต่อกับ LINE Official Account (LINE OA) โดยสมบูรณ์ ลูกค้าสามารถสั่งอาหาร ดูรายการเมนู เช็คสถานะออเดอร์ผ่าน LINE OA Chatbot และ Admin สามารถเข้าจัดการออเดอร์/เมนูอาหารได้ผ่านระบบหลังบ้าน

## Directory Structure
- `app/` - Next.js (App Router) Pages & API Routes
  - `app/api/webhook/route.ts` - LINE OA Webhook endpoint หลักที่คอยรับ payload/postback จาก LINE
  - `app/api/orders/` - APIs สำหรับการเข้าถึงและจัดการออเดอร์ของ Admin
  - `app/admin/` - Admin Dashboard (UI)
- `lib/` - Shared business logic and utilities
  - `lib/models/` - Mongoose Schemas (Menu, Order, Customer)
  - `lib/services/` - Service functions แยกตามโมดูลหลัก (lineService, menuService, orderService)
  - `lib/db.ts` - MongoDB Atlas database connection configurations

## Core Architecture Patterns & Rules
1. **Service Layer Usage**: ทุกครั้งที่มีการ Query ฐานข้อมูล (MongoDB) ทั้งจาก Webhooks, API Routes หรือ Server Components **ต้องเรียกผ่าน Service Layer (`lib/services/...`) เสมอ**
2. **Database Connections**: Service Layer ทุกฟังก์ชันที่เกี่ยวข้องกับ DB จะต้องสั่งรัน `await connectToDatabase()` เพื่อเปิดและใช้ connection pool เสมอ
3. **Webhook Action Guarding**: ปุ่มยืนยัน (confirm_order) หรือ ยกเลิก (cancel_order) บน Flex Message เก่าๆ ในประวัติแชทของ LINE จะยังทำงานได้เสมอ จึง**ต้องมีการ Validate สถานะออเดอร์ปัจจุบันก่อนประมวลผลเสมอ** (อนุญาตให้จัดการเฉพาะออเดอร์ที่มีสถานะ `pending` เท่านั้น เพื่อความปลอดภัยของข้อมูล)
<!-- END:project-context -->

import { connectToDatabase } from "../db";
import Menu, { IMenu } from "../models/Menu";

export async function getAvailableMenus(): Promise<IMenu[]> {
  await connectToDatabase();
  return Menu.find({ isAvailable: true }).sort({ sortOrder: 1, name: 1 }).exec();
}

export async function getAllMenus(): Promise<IMenu[]> {
  await connectToDatabase();
  return Menu.find({}).sort({ sortOrder: 1, name: 1 }).exec();
}

export async function getMenuById(id: string): Promise<IMenu | null> {
  await connectToDatabase();
  return Menu.findById(id).exec();
}

export async function toggleMenuAvailability(id: string, isAvailable: boolean): Promise<IMenu | null> {
  await connectToDatabase();
  return Menu.findByIdAndUpdate(id, { isAvailable }, { new: true }).exec();
}

export async function createMenu(menuData: Partial<IMenu>): Promise<IMenu> {
  await connectToDatabase();
  const newMenu = new Menu(menuData);
  return newMenu.save();
}

export async function updateMenu(id: string, menuData: Partial<IMenu>): Promise<IMenu | null> {
  await connectToDatabase();
  return Menu.findByIdAndUpdate(id, menuData, { new: true }).exec();
}

export async function deleteMenu(id: string): Promise<IMenu | null> {
  await connectToDatabase();
  return Menu.findByIdAndDelete(id).exec();
}

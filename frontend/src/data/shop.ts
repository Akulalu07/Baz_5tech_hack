export interface ShopItem {
  id: number;
  name: string;
  price: number;
  image: string; // emoji or url
  purchased: boolean;
}

export const MOCK_SHOP_ITEMS: ShopItem[] = [
  { id: 1, name: "Cool Sticker", price: 50, image: "🏷️", purchased: false },
  { id: 2, name: "Coffee Mug", price: 150, image: "☕", purchased: false },
  { id: 3, name: "T-Shirt", price: 500, image: "👕", purchased: false },
  { id: 4, name: "Laptop Skin", price: 300, image: "💻", purchased: false },
];

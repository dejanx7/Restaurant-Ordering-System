import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartModifier {
  name: string;
  priceAdj: number; // cents
}

export interface CartItem {
  id: string; // unique cart item id
  menuItemId: string;
  name: string;
  price: number; // base price in cents
  quantity: number;
  modifiers: CartModifier[];
  specialNote?: string;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  orderType: "PICKUP" | "DELIVERY";
  deliveryAddress: string | null;

  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setOrderType: (type: "PICKUP" | "DELIVERY") => void;
  setDeliveryAddress: (address: string | null) => void;

  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: "PICKUP",
      deliveryAddress: null,

      addItem: (item) => {
        const id = `${item.menuItemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((state) => ({
          items: [...state.items, { ...item, id }],
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [], deliveryAddress: null }),

      setOrderType: (type) => set({ orderType: type }),

      setDeliveryAddress: (address) => set({ deliveryAddress: address }),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const modTotal = item.modifiers.reduce((m, mod) => m + mod.priceAdj, 0);
          return sum + (item.price + modTotal) * item.quantity;
        }, 0);
      },
    }),
    {
      name: "restaurant-cart",
      version: 1,
    }
  )
);

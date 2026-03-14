export interface MenuItemWithModifiers {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  tags: string[];
  categoryId: string;
  modifierGroups: {
    id: string;
    name: string;
    required: boolean;
    minSelect: number;
    maxSelect: number;
    modifiers: {
      id: string;
      name: string;
      priceAdjustment: number;
      isDefault: boolean;
      isAvailable: boolean;
    }[];
  }[];
}

export interface CategoryWithItems {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItemWithModifiers[];
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  type: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    lineTotal: number;
    modifiers: { name: string; priceAdj: number }[];
  }[];
}

export interface RestaurantInfo {
  name: string;
  isOpen: boolean;
  isPausedToday: boolean;
  deliveryEnabled: boolean;
  deliveryFeeFixed: number;
  deliveryMinOrder: number;
  pickupEstimateMin: number;
  pickupEstimateMax: number;
  deliveryEstimateMin: number;
  deliveryEstimateMax: number;
  taxRate: number;
}

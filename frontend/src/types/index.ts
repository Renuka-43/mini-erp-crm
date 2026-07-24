export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate?: string;
  createdById: string;
  createdBy?: { name: string; email?: string };
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
  createdById: string;
  createdBy?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
  followUps?: CustomerFollowUp[];
  salesChallans?: SalesChallan[];
  _count?: { followUps: number; salesChallans: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  imageUrl?: string;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
  stockMovements?: StockMovement[];
}

export type MovementType = 'IN' | 'OUT';

export interface StockMovement {
  id: string;
  productId: string;
  product?: { id: string; name: string; sku: string };
  quantityChanged: number;
  movementType: MovementType;
  reason: string;
  createdById: string;
  createdBy?: { name: string; email: string };
  createdAt: string;
}

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface SalesChallanItem {
  id?: string;
  productId: string;
  product?: { id: string; name: string; sku: string; currentStock?: number };
  productSnapshot?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: Customer;
  customerSnapshot: string;
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdById: string;
  createdBy?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
  items: SalesChallanItem[];
}

export interface Role {
  id: number;
  name: "superadmin" | "admin" | "cashier" | "user";
  description: string;
}

export interface User {
  id: number;
  role_id: number;
  role: Role;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Menu {
  id: number;
  category_id: number;
  category: Category;
  name: string;
  description: string;
  price: number;
  image: string;
  is_available: boolean;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_id: number;
  menu: Menu;
  menu_name: string;
  qty: number;
  price: number;
  subtotal: number;
  notes: string;
}

export type OrderStatus = "waiting" | "processing" | "done" | "cancelled";

export interface Order {
  id: number;
  order_code: string;
  cashier_id: number;
  cashier: User;
  customer_name: string;
  table_number: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string;
  paid_at: string | null;
  done_at: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_page: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface DashboardStats {
  waiting: number;
  processing: number;
  done: number;
  cancelled: number;
  daily: { date: string; total: number; count: number }[];
}
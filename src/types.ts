export interface Admin {
  id: string;
  username: string;
  passwordHash: string; // bcrypt or simple hash
}

export interface User {
  id: string;
  email: string;
  phone: string;
  createdAt: string;
  passwordHash?: string;
  name?: string;
  balance?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  status: 'active' | 'inactive';
  imageUrl: string;
  createdAt: string;
}

export interface ProductAccount {
  id: string;
  productId: string;
  accountData: string; // e.g. "email:pass"
  status: 'available' | 'sold';
  soldToOrderId?: string;
  createdAt: string;
  soldAt?: string;
}

export interface Order {
  id: string;
  userEmail: string;
  userPhone: string;
  productId: string;
  productName: string;
  price: number;
  status: 'pending' | 'awaiting_payment' | 'waiting_confirmation' | 'processing' | 'completed' | 'failed' | 'refund';
  paymentMethodId: string;
  paymentMethodName: string;
  paymentProofUrl?: string;
  paymentAmount: number;
  accountDelivered?: string; // The specific credential when completed
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'qris' | 'bank' | 'ewallet';
  name: string;
  accountName: string;
  accountNo: string;
  qrCodeUrl?: string; // for QRIS
  status: 'active' | 'inactive';
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface BlacklistItem {
  id: string;
  email: string;
  reason: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  targetRole: 'admin' | 'user';
  userEmail?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface PromoBanner {
  text: string;
  isActive: boolean;
  linkUrl?: string;
  bgColor?: string;
  textColor?: string;
}

export interface TopupRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  status: 'pending' | 'completed' | 'failed';
  paymentProofUrl?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DBState {
  admin: Admin[];
  users: User[];
  products: Product[];
  productAccounts: ProductAccount[];
  orders: Order[];
  paymentMethods: PaymentMethod[];
  activityLogs: ActivityLog[];
  blacklist: BlacklistItem[];
  notifications: Notification[];
  banner?: PromoBanner;
  topups?: TopupRequest[];
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalAccountsAvailable: number;
  totalAccountsSold: number;
  recentOrders: Order[];
  recentLogs: ActivityLog[];
}

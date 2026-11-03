export type UserRole = "student" | "vendor" | "admin";

export type ShopType =
  | "market_stall"
  | "permanent_shop"
  | "campus_food_court"
  | "nearby_shop";

export type MarketType =
  | "community_tue"
  | "kmutt_wed_thu"
  | "all_market_days"
  | "daily_campus";

export type ShopStatus = "active" | "inactive" | "pending" | "suspended";

export type VerificationStatus = "verified" | "unverified" | "pending";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_image_url: string;
  category_id: string;
  shop_type: ShopType;
  market_type: MarketType;
  building_name: string;
  location_description: string;
  stall_number?: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_phone?: string | null;
  social_url?: string | null;
  status: ShopStatus;
  verification_status: VerificationStatus;
  owner_id?: string | null;
  tags: string[];
  price_range: "฿" | "฿฿" | "฿฿฿";
  is_recommended: boolean;
  location_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  price: number | null; // null => "สอบถามราคาที่ร้าน"
  is_available: boolean;
  is_recommended: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ShopSchedule {
  id: string;
  shop_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  open_time: string; // "07:00"
  close_time: string; // "17:00"
  is_open: boolean;
}

export interface MarketEvent {
  id: string;
  name: string;
  market_type: string;
  day_of_week?: number | null;
  event_date?: string | null;
  start_time: string;
  end_time: string;
  setup_time: string;
  location: string;
  description: string;
  status: "active" | "closed_temp" | "special" | "upcoming";
}

export interface MarketStall {
  id: string;
  stall_number: string;
  zone: "Zone A (อาหารและเครื่องดื่ม)" | "Zone B (ขนมและของทานเล่น)" | "Zone C (แฟชั่นและสินค้าทั่วไป)";
  x_position: number;
  y_position: number;
  shop_id: string | null;
  is_active: boolean;
  location_verified: boolean;
}

export interface Favorite {
  id: string;
  user_id: string;
  shop_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  user_name: string;
  user_role_badge?: string;
  shop_id: string;
  rating: number; // 1 to 5
  comment: string;
  status: "published" | "pending" | "reported" | "hidden";
  report_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  publish_at: string;
  expires_at?: string | null;
  is_published: boolean;
}

export interface ShopDataSource {
  id: string;
  shop_id: string;
  source_name: string;
  source_url: string;
  source_type: "official_bpuu" | "vendor_submitted" | "community_curated";
  last_verified_at: string;
  verification_note: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface MarketFeeConfig {
  stall_dimensions: string;
  food_stall_fee_thb: number;
  fashion_stall_fee_thb: number;
  electric_point_fee_thb: number;
  default_open_time: string;
  default_close_time: string;
  default_setup_time: string;
  official_source_url: string;
  note: string;
}

export interface DatabaseState {
  profiles: Profile[];
  categories: Category[];
  shops: Shop[];
  products: Product[];
  shop_schedules: ShopSchedule[];
  market_events: MarketEvent[];
  market_stalls: MarketStall[];
  favorites: Favorite[];
  reviews: Review[];
  announcements: Announcement[];
  shop_data_sources: ShopDataSource[];
  activity_logs: ActivityLog[];
  market_config: MarketFeeConfig;
}

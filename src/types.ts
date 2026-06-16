export type ProductCategory = "Polera" | "Poleron" | "Pantalon" | "Short" | "Gorro" | "Accesorio";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number; // Total stock (sum of all sizes)
  sizes: { [key: string]: number }; // e.g., { "S": 10, "M": 5 }
  images: string[];
  category: ProductCategory;
  active: boolean;
  featured?: boolean;
  created_at: string;
  measurements?: {
    [size: string]: {
      [key: string]: string; // e.g., { "Ancho": "52cm", "Largo": "70cm" }
    }
  };
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer_email?: string;
  items: CartItem[];
  subtotal?: number;
  shipping_cost?: number;
  shipping_method?: string;
  total: number;
  status: "pending" | "paid" | "shipped" | "cancelled";
  payment_id?: string;
  shipping_address: {
    full_name: string;
    rut?: string;
    phone?: string;
    region?: string;
    commune?: string;
    street?: string;
    street_number?: string;
    apartment?: string;
    address?: string;
    notes?: string;
  };
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "customer";
  created_at: string;
}

export type BlogCategory = "Cultura" | "Tennis" | "Moda" | "Drops" | "Noticias";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: BlogCategory;
  author: string;
  published: boolean;
  created_at: string;
}

export interface ShippingSettings {
  id?: string;
  rm: {
    name: string;
    price: number;
  };
  region: {
    name: string;
    price: number;
  };
  free_shipping_threshold: number;
  conditions: string;
}

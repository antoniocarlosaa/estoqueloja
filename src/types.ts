export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  unitValue: number;
  imageUrl?: string;
  lastUpdated?: string;
}

export interface Entry {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitValue: number;
  date: string;
  authorUid: string;
}

export interface ExitItem {
  productId: string;
  productName: string;
  quantity: number;
  sku: string;
}

export interface Exit {
  id: string;
  recipient: string;
  vehicle?: string;
  date: string;
  items: ExitItem[];
  totalVolumes: number;
  estimatedWeight: number;
  authorUid: string;
}

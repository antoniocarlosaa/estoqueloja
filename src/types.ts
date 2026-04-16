export interface Product {
  id: string;
  name: string;
  vehicleModel: string;
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
  vehicleModel: string;
  category: string;
  quantity: number;
  totalValue: number;
  invoiceValue: number;
  invoiceNumber: string;
  buyerName: string;
  storeName: string;
  date: string;
  authorUid: string;
}

export interface ExitItem {
  productId: string;
  productName: string;
  quantity: number;
  vehicleModel: string;
}

export interface Exit {
  id: string;
  recipient: string;
  destination: string;
  date: string;
  items: ExitItem[];
  totalVolumes: number;
  authorUid: string;
}

export interface MaintenancePartRequested {
  id: string;
  name: string;
  value: number;
}

export interface Maintenance {
  id: string;
  vehiclePlate: string;
  vehicleModel: string;
  date: string;
  takenBy: string;
  workshop: string;
  mechanicName: string;
  partsTaken: ExitItem[];
  partsRequested: MaintenancePartRequested[];
  deliveryDate: string;
  observation: string;
  authorUid: string;
}

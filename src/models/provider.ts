export interface Provider {
  id: string;
  businessName: string;
  ownerName: string;
  category: string;
  subcategories: string[];
  phoneNumber: string;
  description: string;
  active: boolean;
}

export interface CategorySummary {
  name: string;
  count: number;
}

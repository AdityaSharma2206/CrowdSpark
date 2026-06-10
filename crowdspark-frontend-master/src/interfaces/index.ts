export interface UserTypeProps {
  _id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignTypeProps {
  _id: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  targetAmount: number;
  collectedAmount: number;
  organizer: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DonationTypeProps {
  _id: string;
  amount: number;
  campaign: CampaignTypeProps;
  user: UserTypeProps;
  createdAt: string;
  updatedAt: string;
}

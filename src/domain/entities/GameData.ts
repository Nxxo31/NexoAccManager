// Domain Entity: OutfitData, UniverseData
export interface OutfitData {
  assetId: number;
  name: string;
  price: number;
  isFree: boolean;
  creatorName: string;
  thumbnailUrl: string;
}

export interface UniverseData {
  id: number;
  name: string;
  description: string;
  creatorName: string;
  creatorHasVerifiedBadge: boolean;
  visits: number;
  playing: number;
  rootPlaceId: number;
}

export type PlantCommunity = "Chaparral" | "Oak Woodland" | "Riparian" | "Grassland" | "Coastal Scrub";

export type Butterfly = {
  commonName: string;
  scientificName?: string;
};

export type Bird = {
  commonName: string;
  scientificName?: string;
};

export type Plant = {
  scientificName: string;
  commonName: string;
  communities: PlantCommunity[];
  wildlifeSupportScore: number; // relative ranking basis
  evergreenDeciduous: "Evergreen" | "Deciduous" | "Semi-evergreen";
  lifespanYears: number; // average lifespan
  matureHeightFt: number;
  matureWidthFt: number;
  growthRate: "Slow" | "Moderate" | "Fast";
  flowerColors: string[]; // e.g., ["blue", "white"]
  bloomMonths: number[]; // 1-12
  indigenousUses: string[]; // brief bullet points
  butterflies: Butterfly[]; // up to 3
  birds?: Bird[]; // up to 3
  occurrencePoints?: { lat: number; lng: number }[]; // optional local presence markers
};



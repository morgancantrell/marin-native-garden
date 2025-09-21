import type { Plant, PlantCommunity, SunExposure } from "@/types/plant";

// Helper function to determine sun exposure based on plant characteristics
function getSunExposureForPlant(plant: Omit<Plant, 'sunExposure'>): SunExposure {
  const name = plant.commonName.toLowerCase();
  const communities = plant.communities;
  
  // Full sun plants - typically grassland, chaparral, or coastal scrub
  if (communities.includes("Grassland") || communities.includes("Chaparral")) {
    // Exceptions for shade-loving plants
    if (name.includes("fern") || name.includes("strawberry") || name.includes("hazelnut")) {
      return "shade";
    }
    return "full-sun";
  }
  
  // Shade plants - typically woodland understory
  if (name.includes("fern") || name.includes("strawberry") || name.includes("hazelnut") || 
      name.includes("huckleberry") || name.includes("sorrel")) {
    return "shade";
  }
  
  // Partial sun plants - most oak woodland and riparian plants
  if (communities.includes("Oak Woodland") || communities.includes("Riparian")) {
    return "partial-sun";
  }
  
  // Coastal scrub plants - typically partial sun
  if (communities.includes("Coastal Scrub")) {
    return "partial-sun";
  }
  
  // Default to partial sun for Marin County
  return "partial-sun";
}

// Add sun exposure to existing plants
export function addSunExposureToPlants(plants: Omit<Plant, 'sunExposure'>[]): Plant[] {
  return plants.map(plant => ({
    ...plant,
    sunExposure: getSunExposureForPlant(plant)
  }));
}

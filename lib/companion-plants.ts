// Companion plant groupings based on Marin County's natural plant communities
// Source: Marin Flora, Plant Communities of Marin County, and Calscape.org

export interface CompanionGroup {
  name: string;
  description: string;
  plants: string[];
  ecologicalBenefits: string[];
}

export interface RecommendedPlant {
  commonName: string;
  scientificName: string;
  matureSize: string;
  growthRate: string;
  bloomColor: string;
  bloomSeason: string;
  evergreenDeciduous: string;
  lifespan: string;
  waterNeeds: string;
  indigenousUses: string;
  birds?: string[];
  seasonalPhotos?: any[];
}

// Base companion plant relationships for Marin County
const companionRelationships: { [key: string]: string[] } = {
  // Oak Woodland companions
  "Coast Live Oak": ["California Buckeye", "Toyon", "Coffeeberry", "Western Sword Fern", "Yerba Buena", "Douglas Iris"],
  "Valley Oak": ["California Buckeye", "Toyon", "Coffeeberry", "Western Sword Fern", "Yerba Buena", "Douglas Iris"],
  "California Buckeye": ["Coast Live Oak", "Valley Oak", "Toyon", "Coffeeberry", "Western Sword Fern"],
  "Toyon": ["Coast Live Oak", "Valley Oak", "California Buckeye", "Coffeeberry", "Western Sword Fern", "Yerba Buena"],
  "Coffeeberry": ["Coast Live Oak", "Valley Oak", "Toyon", "California Buckeye", "Western Sword Fern"],
  "Western Sword Fern": ["Coast Live Oak", "Valley Oak", "Toyon", "Coffeeberry", "Douglas Iris", "Yerba Buena"],
  "Yerba Buena": ["Coast Live Oak", "Valley Oak", "Toyon", "Western Sword Fern", "Douglas Iris", "Woodland Strawberry"],
  "Douglas Iris": ["Coast Live Oak", "Valley Oak", "Western Sword Fern", "Yerba Buena", "Woodland Strawberry"],
  "Woodland Strawberry": ["Yerba Buena", "Douglas Iris", "Western Sword Fern"],
  "Soap Plant": ["Coast Live Oak", "Valley Oak", "Western Sword Fern", "Yerba Buena"],
  
  // Chaparral companions
  "Blue Blossom": ["Manzanita", "Toyon", "Coyote Brush", "California Sagebrush", "Sticky Monkeyflower"],
  "Manzanita": ["Blue Blossom", "Toyon", "Coyote Brush", "California Sagebrush", "Sticky Monkeyflower"],
  "Toyon": ["Blue Blossom", "Manzanita", "Coyote Brush", "California Sagebrush", "Sticky Monkeyflower"],
  "Coyote Brush": ["Blue Blossom", "Manzanita", "Toyon", "California Sagebrush", "Sticky Monkeyflower"],
  "California Sagebrush": ["Blue Blossom", "Manzanita", "Toyon", "Coyote Brush", "Sticky Monkeyflower"],
  "Sticky Monkeyflower": ["Blue Blossom", "Manzanita", "Toyon", "Coyote Brush", "California Sagebrush"],
  "Naked Buckwheat": ["California Poppy", "Sky Lupine", "California Fuchsia", "Sticky Monkeyflower"],
  "California Poppy": ["Sky Lupine", "Naked Buckwheat", "California Fuchsia", "Sticky Monkeyflower"],
  "Sky Lupine": ["California Poppy", "Naked Buckwheat", "California Fuchsia", "Sticky Monkeyflower"],
  "California Fuchsia": ["California Poppy", "Sky Lupine", "Naked Buckwheat", "Sticky Monkeyflower"],
  
  // Riparian companions
  "Red Alder": ["Bigleaf Maple", "Beaked Hazelnut", "Redtwig Dogwood", "Western Sycamore"],
  "Bigleaf Maple": ["Red Alder", "Beaked Hazelnut", "Redtwig Dogwood", "Western Sycamore"],
  "Beaked Hazelnut": ["Red Alder", "Bigleaf Maple", "Redtwig Dogwood", "Western Sycamore"],
  "Redtwig Dogwood": ["Red Alder", "Bigleaf Maple", "Beaked Hazelnut", "Western Sycamore"],
  "Western Sycamore": ["Red Alder", "Bigleaf Maple", "Beaked Hazelnut", "Redtwig Dogwood"],
  
  // Grassland companions
  "Purple Needlegrass": ["California Fescue", "Blue Wildrye", "California Brome", "California Poppy"],
  "California Fescue": ["Purple Needlegrass", "Blue Wildrye", "California Brome", "California Poppy"],
  "Blue Wildrye": ["Purple Needlegrass", "California Fescue", "California Brome", "California Poppy"],
  "California Brome": ["Purple Needlegrass", "California Fescue", "Blue Wildrye", "California Poppy"],
  
  // Coastal companions
  "Coast Silktassel": ["Coyote Brush", "California Sagebrush", "Coffeeberry", "Sticky Monkeyflower"],
  "California Sagebrush": ["Coast Silktassel", "Coyote Brush", "Coffeeberry", "Sticky Monkeyflower"]
};

export function getCompanionGroupsForPlants(recommendedPlants: RecommendedPlant[]): CompanionGroup[] {
  const groups: CompanionGroup[] = [];
  const usedPlants = new Set<string>();
  
  // Create companion groups based on the recommended plants
  recommendedPlants.forEach(plant => {
    const companions = companionRelationships[plant.commonName] || [];
    const availableCompanions = companions.filter(companion => 
      recommendedPlants.some(rec => rec.commonName === companion) && 
      !usedPlants.has(companion)
    );
    
    if (availableCompanions.length >= 2) {
      const groupPlants = [plant.commonName, ...availableCompanions];
      const groupName = `${plant.commonName} Community`;
      
      let description = "";
      let benefits: string[] = [];
      
      // Determine community type and benefits based on plant characteristics
      if (plant.waterNeeds?.toLowerCase().includes('low') || plant.waterNeeds?.toLowerCase().includes('drought')) {
        description = `Drought-tolerant plants that thrive together in ${plant.commonName}'s ecosystem`;
        benefits = [
          "Reduced water requirements",
          "Natural pest resistance",
          "Supports native pollinators",
          "Creates microclimate benefits"
        ];
      } else if (plant.waterNeeds?.toLowerCase().includes('moderate') || plant.waterNeeds?.toLowerCase().includes('regular')) {
        description = `Moderate water plants that form a balanced community with ${plant.commonName}`;
        benefits = [
          "Balanced water usage",
          "Supports diverse wildlife",
          "Natural soil improvement",
          "Creates layered habitat"
        ];
      } else {
        description = `Plants that naturally grow together with ${plant.commonName} in Marin County`;
        benefits = [
          "Supports native ecosystems",
          "Attracts beneficial wildlife",
          "Natural soil health",
          "Minimal maintenance required"
        ];
      }
      
      groups.push({
        name: groupName,
        description,
        plants: groupPlants,
        ecologicalBenefits: benefits
      });
      
      // Mark plants as used
      groupPlants.forEach(p => usedPlants.add(p));
    }
  });
  
  // If we don't have enough groups, create a general community group
  if (groups.length < 2 && recommendedPlants.length >= 3) {
    const remainingPlants = recommendedPlants
      .filter(p => !usedPlants.has(p.commonName))
      .slice(0, 4)
      .map(p => p.commonName);
    
    if (remainingPlants.length >= 3) {
      // Determine community type based on plant characteristics
      const hasCoastalPlants = remainingPlants.some(p => 
        p.includes('Coastal') || p.includes('Sagebrush') || p.includes('Coyote Brush')
      );
      const hasOakPlants = remainingPlants.some(p => 
        p.includes('Oak') || p.includes('Toyon') || p.includes('Coffeeberry')
      );
      
      let communityName = "Marin Native Plant Community";
      if (hasCoastalPlants) {
        communityName = "Coastal Plant Community";
      } else if (hasOakPlants) {
        communityName = "Oak Woodland Community";
      }
      
      groups.push({
        name: communityName,
        description: "These plants work together to create a thriving native ecosystem",
        plants: remainingPlants,
        ecologicalBenefits: [
          "Supports native wildlife",
          "Reduces maintenance needs",
          "Improves soil health",
          "Creates natural beauty"
        ]
      });
    }
  }
  
  return groups.slice(0, 4); // Return up to 4 groups
}

// Legacy function for backward compatibility
export function getCompanionGroupsForRegion(region: string): CompanionGroup[] {
  const regionGroups: { [key: string]: CompanionGroup[] } = {
    "Oak Woodland": [
      {
        name: "Oak Woodland Understory",
        description: "Plants that naturally grow beneath oak canopies",
        plants: ["Coast Live Oak", "California Buckeye", "Toyon", "Coffeeberry", "Western Sword Fern"],
        ecologicalBenefits: [
          "Creates layered canopy structure",
          "Supports mycorrhizal networks",
          "Provides year-round habitat for birds",
          "Natural leaf litter cycling"
        ]
      }
    ],
    "Chaparral": [
      {
        name: "Chaparral Shrub Matrix",
        description: "Drought-tolerant shrubs that form dense communities",
        plants: ["Blue Blossom", "Manzanita", "Toyon", "Coyote Brush", "Sticky Monkeyflower"],
        ecologicalBenefits: [
          "Fire-adapted ecosystem",
          "Deep root systems prevent erosion",
          "Supports chaparral-dependent wildlife",
          "Natural windbreaks"
        ]
      }
    ],
    "Riparian": [
      {
        name: "Streamside Forest",
        description: "Moisture-loving trees and shrubs along waterways",
        plants: ["Red Alder", "Bigleaf Maple", "Beaked Hazelnut", "Redtwig Dogwood"],
        ecologicalBenefits: [
          "Stabilizes streambanks",
          "Provides shade for aquatic life",
          "Filters water runoff",
          "Supports riparian wildlife"
        ]
      }
    ],
    "Grassland": [
      {
        name: "Native Grass Matrix",
        description: "Perennial grasses that form grassland foundations",
        plants: ["Purple Needlegrass", "California Fescue", "Blue Wildrye", "California Brome"],
        ecologicalBenefits: [
          "Deep root systems prevent erosion",
          "Supports grassland birds",
          "Natural fire resistance",
          "Soil carbon sequestration"
        ]
      }
    ],
    "Coastal Scrub": [
      {
        name: "Coastal Scrub Matrix",
        description: "Salt-tolerant shrubs adapted to coastal conditions",
        plants: ["Coyote Brush", "California Sagebrush", "Coast Silktassel", "Coffeeberry"],
        ecologicalBenefits: [
          "Salt spray tolerance",
          "Wind resistance",
          "Supports coastal wildlife",
          "Natural dune stabilization"
        ]
      }
    ]
  };

  return regionGroups[region] || [];
}

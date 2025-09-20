// Companion plant groupings based on Marin County's natural plant communities
// Source: Marin Flora, Plant Communities of Marin County, and Calscape.org

export interface CompanionGroup {
  name: string;
  description: string;
  plants: string[];
  ecologicalBenefits: string[];
}

export const companionGroups: CompanionGroup[] = [
  // Oak Woodland Community
  {
    name: "Oak Woodland Understory",
    description: "Plants that naturally grow beneath Coast Live Oak and Valley Oak canopies",
    plants: ["Coast Live Oak", "California Buckeye", "Toyon", "Coffeeberry", "Western Sword Fern"],
    ecologicalBenefits: [
      "Creates layered canopy structure",
      "Supports mycorrhizal networks",
      "Provides year-round habitat for birds",
      "Natural leaf litter cycling"
    ]
  },
  {
    name: "Oak Woodland Groundcover",
    description: "Low-growing plants that form the forest floor community",
    plants: ["Yerba Buena", "Woodland Strawberry", "Douglas Iris", "Soap Plant", "Wild Ginger"],
    ecologicalBenefits: [
      "Prevents soil erosion",
      "Supports ground-dwelling insects",
      "Creates microhabitats",
      "Natural weed suppression"
    ]
  },

  // Chaparral Community
  {
    name: "Chaparral Shrub Matrix",
    description: "Drought-tolerant shrubs that form dense, fire-adapted communities",
    plants: ["Chamise", "Manzanita", "Ceanothus", "Toyon", "Coyote Brush"],
    ecologicalBenefits: [
      "Fire-adapted ecosystem",
      "Deep root systems prevent erosion",
      "Supports chaparral-dependent wildlife",
      "Natural windbreaks"
    ]
  },
  {
    name: "Chaparral Wildflower Meadow",
    description: "Annual and perennial wildflowers that bloom after winter rains",
    plants: ["California Poppy", "Sky Lupine", "California Fuchsia", "Sticky Monkeyflower", "Naked Buckwheat"],
    ecologicalBenefits: [
      "Supports native pollinators",
      "Seasonal color and interest",
      "Natural seed dispersal",
      "Soil nitrogen fixation"
    ]
  },

  // Riparian Community
  {
    name: "Streamside Forest",
    description: "Moisture-loving trees and shrubs along waterways",
    plants: ["Red Alder", "Bigleaf Maple", "Beaked Hazelnut", "Redtwig Dogwood", "Western Sycamore"],
    ecologicalBenefits: [
      "Stabilizes streambanks",
      "Provides shade for aquatic life",
      "Filters water runoff",
      "Supports riparian wildlife"
    ]
  },
  {
    name: "Riparian Understory",
    description: "Moisture-tolerant plants in the riparian zone",
    plants: ["Western Sword Fern", "Douglas Iris", "Redwood Sorrel", "Wild Ginger", "Stream Orchid"],
    ecologicalBenefits: [
      "Groundcover prevents erosion",
      "Supports moisture-loving insects",
      "Creates cool microclimates",
      "Natural water filtration"
    ]
  },

  // Grassland Community
  {
    name: "Native Grass Matrix",
    description: "Perennial grasses that form the foundation of grassland ecosystems",
    plants: ["Purple Needlegrass", "California Fescue", "Blue Wildrye", "California Brome", "Deer Grass"],
    ecologicalBenefits: [
      "Deep root systems prevent erosion",
      "Supports grassland birds",
      "Natural fire resistance",
      "Soil carbon sequestration"
    ]
  },
  {
    name: "Grassland Wildflower Mix",
    description: "Wildflowers that thrive in grassland openings",
    plants: ["California Poppy", "Sky Lupine", "California Goldfields", "Tidy Tips", "Baby Blue Eyes"],
    ecologicalBenefits: [
      "Supports native bees and butterflies",
      "Seasonal color display",
      "Natural seed bank",
      "Pollinator corridors"
    ]
  },

  // Coastal Scrub Community
  {
    name: "Coastal Scrub Matrix",
    description: "Salt-tolerant shrubs adapted to coastal conditions",
    plants: ["Coyote Brush", "California Sagebrush", "Coast Silktassel", "Coffeeberry", "Sticky Monkeyflower"],
    ecologicalBenefits: [
      "Salt spray tolerance",
      "Wind resistance",
      "Supports coastal wildlife",
      "Natural dune stabilization"
    ]
  }
];

export function getCompanionGroupsForRegion(region: string): CompanionGroup[] {
  const regionGroups: { [key: string]: string[] } = {
    "Oak Woodland": ["Oak Woodland Understory", "Oak Woodland Groundcover"],
    "Chaparral": ["Chaparral Shrub Matrix", "Chaparral Wildflower Meadow"],
    "Riparian": ["Streamside Forest", "Riparian Understory"],
    "Grassland": ["Native Grass Matrix", "Grassland Wildflower Mix"],
    "Coastal Scrub": ["Coastal Scrub Matrix"]
  };

  const groupNames = regionGroups[region] || [];
  return companionGroups.filter(group => groupNames.includes(group.name));
}

export function getCompanionGroupsForPlants(plants: string[]): CompanionGroup[] {
  // Find groups where at least 3 plants from the recommendation are present
  return companionGroups.filter(group => {
    const matchingPlants = group.plants.filter(plant => 
      plants.some(recommendedPlant => 
        recommendedPlant.toLowerCase().includes(plant.toLowerCase()) ||
        plant.toLowerCase().includes(recommendedPlant.toLowerCase())
      )
    );
    return matchingPlants.length >= 3;
  });
}

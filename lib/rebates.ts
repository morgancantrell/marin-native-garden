export interface Rebate {
  title: string;
  amount: string;
  requirements: string;
  link: string;
}

export function getRebates(waterDistrict: string): Rebate[] {
  const rebates: { [key: string]: Rebate[] } = {
    "Marin Water": [
      {
        title: "Turf Replacement Program",
        amount: "$3.00 per square foot",
        requirements: "Replace lawn with drought-tolerant plants, minimum 250 sq ft",
        link: "https://www.marinwater.org/conservation/rebates/turf-replacement"
      },
      {
        title: "Smart Irrigation Controller",
        amount: "Up to $200",
        requirements: "Install weather-based irrigation controller",
        link: "https://www.marinwater.org/conservation/rebates/smart-irrigation"
      },
      {
        title: "High-Efficiency Toilet",
        amount: "$100 per toilet",
        requirements: "Replace toilet with 1.28 GPF or less model",
        link: "https://www.marinwater.org/conservation/rebates/toilets"
      }
    ],
    "North Marin Water District": [
      {
        title: "Landscape Conversion",
        amount: "$2.00 per square foot",
        requirements: "Convert lawn to water-efficient landscaping, minimum 100 sq ft",
        link: "https://www.nmwd.com/conservation/rebates/landscape-conversion"
      },
      {
        title: "Drip Irrigation System",
        amount: "Up to $150",
        requirements: "Install drip irrigation for trees and shrubs",
        link: "https://www.nmwd.com/conservation/rebates/drip-irrigation"
      },
      {
        title: "Rain Barrel",
        amount: "Up to $75",
        requirements: "Install rain barrel for water collection",
        link: "https://www.nmwd.com/conservation/rebates/rain-barrels"
      }
    ]
  };

  return rebates[waterDistrict] || [];
}

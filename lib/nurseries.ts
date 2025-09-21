export interface Nursery {
  name: string;
  phone: string;
  summary: string;
  website: string;
}

export function getRecommendedNurseries(): Nursery[] {
  return [
    {
      name: "Fairfax Native Plant Nursery",
      phone: "(415) 456-2010",
      summary: "Specializes in California native plants with expert guidance for Marin County gardens",
      website: "https://www.fairfaxnativeplantnursery.com"
    },
    {
      name: "O'Donnell's Nursery",
      phone: "(415) 456-2010",
      summary: "Family-owned nursery offering native plants and sustainable gardening solutions",
      website: "https://www.odonnellsnursery.com"
    },
    {
      name: "CNL Native Plant Nursery",
      phone: "(415) 456-2010",
      summary: "Conservation-focused nursery providing native plants for ecological restoration",
      website: "https://www.cnlnativeplants.com"
    },
    {
      name: "Watershed Nursery",
      phone: "(510) 234-2222",
      summary: "Bay Area's premier native plant nursery with extensive selection and expertise",
      website: "https://www.watershednursery.com"
    }
  ];
}

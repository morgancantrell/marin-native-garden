// import type { any } from "geojson";
import { GeocodeResult } from './geocode';

export interface PropertyMapData {
  address: string;
  coordinates: { lat: number; lng: number };
  buildingFootprint?: any;
  topography?: any;
  propertyBoundary?: any;
}

export interface MapImageOptions {
  width: number;
  height: number;
  zoom: number;
  showBuildingFootprint: boolean;
  showTopography: boolean;
  showPropertyBoundary: boolean;
  style?: 'satellite' | 'light' | 'dark';
}

/**
 * Generate a property map image URL using Mapbox Static API
 * This creates a custom map with building footprints and topography
 */
export function generatePropertyMapImageUrl(
  geocodeResult: GeocodeResult,
  options: MapImageOptions = {
    width: 600,
    height: 400,
    zoom: 18,
    showBuildingFootprint: true,
    showTopography: true,
    showPropertyBoundary: true,
    style: 'satellite',
  }
): string {
  const { latitude, longitude } = geocodeResult;
  const token = process.env.MAPBOX_TOKEN;
  
  if (!token) {
    throw new Error('MAPBOX_TOKEN is required for property map generation');
  }

  // Choose map style based on options
  let mapStyle: string;
  switch (options.style) {
    case 'light':
      mapStyle = 'mapbox://styles/mapbox/light-v11';
      break;
    case 'dark':
      mapStyle = 'mapbox://styles/mapbox/dark-v11';
      break;
    case 'satellite':
    default:
      mapStyle = 'mapbox://styles/mapbox/satellite-streets-v12';
      break;
  }
  
  // Build the URL for Mapbox Static API
  const baseUrl = `https://api.mapbox.com/styles/v1/mapbox/${mapStyle.split('/').pop()}/static`;
  
  // Add elevation contours and parcel boundaries as overlays
  const overlays = [];
  
  if (options.showTopography) {
      // Add elevation contours overlay
      overlays.push('contours');
    }
    
    if (options.showPropertyBoundary) {
      // Add parcel boundaries overlay
      overlays.push('parcels');
  }
  
  // Add building footprint overlay if available
  if (options.showBuildingFootprint) {
    // Mapbox automatically shows buildings in satellite view
    // For other styles, we could add a buildings overlay
  }
  
  // Add marker for property location
  const marker = `pin-s-home+ff0000(${longitude},${latitude})`;
  
  // Construct the URL with overlays
  let url = `${baseUrl}/${marker}/${longitude},${latitude},${options.zoom}/${options.width}x${options.height}@2x`;
  
  // Add overlays if any
  if (overlays.length > 0) {
    url += `/${overlays.join(',')}`;
  }
  
  url += `?access_token=${token}`;
  
  return url;
}

/**
 * Fetch building footprint data from Marin County GIS
 * This is a placeholder - would need actual API endpoint
 */
export async function fetchBuildingFootprint(
  coordinates: { lat: number; lng: number },
  bufferMeters: number = 100
): Promise<any | null> {
  try {
    // This would be the actual Marin County GIS API endpoint
    // For now, return null to indicate no data available
    console.log(`Would fetch building footprint for coordinates: ${coordinates.lat}, ${coordinates.lng}`);
    return null;
  } catch (error) {
    console.error('Error fetching building footprint:', error);
    return null;
  }
}

/**
 * Fetch topography data from Marin County GIS
 * This is a placeholder - would need actual API endpoint
 */
export async function fetchTopography(
  coordinates: { lat: number; lng: number },
  bufferMeters: number = 100
): Promise<any | null> {
  try {
    // This would be the actual Marin County GIS API endpoint
    // For now, return null to indicate no data available
    console.log(`Would fetch topography for coordinates: ${coordinates.lat}, ${coordinates.lng}`);
    return null;
  } catch (error) {
    console.error('Error fetching topography:', error);
    return null;
  }
}

/**
 * Generate a comprehensive property map with building footprint and topography
 */
export async function generatePropertyMap(
  geocodeResult: GeocodeResult,
  options: MapImageOptions = {
    width: 600,
    height: 400,
    zoom: 18,
    showBuildingFootprint: true,
    showTopography: true,
    showPropertyBoundary: true,
  }
): Promise<{
  mapImageUrl: string;
  mapData: PropertyMapData;
}> {
  const coordinates = {
    lat: geocodeResult.latitude,
    lng: geocodeResult.longitude,
  };

  // Fetch additional GIS data (when APIs are available)
  const [buildingFootprint, topography] = await Promise.all([
    fetchBuildingFootprint(coordinates),
    fetchTopography(coordinates),
  ]);

  const mapData: PropertyMapData = {
    address: geocodeResult.contextText || '',
    coordinates,
    buildingFootprint,
    topography,
  };

  const mapImageUrl = generatePropertyMapImageUrl(geocodeResult, options);

  return {
    mapImageUrl,
    mapData,
  };
}

/**
 * Create a simple property map using Mapbox Static API
 * This is a fallback when Marin County GIS data isn't available
 */
export function createSimplePropertyMap(
  geocodeResult: GeocodeResult,
  options: MapImageOptions = {
    width: 600,
    height: 400,
    zoom: 18,
    showBuildingFootprint: true,
    showTopography: true,
    showPropertyBoundary: true,
    style: 'satellite',
  }
): string {
  return generatePropertyMapImageUrl(geocodeResult, options);
}

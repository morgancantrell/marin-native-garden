// Configuration file for API keys
// Replace these with your actual API keys

const CONFIG = {
    // Mapbox Access Token - Get from https://account.mapbox.com/access-tokens/
    MAPBOX_ACCESS_TOKEN: 'pk.eyJ1IjoibW9yZ2FuY2FudHJlbGwiLCJhIjoiY2x6eGJ6dGJ6MDAwMDJqbzJ6eGJ6dGJ6In0.example',
    
    // Google Solar API Key - Get from https://console.cloud.google.com/
    GOOGLE_SOLAR_API_KEY: 'YOUR_GOOGLE_SOLAR_API_KEY',
    
    // Marin County GIS Base URL
    MARIN_COUNTY_GIS_BASE_URL: 'https://gisopendata.marincounty.gov/arcgis/rest/services',
    
    // Default map settings
    DEFAULT_CENTER: [-122.5318, 38.0834], // Marin County center
    DEFAULT_ZOOM: 12,
    PROPERTY_ZOOM: 18
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

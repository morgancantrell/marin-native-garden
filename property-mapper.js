// Load configuration
const CONFIG = {
    MAPBOX_ACCESS_TOKEN: 'pk.eyJ1IjoibW9yZ2FuY2FuIiwiYSI6ImNtZnBkdm45NDBjbWYybHM4aWRweGw5cWsifQ.Xmd79m__PJyKQ-oee3zDYQ',
    GOOGLE_SOLAR_API_KEY: 'AIzaSyCqxKx2Y726WWmG-yXq6BJdKq1Fhieg_kU',
    MARIN_COUNTY_GIS_BASE_URL: 'https://gisopendata.marincounty.gov/arcgis/rest/services',
    DEFAULT_CENTER: [-122.5318, 38.0834],
    DEFAULT_ZOOM: 12,
    PROPERTY_ZOOM: 18
};

// Test Google Solar API key
async function testSolarAPI() {
    console.log('Testing Google Solar API...');
    console.log('API Key:', CONFIG.GOOGLE_SOLAR_API_KEY.substring(0, 10) + '...');
    
    const testUrl = `https://solar.googleapis.com/v1/dataLayers:get?key=${CONFIG.GOOGLE_SOLAR_API_KEY}`;
    const testBody = {
        location: {
            latitude: 38.0834,
            longitude: -122.5318
        },
        radiusMeters: 50,
        view: 'FULL_LAYERS',
        requiredQuality: 'HIGH',
        pixelSizeMeters: 1.0
    };
    
    try {
        const response = await fetch(testUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testBody)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            
            if (response.status === 404) {
                console.error('Solar API not enabled. Please enable the Solar API in Google Cloud Console.');
            } else if (response.status === 403) {
                console.error('API key not authorized. Please check your Google Solar API key permissions.');
            } else if (response.status === 400) {
                console.error('Bad request. Please check your API key and request parameters.');
            }
            return false;
        }
        
        const data = await response.json();
        console.log('Success! API is working:', data);
        return true;
        
    } catch (error) {
        console.error('API test failed:', error);
        return false;
    }
}

// Initialize Mapbox map
function initializeMap() {
    // Set Mapbox access token
    mapboxgl.accessToken = CONFIG.MAPBOX_ACCESS_TOKEN;
    
    // Initialize the map
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: CONFIG.DEFAULT_CENTER,
        zoom: CONFIG.DEFAULT_ZOOM,
        pitch: 0,
        bearing: 0
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add scale control
    map.addControl(new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'imperial'
    }), 'bottom-left');

    // Wait for map to load before adding layers
    map.on('load', function() {
        console.log('Map loaded successfully');
        setupLayerControls();
        
        // Test Solar API
        testSolarAPI();
    });

    // Handle map errors
    map.on('error', function(e) {
        console.error('Map error:', e);
        showError('Failed to load map. Please check your Mapbox token.');
    });
}

// Setup event listeners
function setupEventListeners() {
    const form = document.getElementById('address-form');
    const addressInput = document.getElementById('address-input');
    
    form.addEventListener('submit', handleAddressSubmit);
    
    // Handle Enter key in address input
    addressInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddressSubmit(e);
        }
    });
}

// Handle address form submission
async function handleAddressSubmit(e) {
    e.preventDefault();
    
    const addressInput = document.getElementById('address-input');
    const submitBtn = document.getElementById('submit-btn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    
    const address = addressInput.value.trim();
    
    if (!address) {
        showError('Please enter an address');
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    loading.style.display = 'block';
    error.style.display = 'none';
    
    try {
        // Step 1: Geocode the address
        const coordinates = await geocodeAddress(address);
        
        // Step 2: Load property data
        await loadPropertyData(coordinates, address);
        
        // Step 3: Fly to the property
        map.flyTo({
            center: coordinates,
            zoom: CONFIG.PROPERTY_ZOOM,
            duration: 2000
        });
        
    } catch (err) {
        console.error('Error processing address:', err);
        showError(err.message || 'Failed to process address');
    } finally {
        // Hide loading state
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
}

// Geocode address using Mapbox Geocoding API
async function geocodeAddress(address) {
    const encodedAddress = encodeURIComponent(address + ', Marin County, CA');
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${CONFIG.MAPBOX_ACCESS_TOKEN}&limit=1`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Geocoding failed');
        }
        
        if (!data.features || data.features.length === 0) {
            throw new Error('Address not found in Marin County');
        }
        
        const feature = data.features[0];
        const coordinates = feature.center; // [longitude, latitude]
        
        console.log('Geocoded coordinates:', coordinates);
        return coordinates;
        
    } catch (error) {
        console.error('Geocoding error:', error);
        throw new Error('Failed to find address. Please check the address and try again.');
    }
}

// Load property data from Marin County GIS
async function loadPropertyData(coordinates, address) {
    try {
        // Clear existing layers
        clearPropertyLayers();
        
        // Load property boundary
        await loadPropertyBoundary(coordinates);
        
        // Load building footprint
        await loadBuildingFootprint(coordinates);
        
        // Load sun exposure data
        await loadSunExposureData(coordinates);
        
        // Update info panel
        updateInfoPanel(address, coordinates);
        
    } catch (error) {
        console.error('Error loading property data:', error);
        throw error;
    }
}

// Load property boundary from Marin County GIS
async function loadPropertyBoundary(coordinates) {
    const [lng, lat] = coordinates;
    
    // Marin County Parcels API endpoint
    const parcelsUrl = `${CONFIG.MARIN_COUNTY_GIS_BASE_URL}/Parcels/MapServer/0/query`;
    const params = new URLSearchParams({
        f: 'geojson',
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'true'
    });
    
    try {
        const response = await fetch(`${parcelsUrl}?${params}`);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            // Add property boundary source
            map.addSource('property-boundary', {
                type: 'geojson',
                data: data
            });
            
            // Add property boundary layer
            map.addLayer({
                id: 'property-boundary-layer',
                type: 'line',
                source: 'property-boundary',
                paint: {
                    'line-color': '#FFD700',
                    'line-width': 3,
                    'line-opacity': 0.8
                }
            });
            
            console.log('Property boundary loaded');
        }
        
    } catch (error) {
        console.error('Error loading property boundary:', error);
        // Don't throw error - this is optional data
    }
}

// Load building footprint from Marin County GIS
async function loadBuildingFootprint(coordinates) {
    const [lng, lat] = coordinates;
    
    // Marin County Building Footprints API endpoint
    const buildingsUrl = `${CONFIG.MARIN_COUNTY_GIS_BASE_URL}/BuildingFootprints/MapServer/0/query`;
    const params = new URLSearchParams({
        f: 'geojson',
        geometry: `${lng},${lat}`,
        geometryType: 'esriGeometryPoint',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: '*',
        returnGeometry: 'true'
    });
    
    try {
        const response = await fetch(`${buildingsUrl}?${params}`);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            // Add building footprint source
            map.addSource('building-footprint', {
                type: 'geojson',
                data: data
            });
            
            // Add building footprint layer
            map.addLayer({
                id: 'building-footprint-layer',
                type: 'fill',
                source: 'building-footprint',
                paint: {
                    'fill-color': '#CCCCCC',
                    'fill-opacity': 0.7
                }
            });
            
            // Add building outline
            map.addLayer({
                id: 'building-outline-layer',
                type: 'line',
                source: 'building-footprint',
                paint: {
                    'line-color': '#666666',
                    'line-width': 2
                }
            });
            
            console.log('Building footprint loaded');
        }
        
    } catch (error) {
        console.error('Error loading building footprint:', error);
        // Don't throw error - this is optional data
    }
}

// Load sun exposure data using Google Solar API
async function loadSunExposureData(coordinates) {
    const [lng, lat] = coordinates;
    
    // Google Solar API dataLayers endpoint
    const solarUrl = `https://solar.googleapis.com/v1/dataLayers:get?key=${CONFIG.GOOGLE_SOLAR_API_KEY}`;
    
    const requestBody = {
        location: {
            latitude: lat,
            longitude: lng
        },
        radiusMeters: 100,
        view: 'FULL_LAYERS',
        requiredQuality: 'HIGH',
        pixelSizeMeters: 0.5
    };
    
    try {
        const response = await fetch(solarUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Solar API Error Details:', errorData);
            throw new Error(`Solar API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        if (data.annualFluxUrlTiff) {
            // Add sun exposure raster source
            map.addSource('sun-exposure', {
                type: 'raster',
                url: data.annualFluxUrlTiff,
                tileSize: 256
            });
            
            // Add sun exposure layer
            map.addLayer({
                id: 'sun-exposure-layer',
                type: 'raster',
                source: 'sun-exposure',
                paint: {
                    'raster-opacity': 0.6
                }
            });
            
            console.log('Sun exposure data loaded');
            console.log('Annual flux URL:', data.annualFluxUrlTiff);
        }
        
    } catch (error) {
        console.error('Error loading sun exposure data:', error);
        // Don't throw error - this is optional data
        console.log('Sun exposure data unavailable. Please check your Google Solar API key.');
        console.log('Continuing without sun exposure data...');
    }
}

// Setup layer controls
function setupLayerControls() {
    const propertyBoundaryToggle = document.getElementById('property-boundary');
    const buildingFootprintToggle = document.getElementById('building-footprint');
    const sunExposureToggle = document.getElementById('sun-exposure');
    
    propertyBoundaryToggle.addEventListener('change', function() {
        const visibility = this.checked ? 'visible' : 'none';
        map.setLayoutProperty('property-boundary-layer', 'visibility', visibility);
    });
    
    buildingFootprintToggle.addEventListener('change', function() {
        const visibility = this.checked ? 'visible' : 'none';
        map.setLayoutProperty('building-footprint-layer', 'visibility', visibility);
        map.setLayoutProperty('building-outline-layer', 'visibility', visibility);
    });
    
    sunExposureToggle.addEventListener('change', function() {
        const visibility = this.checked ? 'visible' : 'none';
        map.setLayoutProperty('sun-exposure-layer', 'visibility', visibility);
    });
}

// Clear existing property layers
function clearPropertyLayers() {
    const layers = ['property-boundary-layer', 'building-footprint-layer', 'building-outline-layer', 'sun-exposure-layer'];
    const sources = ['property-boundary', 'building-footprint', 'sun-exposure'];
    
    layers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }
    });
    
    sources.forEach(sourceId => {
        if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
        }
    });
}

// Update info panel with property information
function updateInfoPanel(address, coordinates) {
    const infoPanel = document.getElementById('info-panel');
    const propertyInfo = document.getElementById('property-info');
    
    propertyInfo.innerHTML = `
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Coordinates:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}</p>
        <p><strong>Status:</strong> Property data loaded successfully</p>
    `;
    
    infoPanel.style.display = 'block';
}

// Show error message
function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.style.display = 'block';
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
});

# Sun Exposure Implementation Guide

## Option 1: Google Solar API Integration

### Step 1: Use Your Existing API Key
```javascript
// In your property-mapper.js or new sun-exposure.js
const GOOGLE_SOLAR_API_KEY = 'AIzaSyCqxKx2Y726WWmG-yXq6BJdKq1Fhieg_kU';

async function getSunExposureData(latitude, longitude) {
  try {
    const response = await fetch(
      `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${latitude}&location.longitude=${longitude}&key=${GOOGLE_SOLAR_API_KEY}`
    );
    
    const data = await response.json();
    
    return {
      annualSolarFlux: data.solarPotential?.maxArrayPanelsCount,
      roofSegments: data.solarPotential?.roofSegmentStats,
      sunExposureHours: calculateSunHours(data.solarPotential),
      buildingArea: data.buildingAreaStats
    };
  } catch (error) {
    console.error('Sun exposure data error:', error);
    return null;
  }
}

function calculateSunHours(solarPotential) {
  // Convert solar flux to estimated sun hours
  const avgFlux = solarPotential?.maxArrayPanelsCount || 0;
  return Math.round(avgFlux * 0.8); // Rough conversion
}
```

### Step 2: Visual Representation
```javascript
// Add sun exposure overlay to map
function addSunExposureLayer(map, sunData) {
  // Color coding based on sun exposure (REVERSED)
  const colors = {
    high: '#ef4444',    // Red - 6+ hours (full sun)
    medium: '#f59e0b',  // Yellow - 4-6 hours (partial sun)
    low: '#22c55e'      // Green - <4 hours (shade)
  };
  
  // Add colored polygons to map
  sunData.roofSegments.forEach(segment => {
    const color = getSunColor(segment.sunExposureHours);
    
    map.addSource(`sun-${segment.id}`, {
      type: 'geojson',
      data: segment.geometry
    });
    
    map.addLayer({
      id: `sun-layer-${segment.id}`,
      type: 'fill',
      source: `sun-${segment.id}`,
      paint: {
        'fill-color': color,
        'fill-opacity': 0.6
      }
    });
  });
}

function getSunColor(hours) {
  if (hours >= 6) return '#ef4444'; // Red - Full sun
  if (hours >= 4) return '#f59e0b'; // Yellow - Partial sun
  return '#22c55e'; // Green - Shade
}
```

## Option 2: Simple Sun Path Visualization

### Basic Sun Exposure Calculator
```javascript
// Calculate sun exposure without API
function calculateBasicSunExposure(lat, lng, date = new Date()) {
  const sunData = {
    morning: calculateSunPosition(lat, lng, date, 9), // 9 AM
    midday: calculateSunPosition(lat, lng, date, 12), // 12 PM
    afternoon: calculateSunPosition(lat, lng, date, 15) // 3 PM
  };
  
  return {
    totalHours: estimateSunHours(sunData),
    morningExposure: sunData.morning.elevation > 0,
    middayExposure: sunData.midday.elevation > 45,
    afternoonExposure: sunData.afternoon.elevation > 0
  };
}

function estimateSunHours(sunData) {
  let hours = 0;
  if (sunData.morning.elevation > 0) hours += 3;
  if (sunData.midday.elevation > 45) hours += 3;
  if (sunData.afternoon.elevation > 0) hours += 3;
  return hours;
}
```

## Option 3: Interactive Sun Exposure Widget

### Add to Your Garden Planner
```javascript
// Add sun exposure section to results
function addSunExposureToResults(sunData) {
  const sunSection = document.createElement('div');
  sunSection.className = 'sun-exposure-section';
  sunSection.innerHTML = `
    <h3>☀️ Sun Exposure Analysis</h3>
    <div class="sun-summary">
      <div class="sun-hours">
        <span class="hours">${sunData.totalHours}</span>
        <span class="label">hours of sun per day</span>
      </div>
      <div class="sun-breakdown">
        <div class="morning ${sunData.morningExposure ? 'active' : ''}">
          <span>🌅 Morning</span>
        </div>
        <div class="midday ${sunData.middayExposure ? 'active' : ''}">
          <span>☀️ Midday</span>
        </div>
        <div class="afternoon ${sunData.afternoonExposure ? 'active' : ''}">
          <span>🌇 Afternoon</span>
        </div>
      </div>
    </div>
    <div class="plant-recommendations">
      <h4>Recommended for your sun exposure:</h4>
      <ul>
        ${getSunBasedRecommendations(sunData.totalHours)}
      </ul>
    </div>
  `;
  
  return sunSection;
}

function getSunBasedRecommendations(hours) {
  if (hours >= 6) {
    return '<li>Full sun plants: California Poppy, Sky Lupine</li>';
  } else if (hours >= 4) {
    return '<li>Partial sun plants: Douglas Iris, Yerba Buena</li>';
  } else {
    return '<li>Shade plants: Western Sword Fern, Woodland Strawberry</li>';
  }
}
```

## CSS for Sun Exposure Colors

```css
/* Sun exposure color coding */
.sun-exposure-high {
  background-color: #ef4444; /* Red - Full sun */
  color: white;
}

.sun-exposure-medium {
  background-color: #f59e0b; /* Yellow - Partial sun */
  color: black;
}

.sun-exposure-low {
  background-color: #22c55e; /* Green - Shade */
  color: white;
}

/* Legend */
.sun-legend {
  display: flex;
  gap: 15px;
  margin: 10px 0;
}

.sun-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sun-legend-color {
  width: 20px;
  height: 20px;
  border-radius: 3px;
}

.sun-legend-red { background-color: #ef4444; }
.sun-legend-yellow { background-color: #f59e0b; }
.sun-legend-green { background-color: #22c55e; }
```

## Integration with Current App

### Add to API Route
```javascript
// In app/api/plan/route.ts
export async function POST(request: NextRequest) {
  // ... existing code ...
  
  // Get sun exposure data
  let sunExposureData = null;
  try {
    sunExposureData = await getSunExposureData(latitude, longitude);
  } catch (error) {
    console.log('Sun exposure data unavailable:', error);
  }
  
  // ... rest of function ...
  
  return Response.json({
    success: true,
    region,
    waterDistrict,
    plants: plantsWithPhotos,
    rebates,
    sunExposure: sunExposureData,
    emailStatus,
    emailError,
    note: "Email sent successfully"
  });
}
```

### Add to Frontend
```javascript
// In app/page.tsx
{result.sunExposure && (
  <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <h3 className="text-lg font-semibold text-gray-900 mb-3">☀️ Sun Exposure Analysis</h3>
    <div className="text-sm text-gray-800">
      <p><strong>Estimated Sun Hours:</strong> {result.sunExposure.totalHours} hours per day</p>
      <p><strong>Best for:</strong> {getSunRecommendation(result.sunExposure.totalHours)}</p>
    </div>
    
    {/* Sun exposure legend */}
    <div className="sun-legend mt-3">
      <div className="sun-legend-item">
        <div className="sun-legend-color sun-legend-red"></div>
        <span>Full Sun (6+ hrs)</span>
      </div>
      <div className="sun-legend-item">
        <div className="sun-legend-color sun-legend-yellow"></div>
        <span>Partial Sun (4-6 hrs)</span>
      </div>
      <div className="sun-legend-item">
        <div className="sun-legend-color sun-legend-green"></div>
        <span>Shade (<4 hrs)</span>
      </div>
    </div>
  </div>
)}
```

## Quick Implementation Steps

1. **Add Google Solar API call** to your existing geocoding
2. **Display sun hours** in the results section with color coding
3. **Add sun-based plant filtering** to recommendations
4. **Include sun data in PDF** for complete garden plan
5. **Add seasonal sun variations** (summer vs winter)

## Testing

- Test with different Marin County addresses
- Verify sun exposure calculations
- Check mobile responsiveness
- Ensure API key permissions are correct
- Verify color coding: Red = Full sun, Yellow = Partial, Green = Shade

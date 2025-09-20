# Marin County Property Mapper with Sun Exposure Analysis

A comprehensive web application that maps Marin County properties with detailed sun exposure analysis using Google Solar API, property boundaries, and building footprints.

## Features

- **Interactive Map**: Satellite imagery with Mapbox GL JS
- **Address Geocoding**: Convert addresses to coordinates using Mapbox Geocoding API
- **Property Boundaries**: Display parcel boundaries from Marin County GIS
- **Building Footprints**: Show building outlines and footprints
- **Sun Exposure Analysis**: Heat map showing solar potential using Google Solar API
- **Layer Controls**: Toggle visibility of different map layers
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Get Required API Keys

#### Mapbox Access Token
1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Sign up for a free account
3. Create a new access token
4. Copy the token (starts with `pk.`)

#### Google Solar API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Solar API
4. Create credentials (API Key)
5. Copy the API key

### 2. Configure the Application

Edit `property-mapper.js` and update the CONFIG object:

```javascript
const CONFIG = {
    MAPBOX_ACCESS_TOKEN: 'your_mapbox_token_here',
    GOOGLE_SOLAR_API_KEY: 'your_google_solar_api_key_here',
    // ... other settings
};
```

### 3. Run the Application

1. Open `property-mapper.html` in a web browser
2. Enter a Marin County address in the search bar
3. Click "Map Property" to load the data

## API Endpoints Used

### Mapbox APIs
- **Maps API**: For satellite imagery and map rendering
- **Geocoding API**: For address-to-coordinates conversion

### Google Solar API
- **dataLayers endpoint**: For sun exposure analysis
- Returns GeoTIFF raster data showing solar flux

### Marin County GIS
- **Parcels API**: For property boundary data
- **Building Footprints API**: For building outline data

## File Structure

```
property-mapper.html    # Main HTML file
property-mapper.js      # JavaScript application logic
config.js              # Configuration file (optional)
README.md              # This file
```

## Usage

1. **Search for Property**: Enter any Marin County address
2. **View Layers**: Use the layer controls to toggle visibility
3. **Analyze Sun Exposure**: The heat map shows solar potential
4. **Property Information**: View coordinates and status in info panel

## Technical Details

### Map Layers
- **Property Boundary**: Gold outline (`#FFD700`) showing parcel boundaries
- **Building Footprint**: Gray fill (`#CCCCCC`) showing building outlines
- **Sun Exposure**: Raster overlay showing solar flux data

### Error Handling
- Graceful fallback if APIs are unavailable
- User-friendly error messages
- Console logging for debugging

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### Common Issues

1. **Map not loading**: Check Mapbox token
2. **No sun exposure data**: Verify Google Solar API key and billing
3. **Property boundaries missing**: Marin County GIS may be temporarily unavailable
4. **CORS errors**: Some APIs may require server-side proxy

### Debug Mode

Open browser developer tools (F12) to see console logs and API responses.

## Cost Considerations

- **Mapbox**: Free tier includes 50,000 map loads/month
- **Google Solar API**: Pay-per-use pricing (see Google Cloud pricing)
- **Marin County GIS**: Free public API

## Future Enhancements

- [ ] Add elevation contours
- [ ] Include soil type data
- [ ] Add plant community overlays
- [ ] Export functionality for reports
- [ ] Mobile app version

## License

This project is for educational and research purposes. Please respect API terms of service and usage limits.

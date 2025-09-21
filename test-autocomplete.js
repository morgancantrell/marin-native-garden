// Test script to verify AddressAutocomplete functionality
const testAddressAutocomplete = async () => {
  const token = "pk.eyJ1IjoibW9yZ2FuY2FuIiwiYSI6ImNtZnBkdm45NDBjbWYybHM4aWRweGw5cWsifQ.Xmd79m__PJyKQ-oee3zDYQ";
  const query = "mill valley";
  
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
    `access_token=${token}&` +
    `country=US&` +
    `bbox=-123.0,37.8,-122.3,38.3&` +
    `limit=5&` +
    `types=address,poi`;
  
  console.log('Testing URL:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('API Response:', data);
    
    // Filter results to ensure they're in Marin County
    const marinResults = data.features.filter((feature) => {
      const [lng, lat] = feature.center;
      return lat >= 37.8 && lat <= 38.3 && lng >= -123.0 && lng <= -122.3;
    });
    
    console.log('Filtered Marin County results:', marinResults);
    console.log('Number of results:', marinResults.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the test
testAddressAutocomplete();

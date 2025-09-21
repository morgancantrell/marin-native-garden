import https from 'https';
import { URL } from 'url';

export interface SeasonalPhoto {
  url: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  timestamp: string;
}

function makeHttpsRequest(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Marin-Native-Garden/1.0',
        'Accept': 'application/json',
      },
      rejectUnauthorized: false,
      timeout: 25000,
    };

    const req = https.request(options, (res: any) => {
      req.setTimeout(25000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      let data = '';
      res.on('data', (chunk: any) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (err: any) => {
      reject(err);
    });

    req.end();
  });
}

function getSeasonFromDate(dateString: string): 'spring' | 'summer' | 'fall' | 'winter' {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

export async function fetchSeasonalPhotos(scientificName: string): Promise<SeasonalPhoto[]> {
  const seasons: string[] = ['spring', 'summer', 'fall', 'winter'];
  
  // Priority plants that need extra attention for winter photos
  const priorityPlants = [
    'Quercus agrifolia', 'Quercus lobata', 'Ceanothus thyrsiflorus',
    'Heteromeles arbutifolia', 'Eriogonum nudum', 'Baccharis pilularis',
    'Frangula californica', 'Diplacus aurantiacus', 'Sambucus', 'Ribes',
    'Lupinus nanus', 'Lupinus', 'Toyon', 'Buckwheat', 'Coyote Brush', 'Coffeeberry',
    'Achillea millefolium', 'Clinopodium douglasii', 'Sambucus nigra', // Added for winter photos
    'Yarrow', 'Yerba Buena', 'Blue Elderberry', // Common names for winter photo priority
    'Nassella pulchra', 'Purple Needlegrass' // Added for Purple Needlegrass photos
  ];

  const isPriorityPlant = priorityPlants.some(plant => 
    scientificName.toLowerCase().includes(plant.toLowerCase())
  );

  try {
    console.log(`Fetching photos for ${scientificName} (using base name: ${scientificName})...`);
    
    // Strategy 1: Enhanced search with higher per_page and broader geographic scope
    const baseUrl = `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&place_id=14&quality_grade=research&per_page=500&order=desc&order_by=created_at`;
    
    let observations: any[] = [];
    let totalObservations = 0;

    try {
      const response = await makeHttpsRequest(baseUrl);
      observations = response.results || [];
      totalObservations = observations.length;
      console.log(`Strategy 1 (base name, CA): Found ${totalObservations} observations`);
    } catch (error) {
      console.log(`Strategy 1 failed for ${scientificName}:`, error);
    }

    // Strategy 1.5: If we have subspecies/varieties, try base species name
    if (totalObservations < 10 && (scientificName.includes('var.') || scientificName.includes('ssp.'))) {
      const baseSpeciesName = scientificName.split(' ').slice(0, 2).join(' ');
      console.log(`Trying base species name: ${baseSpeciesName}`);
      
      const baseSpeciesUrl = `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(baseSpeciesName)}&place_id=14&quality_grade=research&per_page=500&order=desc&order_by=created_at`;
      
      try {
        const baseResponse = await makeHttpsRequest(baseSpeciesUrl);
        const baseObservations = baseResponse.results || [];
        console.log(`Strategy 1.5 (base species): Found ${baseObservations.length} observations`);
        
        // Combine observations, prioritizing subspecies ones
        const combinedObservations = [...observations];
        baseObservations.forEach(obs => {
          if (!combinedObservations.find(existing => existing.id === obs.id)) {
            combinedObservations.push(obs);
          }
        });
        
        observations = combinedObservations;
        totalObservations = observations.length;
      } catch (error) {
        console.log(`Strategy 1.5 failed for ${baseSpeciesName}:`, error);
      }
    }

    // Strategy 2: If we don't have enough winter photos, try broader geographic search
    const winterPhotos = observations.filter(obs => {
      if (!obs.observed_on) return false;
      const season = getSeasonFromDate(obs.observed_on);
      return season === 'winter';
    });

    if (winterPhotos.length < 2 && isPriorityPlant) {
      console.log(`Not enough winter photos (${winterPhotos.length}), trying broader search...`);
      
      // Try broader geographic search (US West Coast)
      const broaderUrl = `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&place_id=1&quality_grade=research&per_page=400&order=desc&order_by=created_at`;
      
      try {
        const broaderResponse = await makeHttpsRequest(broaderUrl);
        const broaderObservations = broaderResponse.results || [];
        console.log(`Strategy 2 (broader search): Found ${broaderObservations.length} additional observations`);
        
        // Combine observations, prioritizing California ones
        const combinedObservations = [...observations];
        broaderObservations.forEach(obs => {
          if (!combinedObservations.find(existing => existing.id === obs.id)) {
            combinedObservations.push(obs);
          }
        });
        
        observations = combinedObservations;
        totalObservations = observations.length;
      } catch (error) {
        console.log(`Strategy 2 failed for ${scientificName}:`, error);
      }
    }

    // Strategy 3: Aggressive seasonal photo search for specific plants
    const seasonCounts = {
      spring: observations.filter(obs => {
        if (!obs.observed_on) return false;
        const season = getSeasonFromDate(obs.observed_on);
        return season === 'spring';
      }).length,
      summer: observations.filter(obs => {
        if (!obs.observed_on) return false;
        const season = getSeasonFromDate(obs.observed_on);
        return season === 'summer';
      }).length,
      fall: observations.filter(obs => {
        if (!obs.observed_on) return false;
        const season = getSeasonFromDate(obs.observed_on);
        return season === 'fall';
      }).length,
      winter: observations.filter(obs => {
        if (!obs.observed_on) return false;
        const season = getSeasonFromDate(obs.observed_on);
        return season === 'winter';
      }).length
    };

    // Check for missing seasons and try to find them
    const missingSeasons = [];
    if (seasonCounts.spring < 2) missingSeasons.push({ season: 'spring', months: ['03', '04', '05'] });
    if (seasonCounts.summer < 2) missingSeasons.push({ season: 'summer', months: ['06', '07', '08'] });
    if (seasonCounts.fall < 2) missingSeasons.push({ season: 'fall', months: ['09', '10', '11'] });
    if (seasonCounts.winter < 2) missingSeasons.push({ season: 'winter', months: ['12', '01', '02'] });

    if (missingSeasons.length > 0 && isPriorityPlant) {
      console.log(`Missing seasons: ${missingSeasons.map(s => s.season).join(', ')}, trying month-specific search...`);
      
      for (const missingSeason of missingSeasons) {
        for (const month of missingSeason.months) {
          const monthUrl = `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&place_id=1&quality_grade=research&per_page=300&order=desc&order_by=created_at&month=${month}`;
          
          try {
            const monthResponse = await makeHttpsRequest(monthUrl);
            const monthObservations = monthResponse.results || [];
            console.log(`Strategy 3 (${missingSeason.season} month ${month}): Found ${monthObservations.length} observations`);
            
            // Add unique observations
            monthObservations.forEach(obs => {
              if (!observations.find(existing => existing.id === obs.id)) {
                observations.push(obs);
              }
            });
          } catch (error) {
            console.log(`Strategy 3 (${missingSeason.season} month ${month}) failed:`, error);
          }
        }
      }
      
      totalObservations = observations.length;
    }

    console.log(`Using ${totalObservations} unique observations for ${scientificName}`);

    // Strategy 4: Extra winter photo search for specific plants that need winter photos
    const winterPriorityPlants = ['Achillea millefolium', 'Clinopodium douglasii', 'Sambucus nigra ssp. caerulea', 'Nassella pulchra'];
    const needsWinterPhotos = winterPriorityPlants.some(plant => 
      scientificName.toLowerCase().includes(plant.toLowerCase())
    );

    if (needsWinterPhotos) {
      console.log(`Extra winter photo search for ${scientificName}...`);
      
      // Try multiple winter-specific searches
      const winterMonths = ['12', '01', '02'];
      for (const month of winterMonths) {
        const winterUrl = `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent(scientificName)}&place_id=1&quality_grade=research&per_page=200&order=desc&order_by=created_at&month=${month}`;
        
        try {
          const winterResponse = await makeHttpsRequest(winterUrl);
          const winterObservations = winterResponse.results || [];
          console.log(`Winter month ${month}: Found ${winterObservations.length} observations`);
          
          // Add unique winter observations
          winterObservations.forEach(obs => {
            if (!observations.find(existing => existing.id === obs.id)) {
              observations.push(obs);
            }
          });
        } catch (error) {
          console.log(`Winter month ${month} search failed:`, error);
        }
      }
    }

    // Strategy 5: Special search for Purple Needlegrass (Nassella pulchra)
    if (scientificName.toLowerCase().includes('nassella pulchra') || scientificName.toLowerCase().includes('purple needlegrass')) {
      console.log(`Special Purple Needlegrass photo search for ${scientificName}...`);
      
      // Search with broader geographic scope and different quality grades
      const purpleNeedlegrassSearches = [
        `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent('Nassella pulchra')}&place_id=14&per_page=200&order=desc&order_by=created_at`,
        `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent('Nassella pulchra')}&place_id=14&quality_grade=needs_id&per_page=200&order=desc&order_by=created_at`,
        `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent('Nassella pulchra')}&place_id=14&quality_grade=casual&per_page=200&order=desc&order_by=created_at`,
        // Search in broader California area
        `https://api.inaturalist.org/v1/observations?taxon_name=${encodeURIComponent('Nassella pulchra')}&place_id=14&swlat=32.5&swlng=-124.5&nelat=42.0&nelng=-114.0&per_page=200&order=desc&order_by=created_at`
      ];
      
      for (const searchUrl of purpleNeedlegrassSearches) {
        try {
          const response = await makeHttpsRequest(searchUrl);
          const searchObservations = response.results || [];
          console.log(`Purple Needlegrass search: Found ${searchObservations.length} observations`);
          
          // Add unique observations
          searchObservations.forEach(obs => {
            if (!observations.find(existing => existing.id === obs.id)) {
              observations.push(obs);
            }
          });
        } catch (error) {
          console.log(`Purple Needlegrass search failed:`, error);
        }
      }
      
      totalObservations = observations.length;
      console.log(`Total Purple Needlegrass observations: ${totalObservations}`);
    }

    // Process observations into seasonal photos
    const photosBySeason = {
      spring: [] as SeasonalPhoto[],
      summer: [] as SeasonalPhoto[],
      fall: [] as SeasonalPhoto[],
      winter: [] as SeasonalPhoto[]
    };

    observations.forEach(obs => {
      if (!obs.observed_on || !obs.photos || obs.photos.length === 0) return;
      
      const season = getSeasonFromDate(obs.observed_on);
      const photo = obs.photos[0]; // Take first photo
      
      if (photo && photo.url) {
        const seasonalPhoto: SeasonalPhoto = {
          url: photo.url.replace('square', 'medium'), // Better quality
          season,
          timestamp: obs.observed_on
        };
        
        photosBySeason[season].push(seasonalPhoto);
      }
    });

    // Select photos for each season
    const photos: SeasonalPhoto[] = [];
    const targetPhotosPerSeason = isPriorityPlant ? 5 : 3; // More photos for priority plants

    seasons.forEach(season => {
      const seasonPhotos = photosBySeason[season as keyof typeof photosBySeason];
      
      if (seasonPhotos.length > 0) {
        // Sort by timestamp (most recent first)
        const sortedPhotos = seasonPhotos.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Take up to targetPhotosPerSeason photos
        const selectedPhotos = sortedPhotos.slice(0, targetPhotosPerSeason);
        photos.push(...selectedPhotos);
      }
    });

    // Log results
    const seasonsWithPhotos = new Set(photos.map(p => p.season));
    const missingSeasonsLog = seasons.filter((s: string) => !seasonsWithPhotos.has(s as "spring" | "summer" | "fall" | "winter"));

    if (missingSeasonsLog.length > 0) {
      console.log(`Missing seasons for ${scientificName}: ${missingSeasonsLog.join(', ')} - tried enhanced strategies`);
    }

    console.log(`Returning ${photos.length} REAL photos for ${scientificName} (${photosBySeason.spring.length} spring, ${photosBySeason.summer.length} summer, ${photosBySeason.fall.length} fall, ${photosBySeason.winter.length} winter available)`);

    return photos;

  } catch (error) {
    console.error(`Error fetching photos for ${scientificName}:`, error);
    return [];
  }
}

export function getPhotoUrl(photo: SeasonalPhoto): string {
  return photo.url;
}

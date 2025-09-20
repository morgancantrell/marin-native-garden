import https from 'https';
import { URL } from 'url';

export interface SeasonalPhoto {
  url: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  timestamp: string;
}

// Clear cache to force fresh photo fetching
const photoCache = new Map<string, SeasonalPhoto[]>();

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
      timeout: 15000, // Reduced timeout for enhanced strategy
    };

    const req = https.request(options, (res: any) => {
      req.setTimeout(15000, () => {
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

function getBaseSpeciesName(scientificName: string): string {
  // Remove subspecies and varieties for broader search
  return scientificName.split(' ').slice(0, 2).join(' ');
}

function getSeasonFromDate(dateString: string): 'spring' | 'summer' | 'fall' | 'winter' {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

export async function fetchSeasonalPhotos(
  scientificName: string,
  seasons: string[] = ['spring', 'summer', 'fall', 'winter']
): Promise<SeasonalPhoto[]> {
  const photos: SeasonalPhoto[] = [];
  
  try {
    const baseSpeciesName = getBaseSpeciesName(scientificName);
    console.log(`Fetching photos for ${scientificName} (using base name: ${baseSpeciesName})...`);

    // Enhanced search strategy for priority plants
    const baseUrl = 'https://api.inaturalist.org/v1/observations';
    
    // Priority plants that need comprehensive photo coverage
    const priorityPlants = [
      'Quercus agrifolia', // Coast Live Oak - needs all 4 seasons
      'Lupinus nanus', // Sky Lupine - needs all seasons
      'Heteromeles arbutifolia', // Toyon - needs winter
      'Eriogonum nudum', // Naked Buckwheat - needs winter
      'Baccharis pilularis', // Coyote Brush
      'Frangula californica', // Coffeeberry - needs all 4 seasons
      'Diplacus aurantiacus' // Sticky Monkeyflower - needs winter
    ];
    
    const isPriorityPlant = priorityPlants.some(priority => 
      scientificName.toLowerCase().includes(priority.toLowerCase()) || 
      baseSpeciesName.toLowerCase().includes(priority.toLowerCase())
    );
    
    const perPage = isPriorityPlant ? '100' : '50'; // More photos for priority plants
    const placeId = isPriorityPlant ? '14' : '1'; // California focus for priority plants
    
    const params = new URLSearchParams({
      taxon_name: baseSpeciesName,
      photos: 'true',
      per_page: perPage,
      order: 'desc',
      order_by: 'created_at',
      has: 'photos',
      quality_grade: 'research',
      place_id: placeId,
    });

    let observations: any[] = [];
    
    // For priority plants, try multiple search strategies
    if (isPriorityPlant) {
      console.log(`Priority plant detected: ${scientificName} - using enhanced search strategy`);
      
      // Strategy 1: Base species name with California focus
      try {
        const params1 = new URLSearchParams({
          taxon_name: baseSpeciesName,
          photos: 'true',
          per_page: '200',
          order: 'desc',
          order_by: 'created_at',
          has: 'photos',
          quality_grade: 'research',
          place_id: '14', // California
        });
        
        const response1 = await makeHttpsRequest(`${baseUrl}?${params1.toString()}`);
        observations = response1.results || [];
        console.log(`Strategy 1 (base name, CA): Found ${observations.length} observations`);
      } catch (error) {
        console.log(`Strategy 1 failed for ${baseSpeciesName}`);
      }
      
      // Strategy 2: Full scientific name with broader geographic scope
      if (observations.length < 100) {
        try {
          const params2 = new URLSearchParams({
            taxon_name: scientificName,
            photos: 'true',
            per_page: '200',
            order: 'desc',
            order_by: 'created_at',
            has: 'photos',
            quality_grade: 'research',
            place_id: '1', // United States
          });
          
          const response2 = await makeHttpsRequest(`${baseUrl}?${params2.toString()}`);
          const additionalObservations = response2.results || [];
          console.log(`Strategy 2 (full name, US): Found ${additionalObservations.length} additional observations`);
          
          // Merge and deduplicate
          const existingIds = new Set(observations.map(obs => obs.id));
          const newObservations = additionalObservations.filter((obs: any) => !existingIds.has(obs.id));
          observations = [...observations, ...newObservations];
        } catch (error) {
          console.log(`Strategy 2 failed for ${scientificName}`);
        }
      }
      
      // Strategy 3: Try with different quality grades for more coverage
      if (observations.length < 150) {
        try {
          const params3 = new URLSearchParams({
            taxon_name: baseSpeciesName,
            photos: 'true',
            per_page: '200',
            order: 'desc',
            order_by: 'created_at',
            has: 'photos',
            quality_grade: 'needs_id', // Include needs_id for more photos
            place_id: '14', // California
          });
          
          const response3 = await makeHttpsRequest(`${baseUrl}?${params3.toString()}`);
          const additionalObservations = response3.results || [];
          console.log(`Strategy 3 (needs_id, CA): Found ${additionalObservations.length} additional observations`);
          
          // Merge and deduplicate
          const existingIds = new Set(observations.map(obs => obs.id));
          const newObservations = additionalObservations.filter((obs: any) => !existingIds.has(obs.id));
          observations = [...observations, ...newObservations];
        } catch (error) {
          console.log(`Strategy 3 failed for ${baseSpeciesName}`);
        }
      }
    } else {
      // Standard search for non-priority plants
      try {
        const response = await makeHttpsRequest(`${baseUrl}?${params.toString()}`);
        observations = response.results || [];
        console.log(`Found ${observations.length} observations for ${baseSpeciesName}`);
      } catch (error) {
        console.log(`Search failed for ${baseSpeciesName}, trying scientific name...`);
        
        // Fallback to scientific name with priority plant logic
        const fallbackParams = new URLSearchParams({
          taxon_name: scientificName,
          photos: 'true',
          per_page: perPage,
          order: 'desc',
          order_by: 'created_at',
          has: 'photos',
          quality_grade: 'research',
          place_id: placeId,
        });
        
        try {
          const fallbackResponse = await makeHttpsRequest(`${baseUrl}?${fallbackParams.toString()}`);
          observations = fallbackResponse.results || [];
          console.log(`Found ${observations.length} observations for ${scientificName}`);
        } catch (fallbackError) {
          console.log(`Both searches failed for ${scientificName}`);
          return [];
        }
      }
    }
    
    if (observations.length === 0) {
      console.log(`No observations found for ${scientificName}`);
      return [];
    }

    // Remove duplicates based on observation ID
    const uniqueObservations = observations.filter((obs, index, self) => 
      index === self.findIndex(o => o.id === obs.id)
    );

    if (uniqueObservations.length === 0) {
      console.log(`No research-grade observations found for ${scientificName}`);
      return [];
    }

    console.log(`Using ${uniqueObservations.length} unique observations for ${scientificName}`);

    // Group photos by season
    const photosBySeason: { [key: string]: any[] } = {
      spring: [],
      summer: [],
      fall: [],
      winter: []
    };

    for (const obs of uniqueObservations) {
      if (obs.photos && obs.photos.length > 0) {
        const season = getSeasonFromDate(obs.observed_on || obs.created_at);
        const photo = obs.photos[0]; // Use first photo
        
        photosBySeason[season].push({
          url: photo.url.replace('square', 'medium'), // Better quality
          timestamp: obs.observed_on || obs.created_at
        });
      }
    }

    // Prioritize getting more photos for priority plants
    const targetPhotosPerSeason = 3; // More photos for priority plants
    
    for (const season of seasons) {
      const seasonPhotos = photosBySeason[season];
      if (seasonPhotos.length > 0) {
        // Sort by date to get more recent photos first
        const sortedPhotos = seasonPhotos.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Take up to targetPhotosPerSeason photos
        const selectedPhotos = sortedPhotos.slice(0, targetPhotosPerSeason);
        
        for (const photo of selectedPhotos) {
          photos.push({
            url: photo.url,
            season: season as any,
            timestamp: photo.timestamp
          });
        }
      }
    }
    
    // Log missing seasons but don't fill gaps with incorrect seasonal photos
    const seasonsWithPhotos = new Set(photos.map(p => p.season));
    const missingSeasons = seasons.filter((s: string) => !seasonsWithPhotos.has(s as "spring" | "summer" | "fall" | "winter"));
    
    if (missingSeasons.length > 0) {
      console.log(`Missing seasons for ${scientificName}: ${missingSeasons.join(', ')} - not filling gaps to maintain seasonal accuracy`);
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
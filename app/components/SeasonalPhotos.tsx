import { SeasonalPhoto } from "@/lib/inaturalist-photos";

interface SeasonalPhotosProps {
  photos: SeasonalPhoto[];
  scientificName: string;
}

export function SeasonalPhotos({ photos, scientificName }: SeasonalPhotosProps) {
  // Handle empty photos array
  if (!photos || photos.length === 0) {
    return (
      <div className="mt-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Seasonal Photos</h4>
        <div className="grid grid-cols-2 gap-2">
          {["spring", "summer", "fall", "winter"].map((season) => (
            <div key={season} className="relative">
              <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  Loading...
                </div>
              </div>
              <p className="text-xs text-gray-900 mt-1 capitalize">{season}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const seasons = ['spring', 'summer', 'fall', 'winter'] as const;
  
  return (
    <div className="mt-4 mb-6">
      <h4 className="text-sm font-medium text-gray-900 mb-2">Seasonal Photos</h4>
      <div className="grid grid-cols-2 gap-2">
        {seasons.map((season) => {
          const seasonPhoto = photos.find(photo => 
            photo.season.toLowerCase() === season.toLowerCase()
          );
          
          return (
            <div key={season} className="relative">
              <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                {seasonPhoto ? (
                  <img
                    src={seasonPhoto.url}
                    alt={`${scientificName} in ${season}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            No photo
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    No photo
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-900 mt-1 capitalize">{season}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

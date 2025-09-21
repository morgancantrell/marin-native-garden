"use client";
import CompanionPlantCards from "@/app/components/CompanionPlantCards";
import { getCompanionGroupsForPlants } from "@/lib/companion-plants";
import AddressAutocomplete from "@/app/components/AddressAutocomplete";

import { useState } from "react";
import GrowthVisualizer from "./components/GrowthVisualizer";
import { SeasonalPhotos } from "./components/SeasonalPhotos";

interface Plant {
  scientificName: string;
  commonName: string;
  communities: string[];
  wildlifeSupportScore: number;
  evergreenDeciduous: string;
  lifespanYears: number;
  matureHeightFt: number;
  matureWidthFt: number;
  growthRate: string;
  flowerColors: string[];
  bloomMonths: number[];
  indigenousUses: string[];
  butterflies: Array<{ commonName: string; scientificName?: string }>;
  birds: Array<{ commonName: string; scientificName?: string }>;
  seasonalPhotos?: Array<{ url: string; season: "spring" | "summer" | "fall" | "winter"; timestamp: string }>;
}

interface Result {
  success: boolean;
  address: string;
  email: string;
  region: string;
  waterDistrict: string;
  enriched: Plant[];
  plants: Plant[];
  rebates: Array<{
    title: string;
    amount: string;
    requirements: string;
    link: string;
  }>;
  emailStatus: string;
  emailError: string;
  note: string;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Function to convert wildlife support score to plain English assessment
const getWildlifeAssessment = (score: number): string => {
  if (score >= 300) return "Keystone species";
  if (score >= 200) return "Major wildlife tree";
  if (score >= 120) return "Good wildlife plant";
  if (score >= 80) return "Moderate wildlife support";
  if (score >= 40) return "Some wildlife support";
  return "Limited wildlife support";
};

export default function Home() {
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setEmailError(null);
    setResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout

      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address, email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      
      if (data.emailError) {
        setEmailError(data.emailError);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError("Request timed out. Please try again with a simpler address.");
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('data:image/svg+xml;base64,${btoa(`
              <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#E0F6FF;stop-opacity:1" />
                  </linearGradient>
                  <linearGradient id="hills" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#90EE90;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#228B22;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <rect width="1200" height="800" fill="url(#sky)"/>
                <path d="M0,400 Q300,300 600,350 T1200,400 L1200,800 L0,800 Z" fill="url(#hills)"/>
                <circle cx="200" cy="200" r="3" fill="#9370DB" opacity="0.8"/>
                <circle cx="300" cy="180" r="2" fill="#9370DB" opacity="0.8"/>
                <circle cx="400" cy="220" r="3" fill="#9370DB" opacity="0.8"/>
                <circle cx="500" cy="190" r="2" fill="#9370DB" opacity="0.8"/>
                <circle cx="600" cy="210" r="3" fill="#9370DB" opacity="0.8"/>
                <circle cx="700" cy="200" r="2" fill="#9370DB" opacity="0.8"/>
                <circle cx="800" cy="180" r="3" fill="#9370DB" opacity="0.8"/>
                <circle cx="900" cy="220" r="2" fill="#9370DB" opacity="0.8"/>
                <circle cx="1000" cy="190" r="3" fill="#9370DB" opacity="0.8"/>
                <circle cx="1100" cy="210" r="2" fill="#9370DB" opacity="0.8"/>
              </svg>
            `)}')`
          }}
        ></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8">
        <div className="text-center mb-6 md:mb-8 bg-white/90 backdrop-blur-sm rounded-lg p-4 md:p-6 shadow-lg">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            Marin Native Garden Planner
          </h1>
          <p className="text-sm md:text-lg text-gray-900">
            Get personalized native plant recommendations for your Marin County property
          </p>
        </div>

        {!result && (
          <div className="max-w-md mx-auto bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-1">
                  Property Address
                </label>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  placeholder="Enter your Marin County address"
                  id="address"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                  autoComplete="email"
                  required
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "⏳ Generating plan..." : "Generate my garden plan"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}
        </div>
        )}

        {result && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 md:p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Your plan (preview)</h2>
                <button
                  onClick={() => {
                    setResult(null);
                    setError(null);
                    setEmailError(null);
                    setAddress("");
                    setEmail("");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Generate New Plan
                </button>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="mt-2 text-sm text-gray-900">
                  <div><span className="font-medium">Region:</span> {result.region}</div>
                  <div><span className="font-medium">Water District:</span> {result.waterDistrict}</div>
                  <div><span className="font-medium">Sun Exposure:</span> {result.sunExposure?.hours || 'N/A'} hours per day ({result.sunExposure?.level || 'N/A'})</div>
                </div>
              </div>

              {/* Plant Community Summary */}
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About {result.region}</h3>
                <div className="text-sm text-gray-800 space-y-2">
                  {result.region === "Oak Woodland" && (
                    <>
                      <p><strong>Habitat:</strong> Open woodlands dominated by coast live oak and valley oak, with diverse understory vegetation.</p>
                      <p><strong>Ecological Value:</strong> Provides critical habitat for birds, mammals, and insects. Oak trees support over 500 species of wildlife and are keystone species in California ecosystems.</p>
                      <p><strong>Range in Marin:</strong> Found throughout Marin County's hillsides, valleys, and coastal areas, particularly in areas with well-drained soils.</p>
                    </>
                  )}
                  {result.region === "Chaparral" && (
                    <>
                      <p><strong>Habitat:</strong> Dense, fire-adapted shrublands with evergreen, drought-tolerant plants on dry, rocky slopes.</p>
                      <p><strong>Ecological Value:</strong> Supports specialized wildlife adapted to Mediterranean climate, including many endemic species. Plays crucial role in watershed protection and fire ecology.</p>
                      <p><strong>Range in Marin:</strong> Common on south-facing slopes and ridges throughout Marin County, especially in drier inland areas.</p>
                    </>
                  )}
                  {result.region === "Riparian" && (
                    <>
                      <p><strong>Habitat:</strong> Streamside corridors with moisture-loving trees, shrubs, and herbaceous plants along waterways.</p>
                      <p><strong>Ecological Value:</strong> Critical wildlife corridors providing food, water, and shelter. Helps filter pollutants and stabilize stream banks.</p>
                      <p><strong>Range in Marin:</strong> Found along creeks, streams, and rivers throughout Marin County, including major watersheds.</p>
                    </>
                  )}
                  {result.region === "Grassland" && (
                    <>
                      <p><strong>Habitat:</strong> Open areas dominated by native grasses and wildflowers, often with scattered oak trees.</p>
                      <p><strong>Ecological Value:</strong> Supports grassland-dependent wildlife and provides important foraging habitat. Native grasses have deep root systems that improve soil health.</p>
                      <p><strong>Range in Marin:</strong> Found in valleys, coastal plains, and open areas throughout Marin County.</p>
                    </>
                  )}
                  {result.region === "Coastal Scrub" && (
                    <>
                      <p><strong>Habitat:</strong> Wind-swept coastal areas with salt-tolerant shrubs, grasses, and wildflowers adapted to harsh marine conditions.</p>
                      <p><strong>Ecological Value:</strong> Provides critical habitat for coastal wildlife including seabirds, shorebirds, and specialized insects. Acts as a buffer protecting inland areas from salt spray and wind.</p>
                      <p><strong>Range in Marin:</strong> Found along Marin's coastline including Stinson Beach, Bolinas, Point Reyes, and other coastal areas exposed to ocean winds and salt spray.</p>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Top plants:</h3>
                <div className="space-y-6">
                  {result.plants && result.plants.map((plant, index) => (
                    <div key={`${plant.scientificName}-${index}`} className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg p-3 md:p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900">{plant.commonName}</h4>
                          <p className="text-sm text-gray-900 italic">{plant.scientificName}</p>
                        </div>
                        <div className="text-right text-sm text-gray-900">
                          <div className="font-medium">Wildlife Support Score: {plant.wildlifeSupportScore}</div>
                          <div className="text-xs text-gray-600 italic">{getWildlifeAssessment(plant.wildlifeSupportScore)}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mt-4">
                        <div className="space-y-2 text-sm text-gray-900">
                          <div><span className="font-medium">Mature Size:</span> {plant.matureHeightFt}'H × {plant.matureWidthFt}'W</div>
                          <div><span className="font-medium">Growth Rate:</span> {plant.growthRate}</div>
                          <div><span className="font-medium">Type:</span> {plant.evergreenDeciduous}</div>
                          <div><span className="font-medium">Lifespan:</span> {plant.lifespanYears} years</div>
                          <div><span className="font-medium">Flower Colors:</span> {plant.flowerColors.join(", ")}</div>
                          <div><span className="font-medium">Bloom Season:</span> {plant.bloomMonths.map(m => monthNames[m - 1]).join(", ")}</div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-900">
                          <div><span className="font-medium">Indigenous Uses:</span> {plant.indigenousUses.join(", ")}</div>
                          {plant.butterflies && plant.butterflies.length > 0 && (
                            <div><span className="font-medium">Butterflies:</span> {plant.butterflies.map(b => b.commonName).join(", ")}</div>
                          )}
                          {plant.birds && plant.birds.length > 0 && (
                            <div><span className="font-medium">Birds:</span> {plant.birds.map(b => b.commonName).join(", ")}</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <h5 className="text-md font-semibold text-gray-900 mb-2">Average size over time</h5>
                        <GrowthVisualizer
                          scientificName={plant.scientificName}
                          commonName={plant.commonName}
                          matureHeightFt={plant.matureHeightFt}
                          matureWidthFt={plant.matureWidthFt}
                          lifespanYears={plant.lifespanYears}
                        />
                      </div>

                      {true && (
                        <div className="mt-4">
                          <SeasonalPhotos photos={plant.seasonalPhotos || []} scientificName={plant.scientificName} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Companion Plant Groups */}
              {result.plants && result.plants.length > 0 && (
                <CompanionPlantCards groups={getCompanionGroupsForPlants(result.plants.map(plant => ({
                  commonName: plant.commonName,
                  scientificName: plant.scientificName,
                  matureSize: `${plant.matureHeightFt}'H × ${plant.matureWidthFt}'W`,
                  growthRate: plant.growthRate,
                  bloomColor: plant.flowerColors.join(", "),
                  bloomSeason: plant.bloomMonths.map(m => monthNames[m - 1]).join(", "),
                  evergreenDeciduous: plant.evergreenDeciduous,
                  lifespan: `${plant.lifespanYears} years`,
                  waterNeeds: "Moderate", // Default value since it's not in the Plant interface
                  indigenousUses: plant.indigenousUses.join(", "),
                  birds: plant.birds?.map(b => b.commonName),
                  seasonalPhotos: plant.seasonalPhotos
                })))} />
              )}

              {result.rebates && result.rebates.length > 0 && (
                <div className="mt-8">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <div className="bg-green-100 rounded-full p-2 mr-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Water Conservation Rebates</h3>
                    </div>
                    <p className="text-gray-700 mb-6">Save money while creating your native garden with these available rebate programs from {result.waterDistrict}:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {result.rebates.map((rebate, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900 text-lg leading-tight">{rebate.title}</h4>
                            <div className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full ml-2">
                              {rebate.amount}
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4 leading-relaxed">{rebate.requirements}</p>
                          
                          <a 
                            href={rebate.link} 
          target="_blank"
          rel="noopener noreferrer"
                            className="inline-flex items-center text-green-700 hover:text-green-800 font-medium text-sm transition-colors"
                          >
                            <span>Apply for rebate</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        <strong>💡 Tip:</strong> These rebates can significantly reduce the cost of your native garden installation. 
                        Check eligibility requirements and apply before starting your project.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result.emailStatus && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-blue-700">
                    {result.emailStatus === "200" 
                      ? "✅ Your personalized garden plan has been sent to your email!" 
                      : `📧 Email status: ${result.emailStatus}`}
                  </p>
                  {result.emailError && (
                    <p className="text-red-600 text-sm mt-1">Email error: {result.emailError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

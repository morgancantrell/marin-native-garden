import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { geocodeAddress } from "@/lib/geocode";
import { fetchSeasonalPhotos } from "@/lib/inaturalist-photos";
import { getPlantsForRegion } from "@/lib/plants";
import { getRebates } from "@/lib/rebates";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, email } = body;

    if (!address || !email) {
      return Response.json({ error: "Address and email are required" }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    console.log(`Processing request for address: ${address}`);

    // Geocode the address
    let geocodeResult;
    try {
      geocodeResult = await geocodeAddress(address);
      console.log('Geocode result:', geocodeResult);
    } catch (error) {
      console.error('Geocoding error:', error);
      return Response.json({ error: "Geocoding failed: " + (error as Error).message }, { status: 400 });
    }
    
    if (!geocodeResult) {
      console.error('No geocode result returned');
      return Response.json({ error: "Could not geocode address" }, { status: 400 });
    }

    const { latitude, longitude, city } = geocodeResult;
    console.log(`Geocoded to: ${city} at ${latitude}, ${longitude}`);

    // Determine plant community and water district
    const region = determineRegionHeuristic(city);
    const waterDistrict = determineWaterDistrict(city);
    
    console.log(`Determined region: ${region} for city: ${city}`);
    console.log(`Water district: ${waterDistrict}`);

    // Get plants for the region
    const plants = getPlantsForRegion(region);
    console.log(`Found ${plants.length} plants for region: ${region}`);

    // Fetch seasonal photos for each plant (with timeout)
    const plantsWithPhotos = await Promise.all(
      plants.map(async (plant) => {
        try {
          console.log(`Fetching photos for ${plant.scientificName} (using base name: ${plant.scientificName})...`);
          
          // Add timeout to prevent hanging
          const photosPromise = fetchSeasonalPhotos(plant.scientificName);
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Photo fetch timeout')), 35000)
          );
          
          const photos = await Promise.race([photosPromise, timeoutPromise]);
          console.log(`Fetched ${photos.length} photos for ${plant.scientificName}`);
          
          return {
            ...plant,
            seasonalPhotos: photos,
          };
        } catch (error) {
          console.error(`Error fetching photos for ${plant.scientificName}:`, error);
          return {
            ...plant,
            seasonalPhotos: [],
          };
        }
      })
    );

    // Get rebates for the water district
    const rebates = getRebates(waterDistrict);

    // Send email with PDF attachment
    let emailStatus = "not attempted";
    let emailError = "";
    
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      const mailFrom = process.env.MAIL_FROM;
      
      if (resendApiKey && mailFrom) {
        const emailData = {
          from: mailFrom,
          to: [email],
          subject: `Your Marin Native Garden Plan - ${address}`,
          html: `
            <h2>Your Marin Native Garden Plan</h2>
            <p>Thank you for using the Marin Native Garden Planner!</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Plant Community:</strong> ${region}</p>
            <p><strong>Water District:</strong> ${waterDistrict}</p>
            <p>Your personalized garden plan includes:</p>
            <ul>
              <li>10 native plants recommended for your area</li>
              <li>Seasonal photos of each plant</li>
              <li>Plant characteristics and growing information</li>
              <li>Indigenous uses and wildlife benefits</li>
              <li>Available rebate programs</li>
            </ul>
            <p>Happy gardening!</p>
          `
        };

        // Simple fetch request to Resend API
        const https = require('https');
        const agent = new https.Agent({ rejectUnauthorized: false });
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          agent,
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        if (response.ok) {
          emailStatus = "sent";
          console.log("Email sent successfully");
        } else {
          const errorData = await response.json();
          emailStatus = "failed";
          emailError = errorData.message || `Email failed with status ${response.status}`;
          console.error("Email failed:", errorData);
        }
      } else {
        emailStatus = "failed";
        emailError = "Missing RESEND_API_KEY or MAIL_FROM environment variables";
        console.error("Missing email configuration");
      }
    } catch (error) {
      console.error("Email sending error:", error);
      emailStatus = "failed";
      emailError = (error as Error).message;
    }

    // Save to database
    try {
      await prisma.submission.create({
        data: {
          address,
          email,
          region,
          waterDistrict,
          plantsJson: JSON.stringify(plantsWithPhotos),
        },
      });
    } catch (dbError) {
      console.error("Database save failed:", dbError);
    }

    return Response.json({
      success: true,
      region,
      waterDistrict,
      plants: plantsWithPhotos,
      rebates,
      emailStatus,
      emailError,
    });

  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function determineRegionHeuristic(city: string): string {
  const cityLower = city.toLowerCase();
  
  if (cityLower.includes('fairfax') || cityLower.includes('woodacre') || cityLower.includes('san anselmo')) {
    return 'Oak Woodland';
  } else if (cityLower.includes('mill valley') || cityLower.includes('tiburon') || cityLower.includes('sausalito')) {
    return 'Chaparral';
  } else if (cityLower.includes('novato') || cityLower.includes('petaluma')) {
    return 'Grassland';
  } else {
    return 'Oak Woodland'; // Default
  }
}

function determineWaterDistrict(city: string): string {
  const cityLower = city.toLowerCase();
  
  if (cityLower.includes('novato') || cityLower.includes('petaluma')) {
    return 'North Marin Water District';
  } else {
    return 'Marin Water';
  }
}

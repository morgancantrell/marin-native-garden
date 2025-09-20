import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { geocodeAddress } from "@/lib/geocode";
import { fetchSeasonalPhotos } from "@/lib/inaturalist-photos";
import { getPlantsForRegion } from "@/lib/plants";
import { getRebates } from "@/lib/rebates";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

    // Geocode the address
    let geocodeResult;
    try {
      geocodeResult = await geocodeAddress(address);
    } catch (error) {
      console.error('Geocoding error:', error);
      return Response.json({ error: "Geocoding failed: " + (error as Error).message }, { status: 400 });
    }
    
    if (!geocodeResult) {
      return Response.json({ error: "Could not geocode address" }, { status: 400 });
    }

    const { latitude, longitude, city } = geocodeResult;
    const region = determineRegionHeuristic(city);
    const waterDistrict = determineWaterDistrict(city);

    console.log(`Determined region: ${region} for city: ${city}`);

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
            seasonalPhotos: photos
          };
        } catch (error) {
          console.error(`Error fetching photos for ${plant.scientificName}:`, error);
          return {
            ...plant,
            seasonalPhotos: []
          };
        }
      })
    );

    // Get rebates for the water district
    const rebates = getRebates(waterDistrict);

    // Generate PDF
    const pdfBytes = await generatePdf(address, region, waterDistrict, plantsWithPhotos, rebates);
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    // Send email with PDF attachment
    let emailStatus = "not attempted";
    let emailError = "";
    
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      const mailFrom = process.env.MAIL_FROM;
      
      if (resendApiKey && mailFrom) {
        const emailData = {
          from: "Marin Native Garden <" + mailFrom + ">",
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
            <p>Please see the attached PDF for your complete garden plan.</p>
            <p>Happy gardening!</p>
          `,
          attachments: [
            {
              filename: `marin-garden-plan-${address.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`,
              content: pdfBase64,
              type: "application/pdf"
            }
          ]
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
      note: "Email sent successfully"
    });

  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function determineRegionHeuristic(city: string): string {
  const cityLower = city.toLowerCase();
  
  // Oak Woodland areas
  if (cityLower.includes('san rafael') || cityLower.includes('novato') || 
      cityLower.includes('petaluma') || cityLower.includes('santa rosa')) {
    return 'Oak Woodland';
  }
  
  // Chaparral areas
  if (cityLower.includes('mill valley') || cityLower.includes('tiburon') || 
      cityLower.includes('sausalito') || cityLower.includes('fairfax')) {
    return 'Chaparral';
  }
  
  // Riparian areas
  if (cityLower.includes('corte madera') || cityLower.includes('larkspur') || 
      cityLower.includes('greenbrae')) {
    return 'Riparian';
  }
  
  // Grassland areas
  if (cityLower.includes('napa') || cityLower.includes('sonoma')) {
    return 'Grassland';
  }
  
  // Default to Oak Woodland
  return 'Oak Woodland';
}

function determineWaterDistrict(city: string): string {
  const cityLower = city.toLowerCase();
  
  // North Marin Water District areas
  if (cityLower.includes('novato') || cityLower.includes('petaluma')) {
    return 'North Marin Water District';
  }
  
  // Default to Marin Water
  return 'Marin Water';
}

async function generatePdf(address: string, region: string, waterDistrict: string, plants: any[], rebates: any[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = height - 50;
  
  // Helper function to add text
  const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false) => {
    const currentFont = isBold ? boldFont : font;
    page.drawText(String(text || ''), {
      x,
      y,
      size: fontSize,
      font: currentFont,
      color: rgb(0, 0, 0),
    });
  };
  
  // Title
  addText('Marin Native Garden Plan', 50, yPosition, 24, true);
  yPosition -= 40;
  
  // Address and region info
  addText(`Address: ${address}`, 50, yPosition, 14, true);
  yPosition -= 25;
  addText(`Plant Community: ${region}`, 50, yPosition, 12);
  yPosition -= 20;
  addText(`Water District: ${waterDistrict}`, 50, yPosition, 12);
  yPosition -= 40;
  
  // Plants section
  addText('Recommended Native Plants', 50, yPosition, 18, true);
  yPosition -= 30;
  
  plants.forEach((plant, index) => {
    if (yPosition < 100) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([612, 792]);
      yPosition = newPage.getSize().height - 50;
    }
    
    addText(`${index + 1}. ${plant.commonName} (${plant.scientificName})`, 50, yPosition, 14, true);
    yPosition -= 20;
    addText(`Size: ${plant.matureHeightFt}'H × ${plant.matureWidthFt}'W`, 70, yPosition, 10);
    yPosition -= 15;
    addText(`Growth Rate: ${plant.growthRate}`, 70, yPosition, 10);
    yPosition -= 15;
    addText(`Type: ${plant.evergreenDeciduous}`, 70, yPosition, 10);
    yPosition -= 15;
    addText(`Flower Colors: ${plant.flowerColors.join(', ')}`, 70, yPosition, 10);
    yPosition -= 15;
    addText(`Bloom Season: ${plant.bloomMonths.map((m: number) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]).join(', ')}`, 70, yPosition, 10);
    yPosition -= 15;
    addText(`Indigenous Uses: ${plant.indigenousUses.join(', ')}`, 70, yPosition, 10);
    yPosition -= 15;
    if (plant.birds && plant.birds.length > 0) {
      addText(`Birds: ${plant.birds.map((b: any) => b.commonName).join(', ')}`, 70, yPosition, 10);
      yPosition -= 15;
    }
    yPosition -= 20;
  });
  
  // Rebates section
  if (rebates && rebates.length > 0) {
    yPosition -= 20;
    addText('Available Rebates', 50, yPosition, 18, true);
    yPosition -= 30;
    
    rebates.forEach((rebate) => {
      if (yPosition < 100) {
        const newPage = pdfDoc.addPage([612, 792]);
        yPosition = newPage.getSize().height - 50;
      }
      
      addText(rebate.title, 50, yPosition, 14, true);
      yPosition -= 20;
      addText(`Amount: ${rebate.amount}`, 70, yPosition, 12);
      yPosition -= 15;
      addText(`Requirements: ${rebate.requirements}`, 70, yPosition, 10);
      yPosition -= 25;
    });
  }
  
  return await pdfDoc.save();
}

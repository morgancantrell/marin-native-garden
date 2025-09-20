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

// Function to convert wildlife support score to plain English assessment
const getWildlifeAssessment = (score: number): string => {
  if (score >= 300) return "Keystone species";
  if (score >= 200) return "Major wildlife tree";
  if (score >= 120) return "Good wildlife plant";
  if (score >= 80) return "Moderate wildlife support";
  if (score >= 40) return "Some wildlife support";
  return "Limited wildlife support";
};

async function generatePdf(address: string, region: string, waterDistrict: string, plants: any[], rebates: any[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let currentPage = page;
  let yPosition = height - 50;
  
  // Helper function to add text with proper spacing
  const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false, color: any = rgb(0, 0, 0)) => {
    const currentFont = isBold ? boldFont : font;
    currentPage.drawText(String(text || ''), {
      x,
      y,
      size: fontSize,
      font: currentFont,
      color,
    });
  };
  
  // Helper function to add a new page if needed
  const checkNewPage = (requiredSpace: number = 50) => {
    if (yPosition < requiredSpace) {
      currentPage = pdfDoc.addPage([612, 792]);
      yPosition = currentPage.getSize().height - 50;
      return true;
    }
    return false;
  };
  
  // Helper function to add plant photos
  const addPlantPhotos = async (plant: any, startY: number) => {
    if (!plant.seasonalPhotos || plant.seasonalPhotos.length === 0) return startY;
    
    const photoSize = 60;
    const photosPerRow = 4;
    const photoSpacing = 10;
    const totalWidth = (photoSize * photosPerRow) + (photoSpacing * (photosPerRow - 1));
    const startX = (width - totalWidth) / 2;
    
    let photoY = startY;
    let photoIndex = 0;
    
    // Add photos in rows
    for (let row = 0; row < Math.ceil(plant.seasonalPhotos.length / photosPerRow); row++) {
      if (checkNewPage(photoSize + 30)) {
        photoY = yPosition;
      }
      
      for (let col = 0; col < photosPerRow && photoIndex < plant.seasonalPhotos.length; col++) {
        const photo = plant.seasonalPhotos[photoIndex];
        const photoX = startX + (col * (photoSize + photoSpacing));
        
        try {
          // Fetch and embed photo
          const photoResponse = await fetch(photo.url);
          const photoBytes = await photoResponse.arrayBuffer();
          const photoImage = await pdfDoc.embedPng(photoBytes);
          
          // Draw photo
          currentPage.drawImage(photoImage, {
            x: photoX,
            y: photoY - photoSize,
            width: photoSize,
            height: photoSize,
          });
          
          // Add season label
          addText(photo.season.charAt(0).toUpperCase() + photo.season.slice(1), 
            photoX + photoSize/2 - 10, photoY - photoSize - 15, 8, false, rgb(0.3, 0.3, 0.3));
          
        } catch (error) {
          console.log(`Failed to load photo for ${plant.commonName}:`, error);
        }
        
        photoIndex++;
      }
      
      photoY -= photoSize + 40; // Move to next row
    }
    
    return photoY;
  };
  
  // Title with modern styling
  addText('Marin Native Garden Plan', 50, yPosition, 28, true, rgb(0.2, 0.4, 0.2));
  yPosition -= 50;
  
  // Address and region info in a styled box
  const infoBoxY = yPosition;
  currentPage.drawRectangle({
    x: 40,
    y: infoBoxY - 80,
    width: width - 80,
    height: 80,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.95, 0.95, 0.95),
  });
  
  addText(`Address: ${address}`, 50, infoBoxY - 20, 14, true);
  addText(`Plant Community: ${region}`, 50, infoBoxY - 40, 12);
  addText(`Water District: ${waterDistrict}`, 50, infoBoxY - 60, 12);
  yPosition = infoBoxY - 100;
  
  // Plants section with modern styling
  addText('Recommended Native Plants', 50, yPosition, 20, true, rgb(0.2, 0.4, 0.2));
  yPosition -= 40;
  
  for (let i = 0; i < plants.length; i++) {
    const plant = plants[i];
    
    // Check if we need a new page
    checkNewPage(200);
    
    // Plant header with background
    const plantHeaderY = yPosition;
    currentPage.drawRectangle({
      x: 40,
      y: plantHeaderY - 30,
      width: width - 80,
      height: 30,
      color: rgb(0.9, 0.95, 0.9),
    });
    
    addText(`${i + 1}. ${plant.commonName}`, 50, plantHeaderY - 20, 16, true);
    addText(`(${plant.scientificName})`, 50, plantHeaderY - 35, 12, false, rgb(0.4, 0.4, 0.4));
    yPosition = plantHeaderY - 50;
    
    // Plant details in two columns
    const leftColumnX = 50;
    const rightColumnX = width / 2 + 20;
    
    addText(`Size: ${plant.matureHeightFt}'H × ${plant.matureWidthFt}'W`, leftColumnX, yPosition, 11);
    addText(`Growth Rate: ${plant.growthRate}`, rightColumnX, yPosition, 11);
    yPosition -= 18;
    
    addText(`Wildlife Support: ${plant.wildlifeSupportScore} (${getWildlifeAssessment(plant.wildlifeSupportScore)})`, leftColumnX, yPosition, 11);
    yPosition -= 18;
    
    addText(`Type: ${plant.evergreenDeciduous}`, leftColumnX, yPosition, 11);
    addText(`Lifespan: ${plant.lifespanYears} years`, rightColumnX, yPosition, 11);
    yPosition -= 18;
    
    addText(`Flower Colors: ${plant.flowerColors.join(', ')}`, leftColumnX, yPosition, 11);
    yPosition -= 18;
    
    addText(`Bloom Season: ${plant.bloomMonths.map((m: number) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]).join(', ')}`, leftColumnX, yPosition, 11);
    yPosition -= 18;
    
    addText(`Indigenous Uses: ${plant.indigenousUses.join(', ')}`, leftColumnX, yPosition, 11);
    yPosition -= 18;
    
    if (plant.birds && plant.birds.length > 0) {
      addText(`Birds: ${plant.birds.map((b: any) => b.commonName).join(', ')}`, leftColumnX, yPosition, 11);
      yPosition -= 18;
    }
    
    // Add plant photos
    yPosition = await addPlantPhotos(plant, yPosition - 20);
    yPosition -= 30; // Space between plants
  }
  
  // Rebates section with modern styling
  if (rebates && rebates.length > 0) {
    checkNewPage(150);
    
    addText('Available Rebates', 50, yPosition, 20, true, rgb(0.2, 0.4, 0.2));
    yPosition -= 40;
    
    rebates.forEach((rebate, index) => {
      checkNewPage(100);
      
      // Rebate card styling
      const rebateCardY = yPosition;
      currentPage.drawRectangle({
        x: 40,
        y: rebateCardY - 80,
        width: width - 80,
        height: 80,
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
        color: rgb(0.98, 0.98, 0.98),
      });
      
      addText(rebate.title, 50, rebateCardY - 20, 14, true);
      addText(`Amount: ${rebate.amount}`, 50, rebateCardY - 40, 12, false, rgb(0.2, 0.6, 0.2));
      addText(`Requirements: ${rebate.requirements}`, 50, rebateCardY - 60, 10);
      
      yPosition = rebateCardY - 100;
    });
  }
  
  return await pdfDoc.save();
}

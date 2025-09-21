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
            setTimeout(() => reject(new Error('Photo fetch timeout')), 45000)
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
  
  // Helper function to add plant photos with better error handling
  const addPlantPhotos = async (plant: any, startY: number) => {
    if (!plant.seasonalPhotos || plant.seasonalPhotos.length === 0) return startY;
    
    const photoSize = 80;
    const photosPerRow = 4;
    const photoSpacing = 15;
    const totalWidth = (photoSize * photosPerRow) + (photoSpacing * (photosPerRow - 1));
    const startX = (width - totalWidth) / 2;
    
    let photoY = startY;
    let photoIndex = 0;
    
    // Add photos in rows
    for (let row = 0; row < Math.ceil(plant.seasonalPhotos.length / photosPerRow); row++) {
      if (checkNewPage(photoSize + 50)) {
        photoY = yPosition;
      }
      
      for (let col = 0; col < photosPerRow && photoIndex < plant.seasonalPhotos.length; col++) {
        const photo = plant.seasonalPhotos[photoIndex];
        const photoX = startX + (col * (photoSize + photoSpacing));
        
        try {
          // Fetch and embed photo with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const photoResponse = await fetch(photo.url, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Marin-Native-Garden/1.0'
            }
          });
          clearTimeout(timeoutId);
          
          if (photoResponse.ok) {
            const photoBytes = await photoResponse.arrayBuffer();
            const photoImage = await pdfDoc.embedPng(photoBytes);
            
            // Draw photo with border
            currentPage.drawRectangle({
              x: photoX - 2,
              y: photoY - photoSize - 2,
              width: photoSize + 4,
              height: photoSize + 4,
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 1,
            });
            
            currentPage.drawImage(photoImage, {
              x: photoX,
              y: photoY - photoSize,
              width: photoSize,
              height: photoSize,
            });
            
            // Add season label with background
            const seasonText = photo.season.charAt(0).toUpperCase() + photo.season.slice(1);
            const textWidth = boldFont.widthOfTextAtSize(seasonText, 9);
            currentPage.drawRectangle({
              x: photoX + photoSize/2 - textWidth/2 - 2,
              y: photoY - photoSize - 20,
              width: textWidth + 4,
              height: 12,
              color: rgb(0.2, 0.4, 0.2),
            });
            
            addText(seasonText, 
              photoX + photoSize/2 - textWidth/2, photoY - photoSize - 15, 9, true, rgb(1, 1, 1));
          }
          
        } catch (error) {
          console.log(`Failed to load photo for ${plant.commonName}:`, error);
          // Draw placeholder rectangle
          currentPage.drawRectangle({
            x: photoX,
            y: photoY - photoSize,
            width: photoSize,
            height: photoSize,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 1,
            color: rgb(0.95, 0.95, 0.95),
          });
          addText("Photo", photoX + photoSize/2 - 10, photoY - photoSize/2, 10, false, rgb(0.5, 0.5, 0.5));
        }
        
        photoIndex++;
      }
      
      photoY -= photoSize + 50; // Move to next row
    }
    
    return photoY;
  };
  
  // Creative Agency Style Header
  const headerHeight = 120;
  currentPage.drawRectangle({
    x: 0,
    y: height - headerHeight,
    width: width,
    height: headerHeight,
    color: rgb(0.1, 0.3, 0.1),
  });
  
  // Main title
  addText('MARIN NATIVE GARDEN PLAN', 50, height - 40, 32, true, rgb(1, 1, 1));
  
  // Subtitle
  addText('Personalized Native Plant Recommendations', 50, height - 70, 14, false, rgb(0.9, 0.9, 0.9));
  
  // Client info section
  yPosition = height - headerHeight - 30;
  
  // Client info box with modern styling
  const infoBoxY = yPosition;
  currentPage.drawRectangle({
    x: 40,
    y: infoBoxY - 100,
    width: width - 80,
    height: 100,
    borderColor: rgb(0.2, 0.4, 0.2),
    borderWidth: 2,
    color: rgb(0.98, 0.98, 0.98),
  });
  
  // Client info header
  addText('PROJECT DETAILS', 60, infoBoxY - 25, 16, true, rgb(0.2, 0.4, 0.2));
  
  // Client info content
  addText(`Property Address: ${address}`, 60, infoBoxY - 45, 12, false, rgb(0.2, 0.2, 0.2));
  addText(`Plant Community: ${region}`, 60, infoBoxY - 65, 12, false, rgb(0.2, 0.2, 0.2));
  addText(`Water District: ${waterDistrict}`, 60, infoBoxY - 85, 12, false, rgb(0.2, 0.2, 0.2));
  
  yPosition = infoBoxY - 120;
  
  // Plants section with creative agency styling
  addText('RECOMMENDED NATIVE PLANTS', 50, yPosition, 24, true, rgb(0.2, 0.4, 0.2));
  yPosition -= 50;
  
  for (let i = 0; i < plants.length; i++) {
    const plant = plants[i];
    
    // Check if we need a new page (more space for photos)
    checkNewPage(300);
    
    // Plant card with modern styling
    const cardY = yPosition;
    const cardHeight = 200; // Increased for photos
    
    // Card background with subtle shadow effect
    currentPage.drawRectangle({
      x: 40,
      y: cardY - cardHeight,
      width: width - 80,
      height: cardHeight,
      borderColor: rgb(0.2, 0.4, 0.2),
      borderWidth: 1,
      color: rgb(0.99, 0.99, 0.99),
    });
    
    // Plant header with accent color
    currentPage.drawRectangle({
      x: 40,
      y: cardY - 40,
      width: width - 80,
      height: 40,
      color: rgb(0.2, 0.4, 0.2),
    });
    
    addText(`${i + 1}. ${plant.commonName.toUpperCase()}`, 60, cardY - 25, 16, true, rgb(1, 1, 1));
    addText(`(${plant.scientificName})`, 60, cardY - 40, 10, false, rgb(0.8, 0.8, 0.8));
    
    // Plant details with consistent spacing
    let detailY = cardY - 60;
    const leftColumnX = 60;
    const rightColumnX = width / 2 + 20;
    
    addText(`Mature Size: ${plant.matureHeightFt}'H × ${plant.matureWidthFt}'W`, leftColumnX, detailY, 11, false, rgb(0.2, 0.2, 0.2));
    addText(`Growth Rate: ${plant.growthRate}`, rightColumnX, detailY, 11, false, rgb(0.2, 0.2, 0.2));
    detailY -= 20;
    
    addText(`Wildlife Support: ${plant.wildlifeSupportScore} (${getWildlifeAssessment(plant.wildlifeSupportScore)})`, leftColumnX, detailY, 11, false, rgb(0.2, 0.2, 0.2));
    detailY -= 20;
    
    addText(`Type: ${plant.evergreenDeciduous}`, leftColumnX, detailY, 11, false, rgb(0.2, 0.2, 0.2));
    addText(`Lifespan: ${plant.lifespanYears} years`, rightColumnX, detailY, 11, false, rgb(0.2, 0.2, 0.2));
    detailY -= 20;
    
    addText(`Flower Colors: ${plant.flowerColors.join(', ')}`, leftColumnX, detailY, 11, false, rgb(0.2, 0.2, 0.2));
    detailY -= 20;
    
    addText(`Bloom Season: ${plant.bloomMonths.map((m: number) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]).join(', ')}`, leftColumnX, detailY, 11, false, rgb(0.2, 0.2, 0.2));
    detailY -= 20;
    
    addText(`Indigenous Uses: ${plant.indigenousUses.join(', ')}`, leftColumnX, detailY, 11, false, rgb(0.2, 0.2, 0.2));
    detailY -= 20;
    
    if (plant.birds && plant.birds.length > 0) {
      addText(`Birds Attracted: ${plant.birds.map((b: any) => b.commonName).join(', ')}`, leftColumnX, detailY, 11, false, rgb(0.2, 0.2, 0.2));
      detailY -= 20;
    }
    
    // Add plant photos
    yPosition = await addPlantPhotos(plant, detailY - 10);
    yPosition -= 40; // Space between plants
  }
  
  // Rebates section with creative agency styling
  if (rebates && rebates.length > 0) {
    checkNewPage(200);
    
    addText('AVAILABLE REBATES & INCENTIVES', 50, yPosition, 24, true, rgb(0.2, 0.4, 0.2));
    yPosition -= 50;
    
    rebates.forEach((rebate, index) => {
      checkNewPage(120);
      
      // Rebate card with modern styling
      const rebateCardY = yPosition;
      const cardHeight = 100;
      
      // Card background
      currentPage.drawRectangle({
        x: 40,
        y: rebateCardY - cardHeight,
        width: width - 80,
        height: cardHeight,
        borderColor: rgb(0.2, 0.4, 0.2),
        borderWidth: 1,
        color: rgb(0.99, 0.99, 0.99),
      });
      
      // Rebate header
      currentPage.drawRectangle({
        x: 40,
        y: rebateCardY - 30,
        width: width - 80,
        height: 30,
        color: rgb(0.2, 0.4, 0.2),
      });
      
      addText(rebate.title.toUpperCase(), 60, rebateCardY - 20, 14, true, rgb(1, 1, 1));
      
      // Rebate amount badge
      const amountText = rebate.amount;
      const amountWidth = boldFont.widthOfTextAtSize(amountText, 12);
      currentPage.drawRectangle({
        x: width - 80 - amountWidth - 20,
        y: rebateCardY - 25,
        width: amountWidth + 10,
        height: 20,
        color: rgb(0.8, 0.9, 0.8),
      });
      addText(amountText, width - 80 - amountWidth - 15, rebateCardY - 18, 12, true, rgb(0.2, 0.4, 0.2));
      
      // Rebate details
      addText(`Requirements: ${rebate.requirements}`, 60, rebateCardY - 50, 10, false, rgb(0.2, 0.2, 0.2));
      
      // Link (as text since PDF-lib doesn't support clickable links easily)
      addText(`Apply at: ${rebate.link}`, 60, rebateCardY - 70, 10, false, rgb(0.2, 0.4, 0.2));
      
      yPosition = rebateCardY - 120;
    });
  }
  
  return await pdfDoc.save();
}

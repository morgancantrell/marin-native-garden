import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getPlantsForRegion } from '@/lib/plants';
import { getRebates } from '@/lib/rebates';
import { fetchSeasonalPhotos } from '@/lib/inaturalist-photos';
import { getCompanionGroupsForPlants } from '@/lib/companion-plants';
import { calculateSunExposure } from '@/lib/sun-exposure-calculator';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const prisma = new PrismaClient();

function determineRegionHeuristic(city: string): string {
  const cityLower = city.toLowerCase();
  
  // Chaparral areas
  if (cityLower.includes('mill valley') || cityLower.includes('tiburon') || 
      cityLower.includes('belvedere') || cityLower.includes('sausalito') || 
      cityLower.includes('fairfax')) {
    return 'Chaparral';
  }
  
  // Riparian areas
  if (cityLower.includes('corte madera') || cityLower.includes('larkspur') || 
      cityLower.includes('greenbrae')) {
    return 'Riparian';
  }
  
  // Coastal Scrub areas
  if (cityLower.includes('stinson beach') || cityLower.includes('bolinas') || 
      cityLower.includes('point reyes') || cityLower.includes('inverness') || 
      cityLower.includes('muir beach')) {
    return 'Coastal Scrub';
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

async function generatePdf(address: string, region: string, waterDistrict: string, plants: any[], rebates: any[], sunExposureData: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let currentPage = page;
  let yPosition = height - 40;
  
  // Sophisticated agency color palette - muted earthy tones with single accent
  const colors = {
    // Primary colors - sophisticated neutrals
    charcoal: rgb(0.20, 0.20, 0.20),        // Deep charcoal for headers
    slate: rgb(0.35, 0.35, 0.35),           // Medium slate for subtext
    stone: rgb(0.55, 0.55, 0.55),           // Light stone for body text
    mist: rgb(0.75, 0.75, 0.75),            // Very light mist for borders
    
    // Background colors - clean whites and off-whites
    white: rgb(1, 1, 1),                    // Pure white
    cream: rgb(0.98, 0.98, 0.98),           // Subtle cream background
    paper: rgb(0.96, 0.96, 0.96),           // Paper-like background
    
    // Single accent color - sophisticated sage green
    sage: rgb(0.45, 0.55, 0.45),            // Muted sage green accent
    
    // Photo frame colors
    frame: rgb(0.90, 0.90, 0.90),           // Light frame
    shadow: rgb(0.85, 0.85, 0.85)           // Subtle shadow
  };
  
  // Helper function to add text with proper spacing
  const addText = (text: string, x: number, y: number, fontSize: number = 12, isBold: boolean = false, color: any = colors.stone) => {
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
      yPosition = currentPage.getSize().height - 40;
      return true;
    }
    return false;
  };
  
  // Helper function to add plant photos with better error handling
  const addPlantPhotos = async (plant: any, startY: number) => {
    console.log(`PDF: Adding photos for ${plant.commonName}, has ${plant.seasonalPhotos?.length || 0} photos`);
    
    if (!plant.seasonalPhotos || plant.seasonalPhotos.length === 0) {
      console.log(`PDF: No photos available for ${plant.commonName}`);
      return startY;
    }
    
    const photoSize = 180; // Increased from 120 to 180 for much larger photos
    const photosPerRow = 2; // Keep 2x2 grid like web preview
    const photoSpacing = 30; // Increased spacing for larger photos
    const totalWidth = (photoSize * photosPerRow) + (photoSpacing * (photosPerRow - 1));
    const startX = (width - totalWidth) / 2;
    
    let photoY = startY;
    let photoIndex = 0;
    
    // Filter to only show one photo per season (spring, summer, fall, winter)
    const seasons = ['spring', 'summer', 'fall', 'winter'];
    const uniqueSeasonPhotos = [];
    
    for (const season of seasons) {
      const seasonPhoto = plant.seasonalPhotos.find((p: any) => p.season === season);
      if (seasonPhoto) {
        uniqueSeasonPhotos.push(seasonPhoto);
      }
    }
    
    // Add photos in 2x2 grid (max 4 photos - one per season)
    for (let row = 0; row < Math.ceil(uniqueSeasonPhotos.length / photosPerRow); row++) {
      if (checkNewPage(photoSize + 120)) { // Increased space requirement for larger photos
        photoY = yPosition;
      }
      
      for (let col = 0; col < photosPerRow && photoIndex < uniqueSeasonPhotos.length; col++) {
        const photo = uniqueSeasonPhotos[photoIndex];
        const photoX = startX + (col * (photoSize + photoSpacing));
        
        try {
          console.log(`PDF: Fetching photo for ${plant.commonName} - ${photo.season}: ${photo.url}`);
          
          // Fetch and embed photo with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          const photoResponse = await fetch(photo.url, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Marin-Native-Garden/1.0'
            }
          });
          clearTimeout(timeoutId);
          
          console.log(`PDF: Photo response status: ${photoResponse.status} for ${plant.commonName}`);
          
          if (photoResponse.ok) {
            const photoBytes = await photoResponse.arrayBuffer();
            const contentType = photoResponse.headers.get('content-type') || '';
            console.log(`PDF: Successfully loaded photo bytes (${photoBytes.byteLength} bytes) for ${plant.commonName}`);
            console.log(`PDF: Attempting to embed photo for ${plant.commonName} - ${photo.season} (${contentType})`);
            
            // Determine image format and embed accordingly
            let photoImage;
            const url = photo.url.toLowerCase();
            
            if (contentType.includes('png') || url.includes('.png')) {
              photoImage = await pdfDoc.embedPng(photoBytes);
              console.log(`PDF: Successfully embedded PNG photo for ${plant.commonName} - ${photo.season}`);
            } else if (contentType.includes('jpeg') || contentType.includes('jpg') || url.includes('.jpg') || url.includes('.jpeg')) {
              photoImage = await pdfDoc.embedJpg(photoBytes);
              console.log(`PDF: Successfully embedded JPEG photo for ${plant.commonName} - ${photo.season}`);
            } else {
              // Try JPEG as fallback (most common format)
              try {
                photoImage = await pdfDoc.embedJpg(photoBytes);
                console.log(`PDF: Successfully embedded photo (JPEG fallback) for ${plant.commonName} - ${photo.season}`);
              } catch (jpegError) {
                // Try PNG as last resort
                photoImage = await pdfDoc.embedPng(photoBytes);
                console.log(`PDF: Successfully embedded photo (PNG fallback) for ${plant.commonName} - ${photo.season}`);
              }
            }
            
            // Sophisticated photo frame with subtle shadow
            // Shadow effect
            currentPage.drawRectangle({
              x: photoX + 3,
              y: photoY - photoSize - 3,
              width: photoSize,
              height: photoSize,
              color: colors.shadow,
            });
            
            // Clean frame
            currentPage.drawRectangle({
              x: photoX,
              y: photoY - photoSize,
              width: photoSize,
              height: photoSize,
              borderColor: colors.frame,
              borderWidth: 2,
              color: colors.white,
            });
            
            currentPage.drawImage(photoImage, {
              x: photoX + 2, // Offset for border
              y: photoY - photoSize + 2,
              width: photoSize - 4, // Account for border
              height: photoSize - 4,
            });
            
            // Sophisticated season label
            const seasonText = photo.season.charAt(0).toUpperCase() + photo.season.slice(1);
            const textWidth = boldFont.widthOfTextAtSize(seasonText, 11);
            
            // Clean label background
            currentPage.drawRectangle({
              x: photoX + photoSize/2 - textWidth/2 - 4,
              y: photoY - photoSize - 25,
              width: textWidth + 8,
              height: 16,
              color: colors.sage,
            });
            
            addText(seasonText, 
              photoX + photoSize/2 - textWidth/2, photoY - photoSize - 15, 11, true, colors.white);
          }
          
        } catch (error) {
          console.log(`PDF: Failed to load photo for ${plant.commonName} - ${photo.season}:`, error);
          // Sophisticated placeholder
          currentPage.drawRectangle({
            x: photoX + 2,
            y: photoY - photoSize + 2,
            width: photoSize - 4,
            height: photoSize - 4,
            borderColor: colors.frame,
            borderWidth: 2,
            color: colors.cream,
          });
          
          addText("Photo", photoX + photoSize/2 - 15, photoY - photoSize/2, 12, false, colors.stone);
        }
        
        photoIndex++;
      }
      
      photoY -= photoSize + 80; // Increased spacing between rows for larger photos
    }
    
    return photoY;
  };
  
  // Sophisticated Agency Header Design
  const headerHeight = 120;
  
  // Clean white background with subtle accent line
  currentPage.drawRectangle({
    x: 0,
    y: height - headerHeight,
    width: width,
    height: headerHeight,
    color: colors.white,
  });
  
  // Minimalist accent line - single sophisticated element
  currentPage.drawRectangle({
    x: 0,
    y: height - 3,
    width: width,
    height: 3,
    color: colors.sage,
  });
  
  // Sophisticated typography hierarchy with better spacing
  addText('MARIN NATIVE GARDEN', 60, height - 50, 32, true, colors.charcoal); // Moved down from -45 to -50
  addText('LANDSCAPE DESIGN RECOMMENDATIONS', 60, height - 75, 14, false, colors.slate); // Moved down from -70 to -75
  
  // Minimalist date and project info - right aligned with better spacing
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  addText(`Generated ${currentDate}`, width - 200, height - 50, 11, false, colors.stone); // Moved down from -45 to -50
  
  yPosition = height - headerHeight - 80; // Increased spacing from 60 to 80
  
  // Minimalist Project Details Section
  const infoCardY = yPosition;
  const infoCardHeight = 120; // Increased from 100 to 120 for better spacing
  
  // Clean white background with subtle border
  currentPage.drawRectangle({
    x: 60,
    y: infoCardY - infoCardHeight,
    width: width - 120,
    height: infoCardHeight,
    borderColor: colors.mist,
    borderWidth: 1,
    color: colors.white,
  });
  
  // Sophisticated section header with more padding
  addText('PROJECT OVERVIEW', 80, infoCardY - 30, 16, true, colors.charcoal); // Moved down from -25 to -30
  
  // Clean typography layout with more generous spacing
  const leftCol = 80;
  const rightCol = width / 2 + 20;
  const lineHeight = 20; // Increased from 18 to 20
  
  addText(`Property Address`, leftCol, infoCardY - 55, 10, true, colors.slate); // Moved down from -50 to -55
  addText(address, leftCol, infoCardY - 70, 12, false, colors.stone); // Moved down from -65 to -70
  
  addText(`Plant Community`, rightCol, infoCardY - 55, 10, true, colors.slate); // Moved down from -50 to -55
  addText(region, rightCol, infoCardY - 70, 12, false, colors.stone); // Moved down from -65 to -70
  
  addText(`Water District`, leftCol, infoCardY - 90, 10, true, colors.slate); // Moved down from -85 to -90
  addText(waterDistrict, leftCol, infoCardY - 105, 12, false, colors.stone); // Moved down from -100 to -105
  
  addText(`Sun Exposure`, rightCol, infoCardY - 90, 10, true, colors.slate); // Moved down from -85 to -90
  addText(`${sunExposureData.hours} hours (${sunExposureData.level})`, rightCol, infoCardY - 105, 12, false, colors.stone); // Moved down from -100 to -105
  
  yPosition = infoCardY - infoCardHeight - 100; // Increased spacing from 80 to 100
  
  // Sophisticated Plants Section Header with better spacing
  addText('PLANT RECOMMENDATIONS', 80, yPosition, 24, true, colors.charcoal);
  addText('Curated native species for your landscape', 80, yPosition - 30, 12, false, colors.slate); // Moved down from -25 to -30
  yPosition -= 80; // Increased spacing from 60 to 80
  
  for (let i = 0; i < plants.length; i++) {
    const plant = plants[i];
    
    // Check if we need a new page
    checkNewPage(400); // Increased for larger photos
    
    // Sophisticated Plant Card Design
    const cardY = yPosition;
    const cardHeight = 350; // Increased for spacious design
    
    // Clean white card with subtle border
    currentPage.drawRectangle({
      x: 60,
      y: cardY - cardHeight,
      width: width - 120,
      height: cardHeight,
      borderColor: colors.mist,
      borderWidth: 1,
      color: colors.white,
    });
    
    // Minimalist plant header with accent line
    currentPage.drawRectangle({
      x: 60,
      y: cardY - 40,
      width: width - 120,
      height: 40,
      color: colors.white,
    });
    
    // Sophisticated accent line
    currentPage.drawRectangle({
      x: 60,
      y: cardY - 3,
      width: 60,
      height: 3,
      color: colors.sage,
    });
    
    // Clean typography hierarchy with better spacing
    addText(`${String(i + 1).padStart(2, '0')}`, 80, cardY - 25, 14, true, colors.sage); // Moved down from -20 to -25
    addText(plant.commonName.toUpperCase(), 120, cardY - 25, 18, true, colors.charcoal); // Moved down from -20 to -25
    addText(`(${plant.scientificName})`, 120, cardY - 40, 11, false, colors.slate); // Moved down from -35 to -40
    
    // Plant details with elegant typography and better spacing
    let detailY = cardY - 60; // Moved down from -55 to -60
    const leftColumnX = 60;
    const rightColumnX = width / 2 + 20;
    const lineHeight = 16;
    
    // Size and growth info
    addText(`Mature Size`, leftColumnX, detailY, 8, true, colors.lightText);
    addText(`${plant.matureHeightFt}'H × ${plant.matureWidthFt}'W`, leftColumnX, detailY - 12, 10, false, colors.text);
    
    addText(`Growth Rate`, rightColumnX, detailY, 8, true, colors.lightText);
    addText(plant.growthRate, rightColumnX, detailY - 12, 10, false, colors.text);
    detailY -= 30;
    
    // Wildlife support with assessment
    addText(`Wildlife Support`, leftColumnX, detailY, 8, true, colors.lightText);
    addText(`${plant.wildlifeSupportScore} • ${getWildlifeAssessment(plant.wildlifeSupportScore)}`, leftColumnX, detailY - 12, 10, false, colors.text);
    detailY -= 30;
    
    // Type and lifespan
    addText(`Type`, leftColumnX, detailY, 8, true, colors.lightText);
    addText(plant.evergreenDeciduous, leftColumnX, detailY - 12, 10, false, colors.text);
    
    addText(`Lifespan`, rightColumnX, detailY, 8, true, colors.lightText);
    addText(`${plant.lifespanYears} years`, rightColumnX, detailY - 12, 10, false, colors.text);
    detailY -= 30;
    
    // Bloom information
    addText(`Bloom Season`, leftColumnX, detailY, 8, true, colors.lightText);
    addText(plant.bloomMonths.map((m: number) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]).join(', '), leftColumnX, detailY - 12, 10, false, colors.text);
    
    addText(`Flower Colors`, rightColumnX, detailY, 8, true, colors.lightText);
    addText(plant.flowerColors.join(', '), rightColumnX, detailY - 12, 10, false, colors.text);
    detailY -= 30;
    
    // Indigenous uses
    addText(`Indigenous Uses`, leftColumnX, detailY, 8, true, colors.lightText);
    addText(plant.indigenousUses.join(', '), leftColumnX, detailY - 12, 10, false, colors.text);
    detailY -= 30;
    
    // Birds attracted
    if (plant.birds && plant.birds.length > 0) {
      addText(`Birds Attracted`, rightColumnX, detailY, 8, true, colors.lightText);
      addText(plant.birds.map((b: any) => b.commonName).join(', '), rightColumnX, detailY - 12, 10, false, colors.text);
    }
    
    // Add plant photos
    yPosition = await addPlantPhotos(plant, detailY - 20);
    yPosition -= 80; // Generous spacing between plants for sophisticated layout
  }
  
  // Rebates Section with elegant styling
  if (rebates && rebates.length > 0) {
    checkNewPage(150);
    
    addText('AVAILABLE REBATES & INCENTIVES', 50, yPosition, 20, true, colors.charcoal);
    yPosition -= 30;
    
    rebates.forEach((rebate, index) => {
      checkNewPage(100);
      
      // Elegant rebate card
      const rebateCardY = yPosition;
      const cardHeight = 80;
      
      // Card background with highlight
      currentPage.drawRectangle({
        x: 40,
        y: rebateCardY - cardHeight,
        width: width - 80,
        height: cardHeight,
        borderColor: colors.mist,
        borderWidth: 1,
        color: colors.white,
      });
      
      // Rebate header
      currentPage.drawRectangle({
        x: 40,
        y: rebateCardY - 30,
        width: width - 80,
        height: 30,
        color: colors.sage,
      });
      
      addText(rebate.title.toUpperCase(), 60, rebateCardY - 20, 14, true, colors.white);
      
      // Rebate amount badge
      const amountText = `${rebate.amount}`;
      const amountWidth = boldFont.widthOfTextAtSize(amountText, 12);
      currentPage.drawRectangle({
        x: width - 80 - amountWidth - 20,
        y: rebateCardY - 25,
        width: amountWidth + 16,
        height: 20,
        color: colors.sage,
      });
      addText(amountText, width - 80 - amountWidth - 12, rebateCardY - 18, 12, true, colors.white);
      
      // Rebate details
      addText(rebate.requirements, 60, rebateCardY - 45, 10, false, colors.stone);
      
      if (rebate.link) {
        addText(`Learn more: ${rebate.link}`, 60, rebateCardY - 60, 9, false, colors.slate);
      }
      
      yPosition = rebateCardY - cardHeight - 20;
    });
  }
  
  // Elegant footer
  checkNewPage(60);
  
  // Footer line
  currentPage.drawRectangle({
    x: 0,
    y: yPosition + 20,
    width: width,
    height: 2,
    color: colors.accent,
  });
  
  addText('Marin Native Garden Planner • Personalized Native Plant Recommendations', 50, yPosition - 10, 10, false, colors.lightText);
  addText(`Generated on ${currentDate}`, width - 200, yPosition - 10, 10, false, colors.lightText);
  
  return await pdfDoc.save();
}

export async function POST(request: NextRequest) {
  try {
    const { address, email } = await request.json();
    
    if (!address || !email) {
      return NextResponse.json({ error: 'Address and email are required' }, { status: 400 });
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    console.log(`Processing request for address: ${address}, email: ${email}`);
    
    // Geocode the address to get coordinates and city
    const geocodeResponse = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.MAPBOX_TOKEN}&country=US&region=CA&limit=1`);
    
    if (!geocodeResponse.ok) {
      throw new Error(`Geocoding failed: ${geocodeResponse.status}`);
    }
    
    const geocodeData = await geocodeResponse.json();
    
    if (!geocodeData.features || geocodeData.features.length === 0) {
      throw new Error('Address not found');
    }
    
    const [longitude, latitude] = geocodeData.features[0].center;
    const city = geocodeData.features[0].context?.find((c: any) => c.id.startsWith('place'))?.text || 'Unknown';
    
    console.log(`Geocoded to: ${city} (${latitude}, ${longitude})`);
    
    // Calculate sun exposure for the address
    const sunExposureData = calculateSunExposure(address, latitude, longitude);
    console.log(`Sun exposure: ${sunExposureData.hours} hours (${sunExposureData.level}) - ${sunExposureData.reason}`);
    
    // Determine plant community and water district
    const region = determineRegionHeuristic(city);
    const waterDistrict = determineWaterDistrict(city);
    
    console.log(`Determined region: ${region}, water district: ${waterDistrict}`);
    
    // Get plants for the region, filtered by sun exposure
    const plants = getPlantsForRegion(region, sunExposureData.level);
    console.log(`Found ${plants.length} plants for ${region} with ${sunExposureData.level} sun exposure`);
    
    // Get seasonal photos for plants
    console.log('Fetching seasonal photos...');
    const plantsWithPhotos = await Promise.all(
      plants.map(async (plant) => {
        try {
          const seasonalPhotos = await fetchSeasonalPhotos(plant.scientificName);
          return { ...plant, seasonalPhotos };
        } catch (error) {
          console.log(`Failed to get photos for ${plant.commonName}:`, error);
          return { ...plant, seasonalPhotos: [] };
        }
      })
    );
    
    console.log('Photos fetched successfully');
    
    // Get rebates
    const rebates = getRebates(waterDistrict);
    console.log(`Found ${rebates.length} rebates for ${waterDistrict}`);
    
    // Generate PDF
    console.log('Generating PDF...');
    const pdfBytes = await generatePdf(address, region, waterDistrict, plantsWithPhotos, rebates, sunExposureData);
    console.log('PDF generated successfully');
    
    // Upload PDF to Vercel Blob (optional - continue even if this fails)
    let pdfUrl = '';
    try {
      const formData = new FormData();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      formData.append('file', pdfBlob, `marin-garden-plan-${Date.now()}.pdf`);
      
      const uploadResponse = await fetch(`https://api.vercel.com/v1/blob?filename=marin-garden-plan-${Date.now()}.pdf`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        console.log(`PDF upload failed: ${uploadResponse.status} - continuing without PDF URL`);
      } else {
        const uploadData = await uploadResponse.json();
        pdfUrl = uploadData.url;
        console.log('PDF uploaded to Vercel Blob');
      }
    } catch (uploadError) {
      console.log('PDF upload error:', uploadError.message);
    }
    
    // Send email with PDF attachment (optional - continue even if this fails)
    console.log('Sending email...');
    let emailStatus = 'not attempted';
    let emailError = null;
    
    try {
      const https = require('https');
      const agent = new https.Agent({
        rejectUnauthorized: false
      });
      
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        agent: agent,
        body: JSON.stringify({
          from: 'Marin Native Garden <onboarding@resend.dev>',
          to: [email],
          subject: `Your Marin Native Garden Plan - ${address}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2d5a2d;">Your Marin Native Garden Plan</h2>
              <p>Thank you for using the Marin Native Garden Planner! Your personalized plant recommendations are attached.</p>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d5a2d; margin-top: 0;">Property Details</h3>
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Plant Community:</strong> ${region}</p>
                <p><strong>Water District:</strong> ${waterDistrict}</p>
                <p><strong>Sun Exposure:</strong> ${sunExposureData.hours} hours per day (${sunExposureData.level})</p>
                <p style="color: #666; font-size: 14px; margin-top: 10px;"><em>${sunExposureData.reason}</em></p>
              </div>
              
              <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2d5a2d; margin-top: 0;">Your Recommendations</h3>
                <p>We've selected ${plants.length} native plants perfect for your ${region} community, including:</p>
                <ul>
                  ${plants.slice(0, 5).map(plant => `<li><strong>${plant.commonName}</strong> (${plant.scientificName})</li>`).join('')}
                  ${plants.length > 5 ? `<li>...and ${plants.length - 5} more plants</li>` : ''}
                </ul>
              </div>
              
              <p>Your complete garden plan with seasonal photos, plant details, and available rebates is attached as a PDF.</p>
              
              <p style="color: #666; font-size: 14px;">
                This plan was generated specifically for your Marin County property. 
                All recommended plants are native to your area and will thrive in your local climate.
              </p>
            </div>
          `,
          attachments: [
            {
              filename: `marin-garden-plan-${address.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
              content: Buffer.from(pdfBytes).toString('base64'),
              type: 'application/pdf',
              disposition: 'attachment'
            }
          ]
        }),
      });
      
      if (emailResponse.ok) {
        emailStatus = 'sent';
        console.log('Email sent successfully');
      } else {
        const errorData = await emailResponse.json();
        emailStatus = 'failed';
        emailError = errorData.message || 'Unknown error';
        console.log('Email failed:', errorData);
      }
    } catch (error) {
      emailStatus = 'failed';
      emailError = error.message;
      console.log('Email error:', error);
    }
    
    // Save to database (optional - continue even if this fails)
    try {
      await prisma.submission.create({
        data: {
          address,
          email,
          region,
          waterDistrict,
          plants: JSON.stringify(plantsWithPhotos),
          rebates: JSON.stringify(rebates),
          pdfUrl: pdfUrl,
          emailStatus,
          emailError,
        },
      });
      console.log('Saved to database');
    } catch (dbError) {
      console.log('Database save failed:', dbError);
    }
    
    return NextResponse.json({
      success: true,
      region,
      waterDistrict,
      sunExposure: sunExposureData,
      plants: plantsWithPhotos,
      rebates,
      pdfUrl: pdfUrl,
      emailStatus,
      emailError,
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: error.message || 'An error occurred while generating your garden plan' 
    }, { status: 500 });
  }
}

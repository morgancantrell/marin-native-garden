import { NextRequest } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getCompanionGroupsForPlants } from "@/lib/companion-plants";
import { geocodeAddress, determineRegionHeuristic, determineWaterDistrict } from "@/lib/geocode";
import { getPlantsForRegion } from "@/lib/plants";
import { getRebates } from "@/lib/rebates";
import { fetchSeasonalPhotos } from "@/lib/inaturalist-photos";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const runtime = "nodejs";

// Custom HTTPS request function for email sending
async function makeHttpsRequest(url: string, options: any = {}): Promise<any> {
  const https = require("https");
  const { URL } = require("url");
  
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
      timeout: 10000,
      rejectUnauthorized: false,
    };

    const req = https.request(requestOptions, (res: any) => {
      let data = "";
      res.on("data", (chunk: any) => {
        data += chunk;
      });
      res.on("end", () => {
      res.on("error", (err: any) => {
        console.error("Response error:", err);
        reject(err);
      });
    });
    
    req.on("error", (err: any) => {
      console.error("Request error:", err);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    
    req.end();        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(jsonData),
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: () => Promise.resolve(data),
          });
        }
      });
    });

    req.on("error", (error: any) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Custom HTTPS request function for binary data (images)
async function makeHttpsRequestBinary(url: string): Promise<Buffer> {
  const https = require("https");
  const { URL } = require("url");
  
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "GET",
      headers: {
        'User-Agent': 'Marin-Native-Garden/1.0',
      },
      rejectUnauthorized: false,
      timeout: 10000,
      rejectUnauthorized: false,
    };

    const req = https.request(requestOptions, (res: any) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });
      res.on("end", () => {
      res.on("error", (err: any) => {
        console.error("Response error:", err);
        reject(err);
      });
    });
    
    req.on("error", (err: any) => {
      console.error("Request error:", err);
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    
    req.end();        resolve(Buffer.concat(chunks));
      });
    });

    req.on("error", (error: any) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, email } = body;

    if (!address || !email) {
      return Response.json({ error: "Address and email are required" }, { status: 400 });
    }

    // Geocode the address
    const geocodeResult = await geocodeAddress(address);
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

    // Fetch seasonal photos for each plant
    const enrichedWithPhotos = await Promise.all(
      plants.map(async (plant) => {
        try {
          const seasonalPhotos = await fetchSeasonalPhotos(plant.scientificName);
          return { ...plant, seasonalPhotos };
        } catch (error) {
          console.error(`Failed to fetch photos for ${plant.scientificName}:`, error);
          return { ...plant, seasonalPhotos: [] };
        }
      })
    );

    // Get rebates
    const rebates = getRebates(waterDistrict);

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const textColor = rgb(0.1, 0.1, 0.1);
    const headerColor = rgb(0.2, 0.4, 0.2);

    let currentPage = pdfDoc.addPage([612, 792]);
    let yPosition = 750;

    // Title
    currentPage.drawText("Marin Native Garden Plan", {
      x: 50,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: headerColor,
    });
    yPosition -= 40;

    // Address and region info
    currentPage.drawText(`Address: ${body.address}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: textColor,
    });
    yPosition -= 20;

    currentPage.drawText(`Plant Community: ${region}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: textColor,
    });
    yPosition -= 20;

    currentPage.drawText(`Water District: ${waterDistrict}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: font,
      color: textColor,
    });
    yPosition -= 40;

    // Community summary
    const communitySummary = getCommunitySummary(region);
    currentPage.drawText("Plant Community Summary", {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: headerColor,
    });
    yPosition -= 20;

    const summaryLines = communitySummary.split('. ');
    for (const line of summaryLines) {
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([612, 792]);
        yPosition = 750;
      }
      currentPage.drawText(line + '.', {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: textColor,
      });
      yPosition -= 15;
    }
    yPosition -= 20;

    // Plants section
    currentPage.drawText("Recommended Native Plants", {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: headerColor,
    });
    yPosition -= 30;

    for (const plant of enrichedWithPhotos) {
      if (yPosition < 200) {
        currentPage = pdfDoc.addPage([612, 792]);
        yPosition = 750;
      }

      // Plant name
      currentPage.drawText(`${plant.commonName} (${plant.scientificName})`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: headerColor,
      });
      yPosition -= 20;

      // Plant details
      const details = [
        `Mature Size: ${plant.matureHeightFt}ft H × ${plant.matureWidthFt}ft W`,
        `Growth Rate: ${plant.growthRate}`,
        `Lifespan: ~${plant.lifespanYears} years`,
        `Bloom: ${plant.flowerColors?.join(", ")} (${plant.bloomMonths?.map((m: number) => {
          const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          return monthNames[(m-1)%12];
        }).join("/")})`,
        `Type: ${plant.evergreenDeciduous}`,
        `Indigenous Uses: ${plant.indigenousUses?.join("; ")}`,
        `Butterflies: ${plant.butterflies?.map((b: any) => b.commonName).slice(0,3).join(", ")}`,
        `Birds: ${plant.birds?.map((b: any) => b.commonName).slice(0,3).join(", ")}`,
      ];

      for (const detail of details) {
        if (yPosition < 50) {
          currentPage = pdfDoc.addPage([612, 792]);
          yPosition = 750;
        }
        currentPage.drawText(detail, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: textColor,
        });
        yPosition -= 12;
      }

      // Add seasonal photos if available
      if (plant.seasonalPhotos && plant.seasonalPhotos.length > 0) {
        yPosition -= 10;
        currentPage.drawText("Seasonal Photos:", {
          x: 50,
          y: yPosition,
          size: 10,
          font: boldFont,
          color: textColor,
        });
        yPosition -= 15;

        const photoSize = 60;
        const photosPerRow = 4;
        const photoSpacing = 10;
        const startX = 50;

        for (let i = 0; i < Math.min(4, plant.seasonalPhotos.length); i++) {
          const photo = plant.seasonalPhotos[i];
          const row = Math.floor(i / photosPerRow);
          const col = i % photosPerRow;
          const x = startX + (col * (photoSize + photoSpacing));
          const y = yPosition - (row * (photoSize + 20)) - photoSize;
          
          try {
            const imageBuffer = await makeHttpsRequestBinary(photo.url);
            const image = await pdfDoc.embedPng(imageBuffer);
            currentPage.drawImage(image, {
              x: x,
              y: y,
              width: photoSize,
              height: photoSize,
            });
            
            // Add season label
            currentPage.drawText(photo.season, {
              x: x,
              y: y - 15,
              size: 8,
              font: font,
              color: textColor,
            });
          } catch (error) {
            console.error(`Failed to embed photo for ${plant.commonName}:`, error);
          }
        }
        
        yPosition -= 120; // Space for photo grid
      }

      yPosition -= 20;
    }

    // Rebates section
    if (yPosition < 100) {
      currentPage = pdfDoc.addPage([612, 792]);
      yPosition = 750;
    }

    currentPage.drawText("Water District Rebates", {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: headerColor,
    });
    yPosition -= 30;

    for (const rebate of rebates) {
      if (yPosition < 100) {
        currentPage = pdfDoc.addPage([612, 792]);
        yPosition = 750;
      }

      currentPage.drawText(rebate.title, {
        x: 50,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: headerColor,
      });
      yPosition -= 20;

      currentPage.drawText(rebate.requirements, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: textColor,
      });
      yPosition -= 15;

      currentPage.drawText(`Rebate Amount: ${rebate.amount}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: textColor,
      });
      yPosition -= 15;

      if (rebate.link) {
        currentPage.drawText(`More Info: ${rebate.link}`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: font,
          color: rgb(0, 0, 1),
        });
        yPosition -= 15;
      }

      yPosition -= 20;
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    

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
          subject: `Your Marin Native Garden Plan - ${body.address}`,
          html: `
            <h2>Your Marin Native Garden Plan</h2>
            <p>Thank you for using the Marin Native Garden Planner!</p>
            <p><strong>Address:</strong> ${body.address}</p>
            <p><strong>Plant Community:</strong> ${region}</p>
            <p><strong>Water District:</strong> ${waterDistrict}</p>
            <p>Your personalized garden plan is attached as a PDF. This plan includes:</p>
            <ul>
              <li>15 native plants recommended for your location</li>
              <li>Seasonal photos of each plant</li>
              <li>Detailed plant information and growing requirements</li>
              <li>Water district rebate information</li>
            </ul>
            <p>Happy gardening!</p>
          `,
          attachments: [
            {
              filename: `marin-garden-plan-${Date.now()}.pdf`,
              content: Buffer.from(pdfBytes).toString('base64'),
              type: 'application/pdf',
              disposition: 'attachment'
            }
          ]
        };

        const emailResponse: any = await makeHttpsRequest('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData),
        });

        emailStatus = emailResponse.status;
        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          emailError = errorData.message || `Email failed with status ${emailResponse.status}`;
        }
      } else {
        emailError = "Missing RESEND_API_KEY or MAIL_FROM environment variables";
      }
    } catch (error) {
      console.error("Email sending error:", error);
      emailError = error instanceof Error ? error.message : "Unknown email error";
    }

    // Save to database
    try {
      await prisma.submission.create({
        data: {
          address: body.address,
          email: body.email,
          region: region,
          waterDistrict: waterDistrict,
          plantsJson: JSON.stringify(enrichedWithPhotos),
          
        },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
    }

    return Response.json({
      success: true,
      address: body.address,
      email: body.email,
      region,
      waterDistrict,
      enriched: enrichedWithPhotos,
      plants: enrichedWithPhotos,
      rebates,
      
      emailStatus,
      emailError,
      note: "PDF generated and email sent with attachment"
    });

  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getCommunitySummary(region: string): string {
  const summaries: { [key: string]: string } = {
    "Chaparral": "Chaparral plant communities thrive in the dry, rocky areas of Marin County. These communities feature drought-tolerant shrubs adapted to poor soils and hot summers. Key characteristics include leathery leaves, deep root systems, and plants that can survive with minimal water.",
    "Oak Woodland": "Oak woodland communities are dominated by coast live oaks and feature a diverse understory. These communities provide habitat for many wildlife species and feature plants adapted to partial shade and seasonal moisture.",
    "Grassland": "Grassland communities are found in the open, sunny areas of Marin County. These communities feature native grasses and wildflowers adapted to seasonal rainfall patterns and periodic grazing.",
    "Riparian": "Riparian plant communities grow along streams and waterways. These communities feature moisture-loving species adapted to seasonal flooding and provide important wildlife corridors.",
  };
  
  return summaries[region] || "This region features a diverse mix of native plant communities adapted to local climate and soil conditions.";
}

# Marin Native Garden Planner - Deployment Guide

## 🚀 Quick Deploy to Vercel (Recommended)

### Step 1: Push to GitHub
```bash
git push origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your `marin-native-garden` repository
5. Add Environment Variables:
   - `RESEND_API_KEY` = `re_D8upaxh7_J5JDxDUTdvZVMZyCaSweCAmx`
   - `MAIL_FROM` = `onboarding@resend.dev`
   - `MAPBOX_TOKEN` = `pk.eyJ1IjoibW9yZ2FuY2FuIiwiYSI6ImNtZnBkdm45NDBjbWYybHM4aWRweGw5cWsifQ.Xmd79m__PJyKQ-oee3zDYQ`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = `AIzaSyCqxKx2Y726WWmG-yXq6BJdKq1Fhieg_kU`
   - `DATABASE_URL` = `postgresql://...` (Vercel will provide this)
6. Click "Deploy"

### Step 3: Access Your App
Your app will be available at: `https://marin-native-garden.vercel.app`

## 🌐 ECWID Integration

### Option A: Iframe Embed
Add this to your ECWID site:
```html
<iframe 
  src="https://your-app-name.vercel.app" 
  width="100%" 
  height="800px"
  frameborder="0"
  style="border-radius: 8px;">
</iframe>
```

### Option B: ECWID App
1. Go to ECWID Developer Portal
2. Create new app
3. Use iframe integration
4. Add your Vercel URL

## 🔧 Custom Domain Setup

### After Vercel Deployment:
1. Buy domain (e.g., `marinnativegarden.com`)
2. In Vercel dashboard:
   - Go to your project
   - Settings → Domains
   - Add custom domain
   - Update DNS records as instructed

## 📊 Features Included

✅ **Native Plant Recommendations** - 10 plants per community
✅ **Seasonal Photos** - 5-9 photos per plant from iNaturalist
✅ **Email Delivery** - PDF reports sent automatically
✅ **Mobile-Friendly** - Responsive design
✅ **Plant Communities** - Oak Woodland, Chaparral, Riparian, Grassland
✅ **Water Districts** - Marin Water & North Marin Water District
✅ **Rebate Information** - Available programs and requirements

## 🎯 Usage

1. **User enters address** in Marin County
2. **App determines** plant community and water district
3. **Generates recommendations** with seasonal photos
4. **Sends email** with PDF report
5. **Saves submission** to database

## 📧 Email Configuration

- **From**: `onboarding@resend.dev` (verified domain)
- **To**: Any email address (testing mode)
- **Content**: HTML email with PDF attachment
- **Rate Limit**: 3,000 emails/month (free tier)

## 🔍 Admin Access

Visit: `https://your-app.vercel.app/admin`
- View all submissions
- Download PDFs
- Export data

## 🛠️ Troubleshooting

### Photos Not Loading
- Check iNaturalist API limits
- Verify SSL certificates
- Check timeout settings

### Emails Not Sending
- Verify Resend API key
- Check domain verification
- Confirm email addresses

### Deployment Issues
- Check environment variables
- Verify database connection
- Check build logs in Vercel

## 📱 Mobile Optimization

The app is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🎨 Customization

### Colors & Branding
Edit `app/globals.css` and `app/page.tsx`

### Plant Data
Edit `lib/plants.ts` to add/modify plants

### Email Template
Edit `app/api/plan/route.ts` email HTML

### PDF Design
Modify PDF generation in `app/api/plan/route.ts`

## 🚀 Next Steps

1. **Deploy to Vercel** (5 minutes)
2. **Test with real addresses** 
3. **Share with colleagues**
4. **Embed in ECWID** (if needed)
5. **Add custom domain** (optional)

Your Marin Native Garden Planner is ready to help residents create beautiful, sustainable gardens! 🌱

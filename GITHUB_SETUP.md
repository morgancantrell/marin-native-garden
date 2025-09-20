# GitHub Setup Guide (First Time)

## Step 1: Create GitHub Account & Repository

1. **Go to [github.com](https://github.com)**
2. **Sign up** (if you don't have an account)
3. **Click "+" → "New repository"**
4. **Repository name**: `marin-native-garden`
5. **Description**: `Marin County Native Plant Garden Planner`
6. **Make it Public** ✅
7. **Don't check** "Add a README file" ❌
8. **Click "Create repository"**

## Step 2: Connect Your Local Project

After creating the repo, GitHub shows you commands. Run these in your terminal:

```bash
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/marin-native-garden.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up with GitHub** (same account)
3. **Click "New Project"**
4. **Import** your `marin-native-garden` repository
5. **Add Environment Variables**:
   - `RESEND_API_KEY` = `re_D8upaxh7_J5JDxDUTdvZVMZyCaSweCAmx`
   - `MAIL_FROM` = `onboarding@resend.dev`
   - `MAPBOX_TOKEN` = `pk.eyJ1IjoibW9yZ2FuY2FuIiwiYSI6ImNtZnBkdm45NDBjbWYybHM4aWRweGw5cWsifQ.Xmd79m__PJyKQ-oee3zDYQ`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = `AIzaSyCqxKx2Y726WWmG-yXq6BJdKq1Fhieg_kU`
6. **Click "Deploy"**

## Step 4: Access Your App

Your app will be live at: `https://marin-native-garden.vercel.app`

## What You'll Need

- **GitHub username** (create account if needed)
- **5 minutes** to set up
- **No coding required** - just clicking buttons!

## Troubleshooting

### If git push fails:
- Make sure you're logged into GitHub
- Check your username is correct
- Try: `git config --global user.name "Your Name"`
- Try: `git config --global user.email "your-email@example.com"`

### If Vercel deployment fails:
- Check environment variables are added
- Make sure repository is public
- Check Vercel build logs for errors

## Next Steps After Deployment

1. **Test your app** with a Marin County address
2. **Share the URL** with colleagues
3. **Embed in ECWID** (if needed)
4. **Add custom domain** (optional)

Your Marin Native Garden Planner will be live and helping residents! 🌱

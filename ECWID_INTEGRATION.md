# ECWID Integration Guide

## Method 1: Iframe Embed (Recommended)

### Step 1: Add Custom HTML to ECWID
1. Go to your ECWID admin panel
2. Navigate to **Store Settings** → **Storefront** → **Custom Code**
3. Add this HTML to your store's header or footer:

```html
<!-- Marin Native Garden Planner Widget -->
<div id="marin-garden-planner-widget" style="width: 100%; height: 800px; border: none;">
  <iframe 
    src="https://marin-native-garden.vercel.app" 
    width="100%" 
    height="800px" 
    frameborder="0"
    style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
  </iframe>
</div>
```

### Step 2: Add Navigation Link
1. Go to **Store Settings** → **Navigation**
2. Add a new menu item:
   - **Name**: "Garden Planner" or "Native Plant Planner"
   - **Type**: Custom Page
   - **Content**: Use the iframe code above

### Step 3: Mobile Optimization
Add responsive CSS:

```css
@media (max-width: 768px) {
  #marin-garden-planner-widget {
    height: 600px;
  }
  
  #marin-garden-planner-widget iframe {
    height: 600px;
  }
}
```

## Method 2: Direct Integration (Advanced)

### Step 1: Create ECWID App
1. Go to [ECWID Developer Portal](https://developers.ecwid.com/)
2. Create a new app
3. Use these settings:
   - **App Type**: Storefront Widget
   - **Integration Type**: Custom Page

### Step 2: Configure App
```javascript
// ECWID App Configuration
Ecwid.init({
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  storeId: 'your-store-id'
});

// Add to storefront
Ecwid.ready(function() {
  Ecwid.addCustomPage({
    name: 'Garden Planner',
    url: 'https://marin-native-garden.vercel.app',
    icon: '🌱'
  });
});
```

## Method 3: Product Integration

### Add as Product Service
1. Create a new product in ECWID:
   - **Name**: "Marin Native Garden Planning Service"
   - **Price**: Free or paid consultation
   - **Description**: Include iframe embed

2. Product page content:
```html
<div class="garden-planner-service">
  <h2>Get Your Personalized Native Garden Plan</h2>
  <p>Enter your Marin County address to receive:</p>
  <ul>
    <li>10 native plant recommendations</li>
    <li>Seasonal photos of each plant</li>
    <li>Companion plant groupings</li>
    <li>Available rebate information</li>
    <li>Professional PDF garden plan</li>
  </ul>
  
  <iframe 
    src="https://marin-native-garden.vercel.app" 
    width="100%" 
    height="600px" 
    frameborder="0">
  </iframe>
</div>
```

## Method 4: Popup Widget

### Add Floating Widget
```html
<!-- Floating Garden Planner Button -->
<div id="garden-planner-float" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
  <button onclick="openGardenPlanner()" style="background: #22c55e; color: white; border: none; padding: 15px; border-radius: 50px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
    🌱 Garden Planner
  </button>
</div>

<script>
function openGardenPlanner() {
  window.open('https://marin-native-garden.vercel.app', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
}
</script>
```

## Customization Options

### Styling Integration
```css
/* Match your ECWID theme */
#marin-garden-planner-widget {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
}

#marin-garden-planner-widget iframe {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
```

### Analytics Integration
```javascript
// Track usage in ECWID
function trackGardenPlannerUsage() {
  // ECWID Analytics
  Ecwid.track('garden_planner_opened');
  
  // Google Analytics
  gtag('event', 'garden_planner_interaction', {
    'event_category': 'engagement',
    'event_label': 'marin_native_garden'
  });
}
```

## Testing Checklist

- [ ] Widget loads correctly on desktop
- [ ] Widget loads correctly on mobile
- [ ] Form submission works
- [ ] Email delivery works
- [ ] PDF generation works
- [ ] Responsive design works
- [ ] Matches ECWID theme
- [ ] Analytics tracking works

## Support

If you need help with integration:
1. Check ECWID documentation
2. Test in ECWID preview mode first
3. Use browser developer tools to debug
4. Contact ECWID support for advanced integrations

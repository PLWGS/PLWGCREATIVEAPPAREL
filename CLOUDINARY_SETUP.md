# Cloudinary Setup Guide

## Step 1: Create Cloudinary Account

1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

## Step 2: Get Your Cloudinary Credentials

1. Log into your Cloudinary dashboard
2. Go to the **Dashboard** section
3. Copy your credentials:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

## Step 3: Add Credentials to Environment File

You have two options for adding Cloudinary credentials:

### Option 1: Individual Credentials (Recommended)
Add these lines to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Option 2: Combined URL (Alternative)
Add this single line to your `.env` file:

```env
CLOUDINARY_URL=cloudinary://your-api-key:your-api-secret@your-cloud-name
```

**Replace the values with your actual Cloudinary credentials from the dashboard.**

## Step 4: Test the Integration

1. Start your server: `node server.js`
2. Go to your admin uploads page
3. Create a new product with images
4. Check the console logs for Cloudinary upload messages

## Benefits of Using Cloudinary

✅ **Faster Loading**: Images are served from Cloudinary's global CDN
✅ **Automatic Optimization**: Images are automatically compressed and optimized
✅ **No Server Storage**: Images are stored in the cloud, not on your server
✅ **Automatic Resizing**: Images are automatically resized for different devices
✅ **Better Performance**: Reduces server load and improves page load times

## How It Works

1. **Upload**: When you upload images through the admin form, they're sent to Cloudinary
2. **Storage**: Images are stored in Cloudinary with organized folder structure
3. **URLs**: Cloudinary returns secure URLs that are stored in your database
4. **Display**: Your website displays images using these Cloudinary URLs
5. **Cleanup**: When products are deleted, images are automatically removed from Cloudinary

## Folder Structure in Cloudinary

Images will be organized like this:
```
plwg-creative-apparel/
├── product-name-1/
│   ├── image-1.jpg
│   ├── image-2.jpg
│   └── image-3.jpg
├── product-name-2/
│   ├── image-1.jpg
│   └── image-2.jpg
└── ...
```

## Troubleshooting

### Error: "Cloudinary configuration missing"
- Make sure your `.env` file has all three Cloudinary variables
- Restart your server after adding the credentials

### Error: "Invalid credentials"
- Double-check your API key and secret
- Make sure there are no extra spaces in your `.env` file

### Images not uploading
- Check your internet connection
- Verify your Cloudinary account is active
- Check the server console for detailed error messages

## Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 transformations per month

This should be more than enough for your e-commerce site! 
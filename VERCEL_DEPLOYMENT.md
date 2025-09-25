# Vercel Deployment Guide

## Pre-deployment Checklist

### 1. Environment Variables Setup
Set these environment variables in your Vercel dashboard:

**Required Variables:**
- `DATABASE_URL` - Your production PostgreSQL connection string
- `NEXTAUTH_URL` - `https://pmj-inventory.vercel.app`
- `NEXTAUTH_SECRET` - Generate using: `openssl rand -base64 32`
- `BLOB_READ_WRITE_TOKEN` - Your Vercel Blob storage token

### 2. Database Migration
Before deployment, run migrations on your production database:
```bash
npx prisma migrate deploy
```

### 3. Build Verification
Ensure the build works locally:
```bash
npm run build
```

## Deployment Steps

### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Method 2: GitHub Integration
1. Push your code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

## Common Issues & Solutions

### Issue: 404 NOT_FOUND Error
**Causes:**
1. Missing environment variables
2. Database connection issues
3. Middleware routing problems
4. Missing pages or API routes

**Solutions:**
1. Check all environment variables are set correctly
2. Verify database connection and migrations
3. Test middleware locally
4. Ensure all required files exist

### Issue: Build Failures
- ESLint warnings are now ignored in production builds
- Ensure all TypeScript errors are resolved
- Check for missing dependencies

### Issue: Runtime Errors
- Database connection failures
- NextAuth configuration issues
- API route problems

## Troubleshooting

### Check Deployment Logs
1. Visit Vercel dashboard
2. Go to your project
3. Check "Functions" tab for API route logs
4. Check "Deployments" for build logs

### Test Locally with Production Build
```bash
npm run build
npm run start
```

### Database Connection Test
Create a simple API route to test database connectivity:
```javascript
// /api/test-db/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.user.count();
    return Response.json({ status: 'Database connected' });
  } catch (error) {
    return Response.json({ error: 'Database connection failed' }, { status: 500 });
  }
}
```

## Production Checklist

- [ ] All environment variables set
- [ ] Database migrations completed  
- [ ] Build succeeds locally
- [ ] NextAuth configuration updated for production URL
- [ ] Image domains configured for production
- [ ] Error handling implemented
- [ ] Performance optimizations applied

## Performance Optimizations

The current configuration includes:
- Standalone output for smaller bundle size
- Image optimization for production
- Chunk loading optimization
- React Icons package optimization
- Error boundaries for better UX

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connectivity
4. Check NextAuth configuration
5. Review middleware routing logic
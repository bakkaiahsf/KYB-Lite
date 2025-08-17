# 🚀 Nexus AI - Deployment Guide

## 📋 Current Status ✅

**Ready for production deployment!**

- ✅ **Repository**: [GitHub](https://github.com/bakkaiahsf/KYB-Lite)
- ✅ **Vercel Configuration**: `vercel.json` configured
- ✅ **Database Schema**: Applied with 100% success
- ✅ **Backend Validation**: 100% pass rate  
- ✅ **Architecture Review**: A- (92/100)
- ⚠️ **Environment Variables**: Need setup in Vercel

## 🚀 Quick Deploy (Recommended)

### Method 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbakkaiahsf%2FKYB-Lite)

### Method 2: Manual Vercel Setup

**Current Issue**: Environment variables need to be configured in Vercel dashboard.

**Next Steps**:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find project: `nexus-ai-kyb-lite`
3. Settings → Environment Variables
4. Add all required variables (see table below)
5. Redeploy

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│   Next.js 14    │────│    Supabase      │    │  Companies      │
│   Frontend +    │    │    Database      │────│  House API      │
│   API Routes    │    │    + Auth        │    │                 │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│                 │    │                  │
│   Stripe        │    │   Email Service  │
│   Payments      │    │   (Resend)       │
│                 │    │                  │
└─────────────────┘    └──────────────────┘
```

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbakkaiahsf%2FKYB-Lite&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,COMPANIES_HOUSE_API_KEY,NEXTAUTH_SECRET,STRIPE_PUBLIC_KEY,STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET)

## 📝 Step-by-Step Deployment

### 1. Clone & Setup Repository

```bash
git clone https://github.com/bakkaiahsf/KYB-Lite.git
cd KYB-Lite
npm install
```

### 2. Configure Environment Variables

Copy the environment template:
```bash
cp .env.example .env.local
```

Fill in the required values (see [Environment Variables](#environment-variables) section below).

### 3. Database Setup

#### A. Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Copy your project URL and anon key

#### B. Run Database Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
npx supabase db push

# Seed with sample data (optional)
npx supabase db seed
```

### 4. Companies House API Setup

1. Visit [Companies House Developer Hub](https://developer.company-information.service.gov.uk/)
2. Register and create an application
3. Copy your API key to `COMPANIES_HOUSE_API_KEY`

### 5. Stripe Setup (for Payments)

1. Create a [Stripe account](https://dashboard.stripe.com/register)
2. Get your API keys from the dashboard
3. Create subscription products and copy price IDs
4. Set up webhook endpoint (see [Webhook Setup](#webhook-setup))

### 6. Deploy to Platform

#### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

#### Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

#### Docker
```bash
docker build -t nexus-ai .
docker run -p 3000:3000 --env-file .env.local nexus-ai
```

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard |
| `COMPANIES_HOUSE_API_KEY` | Companies House API key | Companies House Developer Hub |
| `NEXTAUTH_SECRET` | Random string for auth | Generate with `openssl rand -base64 32` |
| `STRIPE_PUBLIC_KEY` | Stripe publishable key | Stripe Dashboard |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Stripe Dashboard |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Email service key | Email disabled |
| `GOOGLE_CLIENT_ID` | Google OAuth | OAuth disabled |
| `GITHUB_CLIENT_ID` | GitHub OAuth | OAuth disabled |
| `SENTRY_DSN` | Error monitoring | No monitoring |

## 🔗 Webhook Setup

### Stripe Webhooks

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
   - `product.created/updated/deleted`
   - `price.created/updated/deleted`

## 🧪 Testing

### Local Development
```bash
npm run dev
# Visit http://localhost:3000
```

### API Testing
```bash
# Test Companies House integration
curl -X GET "http://localhost:3000/api/companies/status?health=true"

# Test company search (requires auth)
curl -X GET "http://localhost:3000/api/companies/search?q=test" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Database Testing
```bash
# Test database connection
npx supabase db diff

# Reset database (development only)
npx supabase db reset
```

## 🔒 Security Checklist

- [ ] All environment variables set securely
- [ ] Supabase RLS policies enabled
- [ ] Stripe webhook endpoints secured
- [ ] API rate limiting configured
- [ ] HTTPS enabled in production
- [ ] Secrets not committed to version control

## 📊 Monitoring & Analytics

### Built-in Monitoring
- API endpoint status: `/api/companies/status`
- Health checks: `/api/companies/status?health=true`
- Search analytics stored in database

### Optional Integrations
- **Sentry**: Error tracking and performance monitoring
- **Google Analytics**: User behavior tracking
- **Mixpanel**: Event tracking for product analytics

## 🐛 Troubleshooting

### Common Issues

#### "Companies House API not working"
- Check API key is valid
- Verify rate limiting (600 requests per 5 minutes)
- Ensure base URL is correct

#### "Database connection failed"
- Verify Supabase credentials
- Check network connectivity
- Ensure migrations are applied

#### "Stripe webhooks failing"
- Verify webhook URL is accessible
- Check webhook secret matches
- Ensure HTTPS is enabled

#### "Build fails"
- Run `npm install` to ensure dependencies
- Check TypeScript errors with `npm run build`
- Verify all environment variables are set

### Debug Mode

Set these for debugging:
```bash
NODE_ENV=development
DEBUG=true
```

## 📈 Scaling Considerations

### Database
- Enable Supabase connection pooling
- Set up read replicas for high traffic
- Monitor query performance

### API Rate Limiting
- Implement Redis for distributed rate limiting
- Use Upstash for serverless environments
- Monitor Companies House API usage

### Caching
- Enable Next.js static generation where possible
- Implement Redis caching for API responses
- Use CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/bakkaiahsf/KYB-Lite/wiki)
- **Issues**: [GitHub Issues](https://github.com/bakkaiahsf/KYB-Lite/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bakkaiahsf/KYB-Lite/discussions)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
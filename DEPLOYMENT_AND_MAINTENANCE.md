# PLWGCREATIVEAPPAREL - Deployment and Maintenance Guide

## Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Railway Deployment](#railway-deployment)
3. [Environment Setup](#environment-setup)
4. [Database Management](#database-management)
5. [Monitoring and Logs](#monitoring-and-logs)
6. [Backup and Recovery](#backup-and-recovery)
7. [Performance Optimization](#performance-optimization)
8. [Security Maintenance](#security-maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Updates and Maintenance](#updates-and-maintenance)

## Deployment Overview

PLWGCREATIVEAPPAREL is designed for deployment on Railway, a modern platform-as-a-service that provides seamless deployment, scaling, and management of Node.js applications.

### Deployment Architecture
- **Frontend**: Static HTML/CSS/JS served by Express
- **Backend**: Node.js/Express API server
- **Database**: PostgreSQL (Railway managed)
- **File Storage**: Cloudinary for images and media
- **Email**: Nodemailer with SMTP provider

## Railway Deployment

### Prerequisites
1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Ensure your code is in a GitHub repository
3. **Railway CLI**: Install Railway CLI for local development

### Initial Setup

#### 1. Install Railway CLI
```bash
npm install -g @railway/cli
```

#### 2. Login to Railway
```bash
railway login
```

#### 3. Link Your Project
```bash
# Navigate to your project directory
cd PLWGCREATIVEAPPAREL

# Link to Railway project
railway link
```

#### 4. Create Railway Project (if not exists)
```bash
railway init
```

### Deployment Configuration

#### 1. Railway Configuration File
The `railway.json` file should contain:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 2. Environment Variables
Set these in Railway dashboard or via CLI:

**Database**
```bash
railway variables set DATABASE_URL=postgresql://username:password@host:port/database
```

**JWT Security**
```bash
railway variables set JWT_SECRET=your_very_long_random_secret_key
railway variables set JWT_EXPIRES_IN=24h
```

**Cloudinary**
```bash
railway variables set CLOUDINARY_CLOUD_NAME=your_cloud_name
railway variables set CLOUDINARY_API_KEY=your_api_key
railway variables set CLOUDINARY_API_SECRET=your_api_secret
```

**Email Configuration**
```bash
railway variables set EMAIL_HOST=smtp.gmail.com
railway variables set EMAIL_PORT=587
railway variables set EMAIL_USER=your_email@gmail.com
railway variables set EMAIL_PASS=your_app_password
```

**Server Settings**
```bash
railway variables set PORT=3000
railway variables set NODE_ENV=production
```

### Deployment Commands

#### 1. Deploy to Production
```bash
railway up
```

#### 2. Deploy to Preview
```bash
railway up --service preview
```

#### 3. View Deployment Status
```bash
railway status
```

#### 4. View Logs
```bash
railway logs
```

#### 5. Open in Browser
```bash
railway open
```

### Continuous Deployment

#### 1. GitHub Integration
1. Connect your GitHub repository in Railway dashboard
2. Enable automatic deployments on push to main branch
3. Configure preview deployments for pull requests

#### 2. Branch Strategy
- **main**: Production deployment
- **develop**: Staging deployment
- **feature/***: Preview deployments

## Environment Setup

### Local Development
```bash
# Copy environment template
cp complete_env_variables.txt .env

# Edit .env with local values
nano .env

# Install dependencies
npm install

# Start development server
npm start
```

### Production Environment
```bash
# Set production environment variables
railway variables set NODE_ENV=production

# Set production database
railway variables set DATABASE_URL=production_database_url

# Set production secrets
railway variables set JWT_SECRET=production_jwt_secret
```

### Environment Validation
The application validates environment variables on startup:
```javascript
// Check required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
});
```

## Database Management

### Database Setup

#### 1. Railway PostgreSQL
1. Create PostgreSQL service in Railway
2. Copy connection string to DATABASE_URL
3. The application creates tables automatically

#### 2. Local PostgreSQL
```bash
# Install PostgreSQL
# Create database
createdb plwgcreativeapparel

# Set DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@localhost:5432/plwgcreativeapparel
```

### Database Migrations
The application handles schema creation automatically:
```javascript
// Create tables if they don't exist
const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        birthday DATE,
        addresses JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // ... other tables
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};
```

### Database Maintenance

#### 1. Connection Pooling
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### 2. Health Checks
```javascript
app.get('/api/health', async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});
```

## Monitoring and Logs

### Application Logging

#### 1. Console Logging
```javascript
// Development logging
if (process.env.NODE_ENV === 'development') {
  console.log('Database query:', query);
  console.log('Request body:', req.body);
}
```

#### 2. Error Logging
```javascript
// Global error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  res.status(500).json({ error: 'Internal server error' });
});
```

#### 3. Request Logging
```javascript
// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

### Railway Monitoring

#### 1. Dashboard Metrics
- CPU usage
- Memory usage
- Network I/O
- Response times

#### 2. Log Access
```bash
# View real-time logs
railway logs --follow

# View specific service logs
railway logs --service web

# Filter logs by time
railway logs --since 1h
```

#### 3. Performance Monitoring
```bash
# View service metrics
railway status

# Check deployment health
railway health
```

## Backup and Recovery

### Database Backups

#### 1. Automated Backups
Railway provides automatic PostgreSQL backups:
- Daily backups retained for 7 days
- Weekly backups retained for 4 weeks
- Monthly backups retained for 12 months

#### 2. Manual Backups
```bash
# Export database
railway run pg_dump $DATABASE_URL > backup.sql

# Import database
railway run psql $DATABASE_URL < backup.sql
```

### File Backups

#### 1. Cloudinary Backup
- Images are automatically backed up by Cloudinary
- Access via Cloudinary dashboard
- Download original files if needed

#### 2. Code Backup
- GitHub repository serves as code backup
- Tag releases for version control
- Archive important configurations

### Recovery Procedures

#### 1. Database Recovery
```bash
# Restore from backup
railway run psql $DATABASE_URL < backup.sql

# Verify restoration
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM customers;"
```

#### 2. Application Recovery
```bash
# Redeploy application
railway up

# Check health
railway health

# Verify endpoints
curl https://your-app.railway.app/api/health
```

## Performance Optimization

### Application Optimization

#### 1. Database Optimization
```javascript
// Connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});

// Query optimization
const getProducts = async () => {
  const query = `
    SELECT p.*, 
           COUNT(oi.id) as order_count
    FROM products p
    LEFT JOIN order_items oi ON p.id = oi.product_id
    GROUP BY p.id
    ORDER BY order_count DESC
  `;
  return pool.query(query);
};
```

#### 2. Caching Strategy
```javascript
// In-memory caching for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = async (key, fetchFunction) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchFunction();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

### Railway Optimization

#### 1. Resource Allocation
- Monitor CPU and memory usage
- Scale resources based on demand
- Use Railway's auto-scaling features

#### 2. CDN Integration
- Enable Railway's CDN for static assets
- Optimize image delivery via Cloudinary
- Implement lazy loading for images

## Security Maintenance

### Security Updates

#### 1. Dependency Updates
```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update

# Update to latest versions (use with caution)
npm update --latest
```

#### 2. Security Monitoring
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

#### 3. Input Validation
```javascript
// Comprehensive validation using express-validator
const { body, validationResult } = require('express-validator');

const validateProduct = [
  body('name').trim().isLength({ min: 1, max: 255 }),
  body('price').isFloat({ min: 0 }),
  body('description').optional().trim().isLength({ max: 1000 })
];
```

### Security Best Practices

#### 1. Environment Variables
- Never commit secrets to version control
- Use Railway's secure variable storage
- Rotate secrets regularly

#### 2. API Security
- Implement proper authentication
- Use HTTPS in production
- Validate all inputs
- Implement rate limiting

#### 3. Database Security
- Use connection pooling
- Implement prepared statements
- Regular security audits
- Monitor access patterns

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check logs
railway logs

# Verify environment variables
railway variables

# Check port availability
railway status
```

#### 2. Database Connection Issues
```bash
# Test database connection
railway run psql $DATABASE_URL -c "SELECT 1;"

# Check database status
railway status --service postgresql
```

#### 3. Image Upload Failures
```bash
# Verify Cloudinary credentials
railway variables

# Check file size limits
# Verify supported formats
```

### Debug Procedures

#### 1. Local Debugging
```bash
# Start with debug logging
DEBUG=* node server.js

# Use development environment
NODE_ENV=development node server.js
```

#### 2. Production Debugging
```bash
# Access production logs
railway logs --follow

# Check environment variables
railway variables

# Verify deployment status
railway status
```

#### 3. Database Debugging
```bash
# Connect to production database
railway run psql $DATABASE_URL

# Check table structure
\d customers

# Verify data integrity
SELECT COUNT(*) FROM customers;
```

## Updates and Maintenance

### Regular Maintenance Schedule

#### 1. Weekly Tasks
- Review application logs
- Check database performance
- Monitor error rates
- Verify backup completion

#### 2. Monthly Tasks
- Update dependencies
- Review security audit
- Performance analysis
- Cost optimization review

#### 3. Quarterly Tasks
- Security assessment
- Performance optimization
- Feature updates
- Documentation review

### Update Procedures

#### 1. Code Updates
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run tests
npm test

# Deploy to production
railway up
```

#### 2. Database Updates
```bash
# Create migration script
# Test in development
# Apply to production
# Verify data integrity
```

#### 3. Configuration Updates
```bash
# Update environment variables
railway variables set NEW_VAR=value

# Redeploy application
railway up
```

### Rollback Procedures

#### 1. Application Rollback
```bash
# Revert to previous deployment
railway rollback

# Verify rollback
railway status
```

#### 2. Database Rollback
```bash
# Restore from backup
railway run psql $DATABASE_URL < backup.sql

# Verify restoration
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM customers;"
```

---

## Emergency Contacts

### Railway Support
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord**: [railway.app/discord](https://railway.app/discord)
- **Email**: support@railway.app

### Application Support
- **Health Check**: `/api/health`
- **Status Page**: Railway dashboard
- **Logs**: `railway logs`

---

*Last Updated: December 2024*
*Version: 1.0*

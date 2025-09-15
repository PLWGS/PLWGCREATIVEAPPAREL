# PLWGCREATIVEAPPAREL - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Setup and Installation](#setup-and-installation)
5. [Environment Configuration](#environment-configuration)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Frontend Architecture](#frontend-architecture)
9. [Security Features](#security-features)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Maintenance and Troubleshooting](#maintenance-and-troubleshooting)
13. [Development Workflow](#development-workflow)

## Project Overview

PLWGCREATIVEAPPAREL is a comprehensive e-commerce platform built with Node.js, Express, and PostgreSQL. The platform provides a complete solution for creative apparel sales, including customer management, order processing, product management, and administrative tools.

### Key Features
- **Customer Dashboard**: Complete customer account management with profile, orders, wishlist, and loyalty system
- **Product Management**: Comprehensive product catalog with image management via Cloudinary
- **Order Processing**: Full order lifecycle management from cart to fulfillment
- **Admin Panel**: Secure administrative interface for managing products, orders, and customers
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Security**: JWT authentication, input validation, and secure API endpoints

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt
- **Validation**: express-validator
- **File Upload**: Cloudinary
- **Email**: Nodemailer

### Frontend
- **Styling**: Tailwind CSS
- **JavaScript**: Vanilla JS with ES6+ features
- **Responsive**: Mobile-first design approach
- **UI Components**: Custom enhancement system

### Infrastructure
- **Hosting**: Railway
- **Version Control**: Git/GitHub
- **Environment**: Single .env file configuration

## Project Structure

```
PLWGCREATIVEAPPAREL/
├── server.js                          # Main Express application
├── package.json                       # Dependencies and scripts
├── .env                              # Environment configuration
├── railway.json                      # Railway deployment config
├── tailwind.config.js               # Tailwind CSS configuration
├── pages/                           # HTML pages
│   ├── index.html                   # Landing page (homepage)
│   ├── shop.html                    # Product catalog
│   ├── cart.html                    # Shopping cart
│   ├── account.html                 # Customer dashboard
│   ├── admin.html                   # Admin panel
│   └── ...                         # Other pages
├── public/                          # Static assets
│   ├── frontend-enhancements.js     # UI enhancement system
│   ├── mobile-menu-injector.js      # Mobile navigation
│   └── ...                         # Other assets
├── css/                             # Stylesheets
│   └── tailwind.css                # Tailwind CSS
├── db/                              # Database files
├── tools/                           # Utility scripts
├── etsy_images/                     # Product images
└── videos/                          # Video assets
```

## Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PLWGCREATIVEAPPAREL
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp complete_env_variables.txt .env
   # Edit .env with your actual values
   ```

4. **Set up database**
   ```bash
   # Ensure PostgreSQL is running
   # The application will create tables automatically on first run
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   node server.js
   ```

## Environment Configuration

The project uses a single `.env` file for all configuration. Key variables include:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server
PORT=3000
NODE_ENV=development
```

## Database Schema

### Core Tables

#### customers
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR UNIQUE)
- `password_hash` (VARCHAR)
- `first_name` (VARCHAR)
- `last_name` (VARCHAR)
- `phone` (VARCHAR)
- `birthday` (DATE)
- `addresses` (JSONB)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### products
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR)
- `description` (TEXT)
- `price` (DECIMAL)
- `images` (TEXT[])
- `sizes` (JSONB)
- `tags` (TEXT[])
- `featured` (BOOLEAN)
- `created_at` (TIMESTAMP)

#### orders
- `id` (SERIAL PRIMARY KEY)
- `customer_id` (INTEGER REFERENCES customers)
- `status` (VARCHAR)
- `total_amount` (DECIMAL)
- `shipping_address` (JSONB)
- `created_at` (TIMESTAMP)

#### order_items
- `id` (SERIAL PRIMARY KEY)
- `order_id` (INTEGER REFERENCES orders)
- `product_id` (INTEGER REFERENCES products)
- `quantity` (INTEGER)
- `size` (VARCHAR)
- `price` (DECIMAL)

#### wishlist
- `id` (SERIAL PRIMARY KEY)
- `customer_id` (INTEGER REFERENCES customers)
- `product_id` (INTEGER REFERENCES products)
- `created_at` (TIMESTAMP)

## API Documentation

### Authentication Endpoints

#### POST /api/customer/auth
Customer registration and login
```json
{
  "email": "customer@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### POST /api/admin/login
Admin login
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### Customer Endpoints

#### GET /api/customer/profile
Retrieve customer profile information

#### PUT /api/customer/profile
Update customer profile
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "birthday": "1990-01-01",
  "addresses": [...]
}
```

#### GET /api/customer/orders
Retrieve customer orders

#### GET /api/customer/wishlist
Retrieve customer wishlist

#### POST /api/customer/wishlist
Add item to wishlist
```json
{
  "product_id": 123
}
```

#### DELETE /api/customer/wishlist/:product_id
Remove item from wishlist

#### GET /api/customer/loyalty
Retrieve loyalty information

#### POST /api/customer/loyalty/redeem
Redeem loyalty reward
```json
{
  "reward_id": "reward_123"
}
```

#### PUT /api/customer/style-profile
Update style preferences
```json
{
  "horror_preference": 7,
  "pop_preference": 5,
  "humor_preference": 8,
  "favorite_colors": ["red", "blue"],
  "preferred_sizes": ["M", "L"]
}
```

### Product Endpoints

#### GET /api/products
Retrieve product catalog

#### POST /api/products
Create new product (admin only)

#### PUT /api/products/:id
Update product (admin only)

#### DELETE /api/products/:id
Delete product (admin only)

### Cart Endpoints

#### GET /api/cart
Retrieve cart contents

#### POST /api/cart/add
Add item to cart
```json
{
  "product_id": 123,
  "quantity": 1,
  "size": "M"
}
```

#### PUT /api/cart/update/:id
Update cart item quantity

#### DELETE /api/cart/:id
Remove item from cart

#### POST /api/cart/checkout
Process checkout
```json
{
  "shipping_address": {...},
  "payment_method": "card"
}
```

### Public Endpoints

#### POST /api/custom-requests
Submit custom order request
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "description": "Custom design request",
  "budget": 100
}
```

#### POST /api/subscribe
Subscribe to newsletter
```json
{
  "email": "customer@example.com"
}
```

## Frontend Architecture

### Enhancement System

The project includes a comprehensive frontend enhancement system (`public/frontend-enhancements.js`) that provides:

- **Toast Notifications**: User feedback system
- **Loading States**: Skeleton screens and loading indicators
- **Form Validation**: Real-time input validation
- **Error Handling**: Global error management
- **Responsive Design**: Mobile menu and touch gestures
- **API Integration**: Enhanced response handling

### Page Structure

Each page follows a consistent structure:
1. **Header**: Navigation and branding
2. **Main Content**: Page-specific functionality
3. **Footer**: Links and information
4. **Scripts**: Page-specific JavaScript and enhancements

### Responsive Design

- Mobile-first approach
- Touch-friendly interactions
- Responsive tables and grids
- Adaptive navigation

## Security Features

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Session management

### Input Validation
- Comprehensive validation using express-validator
- SQL injection prevention
- XSS protection
- CSRF protection

### API Security
- Rate limiting
- Request size limits
- Secure headers
- CORS configuration

## Testing

### Test Files
- `test_validation_comprehensive.js` - API validation tests
- `test_frontend_enhancements.js` - Frontend functionality tests
- `test_email.js` - Email system tests
- `test_custom_orders.js` - Custom orders API tests

### Running Tests
```bash
# Run validation tests
node test_validation_comprehensive.js

# Run frontend tests
node test_frontend_enhancements.js

# Run email tests
node test_email.js
```

## Deployment

### Railway Deployment

1. **Connect to Railway**
   ```bash
   railway login
   railway link
   ```

2. **Set environment variables**
   ```bash
   railway variables set DATABASE_URL=your_database_url
   railway variables set JWT_SECRET=your_jwt_secret
   # ... other variables
   ```

3. **Deploy**
   ```bash
   railway up
   ```

### Environment Variables for Production
Ensure all required environment variables are set in Railway dashboard:
- Database connection
- JWT secrets
- Cloudinary credentials
- Email configuration
- Server settings

## Maintenance and Troubleshooting

### Common Issues

#### Server Won't Start
1. Check if port 3000 is available
2. Verify environment variables are set
3. Check database connectivity
4. Review server logs

#### Database Connection Issues
1. Verify DATABASE_URL format
2. Check database server status
3. Ensure database exists
4. Verify user permissions

#### Image Upload Failures
1. Check Cloudinary credentials
2. Verify file size limits
3. Check supported file formats
4. Review Cloudinary dashboard

### Logs and Monitoring

- Server logs are written to console
- Database queries are logged in development
- Error tracking via try-catch blocks
- Health check endpoint: `/api/health`

### Performance Optimization

- Database connection pooling
- Image optimization via Cloudinary
- Static asset caching
- Lazy loading for images

## Development Workflow

### Git Workflow
1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Create pull request
5. Review and merge

### Code Standards
- Consistent naming conventions
- Error handling for all async operations
- Input validation on all endpoints
- Comprehensive documentation

### Testing Strategy
- Unit tests for critical functions
- Integration tests for API endpoints
- Frontend functionality tests
- Manual testing for user flows

---

## Version History

### Phase 1 (Completed)
- Comprehensive input validation implementation
- express-validator integration
- Security hardening
- API endpoint protection

### Phase 2 (Completed)
- Frontend enhancement system
- UI/UX improvements
- Loading states and error handling
- Responsive design enhancements

### Phase 3 (Current)
- Documentation and cleanup
- Project organization
- Maintenance guides
- Deployment optimization

---

*Last Updated: December 2024*
*Version: 3.0*

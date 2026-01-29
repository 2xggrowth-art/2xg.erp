<div align="center">

# 🚀 2XG ERP Dashboard

### Enterprise Resource Planning & Business Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb)](https://reactjs.org/)

**A modern, full-stack business dashboard built with React, Express, TypeScript, and Supabase**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API Reference](#-api-reference) • [Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Customization](#-customization)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

The **2XG ERP Dashboard** is a comprehensive business intelligence platform designed to streamline operations across multiple departments. Built with modern web technologies, it provides real-time insights into sales, logistics, customer service, and customer relationships.

### Why 2XG ERP?

- **🎨 Modern UI/UX**: Clean, intuitive interface inspired by Zoho Inventory
- **📊 Real-time Analytics**: Live data visualization with interactive charts
- **📱 Fully Responsive**: Seamless experience across desktop, tablet, and mobile
- **🔒 Type-Safe**: Built entirely with TypeScript for maximum reliability
- **⚡ Lightning Fast**: Powered by Vite and optimized React components
- **🌐 Cloud-Ready**: Designed for easy deployment to modern cloud platforms

---

## ✨ Features

### 📈 ERP Module
- **Sales Tracking**: Monitor total sales, trends, and performance metrics
- **Inventory Management**: Track hot-selling items and low-stock alerts
- **Financial Oversight**: Real-time overdue amount monitoring
- **Category Analytics**: Sales breakdown by product categories

### 🚚 2XG Logistics
- **Shipment Tracking**: Monitor shipments with status breakdowns (Pending, In Transit, Delivered)
- **Delivery Analytics**: Track delivery performance and completion rates
- **Real-time Updates**: Live status updates for all shipments

### 🎧 2XG CARE (Customer Service)
- **Ticket Management**: Track support tickets with category-wise analytics
- **Status Monitoring**: Open, In Progress, and Resolved ticket counts
- **Category Breakdown**: Technical, Billing, General Inquiry classifications
- **Performance Metrics**: Track resolution times and customer satisfaction

### 💼 Sales Pipeline (CRM)
- **Lead Management**: Track leads from New to Converted status
- **Customer Database**: Comprehensive customer information and history
- **Conversion Analytics**: Monitor lead-to-customer conversion rates
- **Revenue Tracking**: Track potential and actual revenue from leads

### 🎛️ Global Features
- **Dynamic Date Filtering**: All modules update simultaneously based on selected date range
- **Preset Time Ranges**: Today, This Week, This Month, Last 30 Days, Last 6 Months
- **Loading States**: Elegant skeleton loaders for smooth user experience
- **Error Handling**: Comprehensive error handling with user-friendly messages

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express** | Web application framework |
| **TypeScript** | Type-safe JavaScript |
| **Supabase** | PostgreSQL database & authentication |
| **CORS** | Cross-origin resource sharing |
| **Helmet** | Security middleware |
| **Morgan** | HTTP request logger |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first CSS framework |
| **Recharts** | Data visualization library |
| **Lucide React** | Beautiful icon library |
| **Axios** | HTTP client |

### Development Tools
- **ts-node**: TypeScript execution for Node.js
- **nodemon**: Auto-restart development server
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

---

## 📁 Project Structure

```
2xg-erp/
├── 2xg-dashboard/
│   ├── backend/                    # Express API Server
│   │   ├── src/
│   │   │   ├── config/            # Configuration files
│   │   │   │   └── supabase.ts    # Supabase client setup
│   │   │   ├── controllers/       # Route controllers
│   │   │   │   ├── erp.controller.ts
│   │   │   │   ├── logistics.controller.ts
│   │   │   │   ├── care.controller.ts
│   │   │   │   └── crm.controller.ts
│   │   │   ├── routes/            # API routes
│   │   │   │   ├── erp.routes.ts
│   │   │   │   ├── logistics.routes.ts
│   │   │   │   ├── care.routes.ts
│   │   │   │   └── crm.routes.ts
│   │   │   ├── services/          # Business logic layer
│   │   │   │   ├── erp.service.ts
│   │   │   │   ├── logistics.service.ts
│   │   │   │   ├── care.service.ts
│   │   │   │   └── crm.service.ts
│   │   │   ├── types/             # TypeScript type definitions
│   │   │   │   └── index.ts
│   │   │   ├── utils/             # Utility functions & scripts
│   │   │   │   ├── database-schema.sql
│   │   │   │   └── seedData.ts
│   │   │   └── server.ts          # Express app entry point
│   │   ├── .env.example           # Environment variables template
│   │   ├── .gitignore
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend/                   # React Application
│       ├── src/
│       │   ├── components/        # React components
│       │   │   ├── layout/       # Layout components
│       │   │   │   ├── DashboardLayout.tsx
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── Header.tsx
│       │   │   │   └── MainContent.tsx
│       │   │   ├── dashboard/    # Dashboard widgets
│       │   │   │   └── MetricCard.tsx
│       │   │   ├── common/       # Shared components
│       │   │   │   └── DateRangeFilter.tsx
│       │   │   └── modules/      # Feature modules
│       │   │       ├── ERPModule.tsx
│       │   │       ├── LogisticsModule.tsx
│       │   │       ├── CAREModule.tsx
│       │   │       └── CRMModule.tsx
│       │   ├── contexts/         # React Context providers
│       │   │   └── DateFilterContext.tsx
│       │   ├── services/         # API service layer
│       │   │   ├── api.client.ts
│       │   │   ├── erp.service.ts
│       │   │   ├── logistics.service.ts
│       │   │   ├── care.service.ts
│       │   │   └── crm.service.ts
│       │   ├── types/            # TypeScript type definitions
│       │   │   └── index.ts
│       │   ├── App.tsx           # Main App component
│       │   ├── main.tsx          # React entry point
│       │   └── index.css         # Global styles
│       ├── public/               # Static assets
│       ├── .env.example          # Environment variables template
│       ├── index.html            # HTML template
│       ├── package.json
│       ├── tailwind.config.js    # Tailwind configuration
│       ├── vite.config.ts        # Vite configuration
│       └── tsconfig.json
│
├── README.md                      # This file
├── QUICKSTART.md                  # Quick setup guide
└── IMPLEMENTATION_COMPLETE.md     # Implementation details
```

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** (free tier available at [supabase.com](https://supabase.com))

### 🎯 New to Supabase? Start Here!

**For a step-by-step guide to connect your project to Supabase in under 10 minutes:**
📖 **[Read the Quick Start Guide →](./QUICK_START.md)**

Or for comprehensive documentation:
📚 **[Read the Full Supabase Setup Guide →](./SUPABASE_SETUP_GUIDE.md)**

### Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/arsalan507/2xgERP.git
cd 2xgERP/2xg-dashboard
```

#### 2️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Edit `.env` file with your Supabase credentials:**

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Get these from your Supabase project settings
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 3️⃣ Database Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Fill in project details

2. **Run Database Schema**
   - Open your Supabase project dashboard
   - Navigate to **SQL Editor**
   - Copy contents from `backend/src/utils/database-schema.sql`
   - Paste and execute the SQL

3. **Seed the Database**
   ```bash
   npm run seed
   ```
   This populates your database with 6 months of realistic mock data.

#### 4️⃣ Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**The default `.env` should work out of the box:**

```env
VITE_API_URL=http://localhost:5000/api
```

#### 5️⃣ Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend runs on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend runs on `http://localhost:3000`

**Open your browser and navigate to:** `http://localhost:3000`

---

## 📚 Documentation

### Environment Variables

#### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbG...` |

#### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |

### Database Schema

The application uses the following main tables:

- **organizations**: Company information
- **product_categories**: Product categorization
- **sales_transactions**: Sales records
- **inventory_items**: Product inventory
- **shipments**: Logistics shipment tracking
- **deliveries**: Delivery status tracking
- **service_tickets**: Customer support tickets
- **leads**: CRM lead tracking
- **customers**: Customer information

See `backend/src/utils/database-schema.sql` for complete schema.

---

## 🔌 API Reference

### Base URL
```
http://localhost:5000/api
```

### ERP Endpoints

#### Get Total Sales
```http
GET /api/erp/sales/total?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Response:**
```json
{
  "totalSales": 1234567.89,
  "transactionCount": 450,
  "currency": "INR"
}
```

#### Get Sales by Category
```http
GET /api/erp/sales/by-category?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Response:**
```json
[
  {
    "name": "Electronics",
    "total": 450000.00,
    "count": 125
  },
  ...
]
```

#### Get Overdue Amount
```http
GET /api/erp/sales/overdue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

#### Get Hot Selling Items
```http
GET /api/erp/inventory/hot-selling
```

#### Get Low Stock Items
```http
GET /api/erp/inventory/low-stock
```

### Logistics Endpoints

#### Get Shipments Summary
```http
GET /api/logistics/shipments/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

#### Get Deliveries Summary
```http
GET /api/logistics/deliveries/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### CARE Endpoints

#### Get Total Tickets
```http
GET /api/care/tickets/total?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

#### Get Tickets by Category
```http
GET /api/care/tickets/by-category?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### CRM Endpoints

#### Get Lead Reporting
```http
GET /api/crm/leads/reporting?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

#### Get Customer List
```http
GET /api/crm/customers/list?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

---

## 🌐 Deployment

### Recommended Deployment Setup

#### Frontend - Vercel

1. **Push to GitHub** (already done!)
2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Set root directory to `2xg-dashboard/frontend`
   - Add environment variable: `VITE_API_URL=your-backend-url/api`
   - Deploy!

#### Backend - Railway

1. **Create Railway Account** at [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. **Configure:**
   - Root directory: `2xg-dashboard/backend`
   - Build command: `npm run build`
   - Start command: `npm start`
4. **Add Environment Variables:**
   - `NODE_ENV=production`
   - `PORT=5000`
   - `FRONTEND_URL=your-vercel-url`
   - `SUPABASE_URL=your-supabase-url`
   - `SUPABASE_SERVICE_ROLE_KEY=your-key`

#### Alternative Deployment Options

| Platform | Best For | Free Tier |
|----------|----------|-----------|
| **Vercel** | Frontend | ✅ Yes |
| **Netlify** | Frontend | ✅ Yes |
| **Railway** | Backend | ✅ Limited |
| **Render** | Backend | ✅ Limited |
| **Heroku** | Full Stack | ✅ Limited |

### Building for Production

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview
```

---

## 🎨 Customization

### Changing Colors

Edit `frontend/tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'sidebar-dark': '#1e293b',  // Change sidebar color
        'primary': '#3b82f6',        // Primary brand color
        'secondary': '#8b5cf6',      // Secondary brand color
      }
    }
  }
}
```

### Adding New Modules

1. **Backend:**
   - Create service: `backend/src/services/your-module.service.ts`
   - Create controller: `backend/src/controllers/your-module.controller.ts`
   - Create routes: `backend/src/routes/your-module.routes.ts`
   - Register routes in `backend/src/server.ts`

2. **Frontend:**
   - Create component: `frontend/src/components/modules/YourModule.tsx`
   - Create service: `frontend/src/services/your-module.service.ts`
   - Import in `frontend/src/App.tsx`

### Customizing the Logo

Replace the logo in `frontend/public/` and update the import in `Sidebar.tsx`.

---

## 🔧 Troubleshooting

### Common Issues

#### CORS Errors
**Problem:** Frontend can't connect to backend
**Solution:** Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL exactly

#### Database Connection Failed
**Problem:** Cannot connect to Supabase
**Solution:**
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check Supabase project is active
- Ensure you're using the **service role key**, not the anon key

#### Port Already in Use
**Problem:** `Error: listen EADDRINUSE: address already in use :::5000`
**Solution:**
- Change `PORT` in backend `.env`
- Or kill the process: `npx kill-port 5000`

#### TypeScript Errors
**Problem:** Type errors during build
**Solution:**
- Run `npm install` again
- Delete `node_modules` and reinstall
- Check TypeScript version compatibility

#### Seed Data Not Loading
**Problem:** `npm run seed` fails
**Solution:**
- Ensure database schema is created first
- Check Supabase connection
- Verify environment variables

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/arsalan507/2xgERP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/arsalan507/2xgERP/discussions)
- **Email**: arsalanahmed507@gmail.com

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure TypeScript types are properly defined

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Supabase** for the excellent backend-as-a-service platform
- **Tailwind CSS** for the utility-first CSS framework
- **Recharts** for beautiful data visualizations
- **Lucide** for the icon library

---

## 📊 Project Stats

- **Lines of Code**: ~8,700+
- **Files**: 58
- **Modules**: 4 (ERP, Logistics, CARE, CRM)
- **API Endpoints**: 10+
- **Database Tables**: 9

---

## 🗺️ Roadmap

- [ ] User authentication and authorization
- [ ] Role-based access control (RBAC)
- [ ] Advanced reporting and exports (PDF, Excel)
- [ ] Email notifications for critical events
- [ ] Mobile app (React Native)
- [ ] Real-time updates with WebSockets
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)
- [ ] Dark mode theme
- [ ] API rate limiting and caching

---

<div align="center">

### Built with ❤️ for 2XG Business Suite

**[⬆ Back to Top](#-2xg-erp-dashboard)**

---

**If you find this project helpful, please consider giving it a ⭐ on GitHub!**

[![GitHub stars](https://img.shields.io/github/stars/arsalan507/2xgERP?style=social)](https://github.com/arsalan507/2xgERP)
[![GitHub forks](https://img.shields.io/github/forks/arsalan507/2xgERP?style=social)](https://github.com/arsalan507/2xgERP/fork)

</div>

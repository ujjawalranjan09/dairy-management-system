# Dairy Management System

A complete dairy subscription management system with both frontend and backend components. This system helps dairy shops manage customers, products, purchases, billing, and payments efficiently.

## Features

### Backend (Node.js + Express + Prisma)
- RESTful API with Express.js
- SQLite database with Prisma ORM
- Authentication with JWT
- Role-based access control (ADMIN, EMPLOYEE, CUSTOMER)
- WhatsApp integration for daily purchase summaries
- Automated cron jobs for notifications

### Frontend (React + Vite + Tailwind CSS)
- Modern responsive UI
- Role-based dashboard views
- Customer management
- Product management
- Purchase tracking (daily entry)
- Billing system
- Payment tracking
- User/staff management (ADMIN only)

## Project Structure

```
dairy-management-system/
├── backend/              # Node.js Backend
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic (WhatsApp service)
│   ├── prisma/          # Database schema and migrations
│   ├── src/             # Source code (db connection)
│   ├── .env             # Environment variables
│   └── server.js        # Entry point
└── frontend/            # React Frontend
    ├── src/
    │   ├── components/  # Reusable components
    │   ├── pages/       # Page components
    │   ├── services/    # API services
    │   └── App.jsx      # Main app component
    └── public/          # Static assets
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

#### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd dairy-management-system
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Start the backend server
npm start
```

The backend server will start on `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Purchases
- `GET /api/purchases` - Get all purchases
- `POST /api/purchases` - Create new purchase
- `PUT /api/purchases/:id` - Update purchase
- `DELETE /api/purchases/:id` - Delete purchase

### Billing
- `GET /api/billing` - Get billing information

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment status

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Database Schema

The system manages:
- **Users** - System users with roles (ADMIN, EMPLOYEE, CUSTOMER)
- **Customers** - Dairy customers with contact information
- **Products** - Dairy products with pricing
- **Purchases** - Daily purchase records
- **Payments** - Monthly payment tracking

## Environment Variables

### Backend (.env)
```env
PORT=5000
JWT_SECRET=your_secret_key
DATABASE_URL=file:./dev.db
WHATSAPP_API_URL=your_whatsapp_api_url
WHATSAPP_API_KEY=your_whatsapp_api_key
```

## Deployment

### Backend Deployment
1. Set up a production database (PostgreSQL recommended)
2. Run migrations: `npx prisma migrate deploy`
3. Set environment variables on your hosting platform
4. Deploy the backend to your preferred platform (Heroku, Railway, AWS, etc.)

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to a static hosting service (Vercel, Netlify, GitHub Pages, etc.)

## License

This project is licensed under the ISC License.

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Contact

For questions or support, please open an issue in the repository.
# 🏥 MediSync - Hospital Management System

![MediSync Banner](https://img.shields.io/badge/MediSync-Hospital%20Management-blue?style=for-the-badge&logo=hospital&logoColor=white)

## 📋 Table of Contents
- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation Guide](#installation-guide)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🎯 About the Project

**MediSync** is a comprehensive hospital management system designed to streamline healthcare operations and improve patient care. The system provides a unified platform for managing patient records, appointments, medical staff, inventory, and hospital resources efficiently.

### 🌟 Vision
To revolutionize healthcare management by providing a modern, user-friendly, and efficient digital solution that enhances patient care quality while reducing administrative overhead.

### 🎯 Mission
- **Digitize** hospital operations for better efficiency
- **Streamline** patient management and medical workflows
- **Enhance** communication between medical staff
- **Improve** patient experience and care quality
- **Provide** real-time insights through comprehensive dashboards

## ✨ Key Features

### 🔐 Multi-Role Authentication System
- **Role-based access control** for different user types
- **Secure authentication** with JWT tokens
- **Permission-based feature access**

### 👥 Patient Management
- **Digital patient registration** and profile management
- **Medical history tracking** and consultation records
- **Appointment scheduling** and token generation
- **Real-time queue management**

### 🩺 Medical Staff Portal
- **Doctor dashboard** with patient queue and consultation tools
- **Nurse station** for patient monitoring and care coordination
- **Real-time patient status updates**
- **Department-wise staff management**

### 💊 Pharmacy & Inventory
- **Drug inventory management** with real-time stock tracking
- **Low stock alerts** and automated reorder notifications
- **Prescription management** linked to patient records
- **Medication dispensing tracking**

### 🏥 Operation Theatre Management
- **OT scheduling** and resource allocation
- **Real-time OT status monitoring**
- **Equipment and staff assignment**
- **Emergency protocol management**

### 📊 Administrative Dashboard
- **Comprehensive analytics** and reporting
- **Staff management** and role assignments
- **Department oversight** and resource planning
- **System configuration** and settings

### 📱 Real-time Features
- **Live patient queue updates**
- **Real-time OT status monitoring**
- **Instant notifications** for critical updates
- **Dynamic dashboard updates**

## 🛠 Technology Stack

### Frontend
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-6.15.0-CA4245?style=flat&logo=react-router&logoColor=white)

- **React 18.2.0** - Modern UI library with hooks and context
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **React Router DOM** - Client-side routing and navigation
- **React Hot Toast** - Beautiful notification system
- **Lucide React** - Modern icon library

### Backend
![Node.js](https://img.shields.io/badge/Node.js-18.17.0-339933?style=flat&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.18.2-000000?style=flat&logo=express&logoColor=white)
![Knex.js](https://img.shields.io/badge/Knex.js-2.5.1-D26B38?style=flat&logo=knex.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)

- **Node.js 18.17.0** - JavaScript runtime environment
- **Express.js 4.18.2** - Web application framework
- **Knex.js 2.5.1** - SQL query builder and migration tool
- **MySQL 8.0** - Relational database management system
- **bcryptjs** - Password hashing and security
- **jsonwebtoken** - JWT authentication implementation
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Development Tools
![ESLint](https://img.shields.io/badge/ESLint-8.45.0-4B32C3?style=flat&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-3.0.0-F7B93E?style=flat&logo=prettier&logoColor=white)
![Git](https://img.shields.io/badge/Git-2.41.0-F05032?style=flat&logo=git&logoColor=white)

- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting and style consistency
- **Git** - Version control system
- **npm** - Package management

## 🏗 System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │    │   (Node.js)     │    │   (MySQL)       │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  Patient    │ │    │ │   Auth      │ │    │ │   Users     │ │
│ │  Portal     │ │    │ │ Controller  │ │    │ │   Table     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  Doctor     │◄┼────┼►│  Patient    │◄┼────┼►│  Patients   │ │
│ │  Dashboard  │ │    │ │ Controller  │ │    │ │   Table     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  Pharmacy   │ │    │ │   Drug      │ │    │ │   Drugs     │ │
│ │  Management │ │    │ │ Controller  │ │    │ │   Table     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  Admin      │ │    │ │    OT       │ │    │ │    OT       │ │
│ │  Panel      │ │    │ │ Controller  │ │    │ │  Tables     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Schema Overview
- **Users & Authentication**: User management with role-based access
- **Patient Management**: Patient records, consultations, and medical history
- **Token System**: Queue management and appointment scheduling
- **Pharmacy**: Drug inventory and prescription tracking
- **Operation Theatre**: OT scheduling and resource management
- **Departments**: Hospital department organization

## 🚀 Installation Guide

### Prerequisites
- **Node.js** (v18.17.0 or higher)
- **MySQL** (v8.0 or higher)
- **npm** (v9.0.0 or higher)
- **Git** (latest version)

### 1. Clone the Repository
```bash
git clone https://github.com/RaiSrishti/MediSync.git
cd MediSync
```

### 2. Backend Setup

#### Navigate to Backend Directory
```bash
cd MediSync-backend
```

#### Install Dependencies
```bash
npm install
```

#### Environment Configuration
Create a `.env` file in the backend root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASS=your_mysql_password
DB_NAME=medisync_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_strong
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

#### Database Setup
```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE medisync_db;"

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed
```

#### Start Backend Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The backend server will start on `http://localhost:5000`

### 3. Frontend Setup

#### Navigate to Frontend Directory
```bash
cd ../MediSync-frontend
```

#### Install Dependencies
```bash
npm install
```

#### Environment Configuration
Create a `.env` file in the frontend root directory:
```env
# Backend API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=MediSync
VITE_APP_VERSION=1.0.0
```

#### Start Frontend Development Server
```bash
npm run dev
```

The frontend application will start on `http://localhost:5173`

### 4. Initial Setup and Admin Account

#### Create Admin User
```bash
# In the backend directory
node scripts/createAdmin.js
```

#### Create Departments
```bash
node scripts/createDepartments.js
```

#### Create Sample Drugs (Optional)
```bash
node scripts/createSampleDrugs.js
```

### 5. Default Login Credentials

After running the setup scripts, you can log in with:

**Admin Account:**
- Email: `admin@medisync.com`
- Password: `*****`

**Test Doctor Account:**
- Email: `doctor@medisync.com`
- Password: `doctor123`

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register          # User registration
POST /api/auth/login             # User login
POST /api/auth/logout            # User logout
GET  /api/auth/profile           # Get user profile
PUT  /api/auth/profile           # Update user profile
```

### Patient Management
```
GET    /api/patients             # Get all patients
POST   /api/patients             # Create new patient
GET    /api/patients/:id         # Get patient by ID
PUT    /api/patients/:id         # Update patient
DELETE /api/patients/:id         # Delete patient
```

### Token System
```
GET    /api/tokens               # Get tokens for department
POST   /api/tokens               # Generate new token
PUT    /api/tokens/:id           # Update token status
DELETE /api/tokens/:id           # Cancel token
```

### Pharmacy Management
```
GET    /api/drugs                # Get drug inventory
POST   /api/drugs                # Add new drug
PUT    /api/drugs/:id            # Update drug information
DELETE /api/drugs/:id            # Remove drug
GET    /api/drugs/low-stock      # Get low stock alerts
```

### Operation Theatre
```
GET    /api/ot                   # Get OT information
POST   /api/ot/schedule          # Schedule OT
PUT    /api/ot/:id               # Update OT status
GET    /api/ot/availability      # Check OT availability
```

### Department Management
```
GET    /api/departments          # Get all departments
POST   /api/departments          # Create department
PUT    /api/departments/:id      # Update department
DELETE /api/departments/:id      # Delete department
```

## 👤 User Roles

### 🔹 Patient
- **Registration** and profile management
- **Token generation** for consultations
- **View queue status** and waiting times
- **Access medical history** and reports
- **Appointment scheduling**

### 🔹 Doctor
- **Patient consultation** management
- **Queue monitoring** and patient calling
- **Medical record** access and updates
- **Prescription** writing and management
- **Dashboard** with daily statistics

### 🔹 Nurse
- **Patient monitoring** and care coordination
- **Vital signs** recording and tracking
- **Medication administration** tracking
- **Department-wise** patient oversight
- **Emergency response** coordination

### 🔹 Pharmacist
- **Drug inventory** management
- **Prescription processing** and dispensing
- **Stock monitoring** and reorder alerts
- **Patient medication** history tracking
- **Inventory reports** and analytics

### 🔹 Receptionist
- **Patient registration** and check-in
- **Appointment scheduling** coordination
- **Token generation** and queue management
- **Display board** management
- **Visitor assistance** and information

### 🔹 Admin
- **User management** and role assignments
- **System configuration** and settings
- **Department management** and organization
- **Analytics and reporting** overview
- **System maintenance** and monitoring

## 📱 Screenshots

### Patient Portal
- Modern and intuitive patient interface
- Easy token generation and queue monitoring
- Medical history access and appointment booking

### Doctor Dashboard
- Comprehensive patient queue management
- Real-time consultation tools and medical records
- Performance analytics and daily statistics

### Admin Panel
- Complete system overview and management
- User administration and role assignments
- Advanced analytics and reporting tools

### Mobile Responsive
- Fully responsive design for all devices
- Touch-friendly interface for tablets
- Mobile-optimized navigation and features

## 🔧 Development

### Project Structure
```
MediSync/
├── MediSync-backend/           # Backend API server
│   ├── controllers/            # Route controllers
│   ├── models/                 # Database models
│   ├── routes/                 # API routes
│   ├── middleware/             # Custom middleware
│   ├── db/                     # Database migrations
│   └── scripts/                # Utility scripts
├── MediSync-frontend/          # Frontend React application
│   ├── src/                    # Source code
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom hooks
│   │   ├── context/            # React context
│   │   └── services/           # API services
│   └── public/                 # Static assets
└── README.md                   # Project documentation
```

### Available Scripts

#### Backend Scripts
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run migrate      # Run database migrations
npm run rollback     # Rollback last migration
npm run seed         # Seed database with sample data
npm test             # Run test suite
```

#### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Password Hashing** using bcryptjs
- **Role-based Access Control** (RBAC)
- **CORS Protection** with configurable origins
- **Input Validation** and sanitization
- **SQL Injection Protection** through parameterized queries
- **Session Management** with automatic logout

## 🚀 Deployment

### Production Build

#### Backend
```bash
cd MediSync-backend
npm install --production
npm start
```

#### Frontend
```bash
cd MediSync-frontend
npm run build
# Serve the dist/ folder using a web server
```

### Environment Variables for Production
Update your `.env` files with production values:
- Use strong JWT secrets
- Configure production database
- Set appropriate CORS origins
- Enable security headers

## 🤝 Contributing

We welcome contributions to MediSync! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Contribution Guidelines
- Follow the existing code style and conventions
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Email**: support@medisync.com
- **Issues**: [GitHub Issues](https://github.com/RaiSrishti/MediSync/issues)
- **Documentation**: [Wiki](https://github.com/RaiSrishti/MediSync/wiki)

## 🙏 Acknowledgments

- **React Team** for the amazing frontend library
- **Express.js Community** for the robust backend framework
- **Tailwind CSS** for the utility-first CSS framework
- **MySQL** for the reliable database system
- **Open Source Community** for inspiration and resources

---

<div align="center">

**Made with ❤️ for better healthcare management**

![GitHub stars](https://img.shields.io/github/stars/RaiSrishti/MediSync?style=social)
![GitHub forks](https://img.shields.io/github/forks/RaiSrishti/MediSync?style=social)
![GitHub issues](https://img.shields.io/github/issues/RaiSrishti/MediSync)
![GitHub license](https://img.shields.io/github/license/RaiSrishti/MediSync)

**[⬆ Back to Top](#-medisync---hospital-management-system)**

</div>

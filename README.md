# 🎯 Blogify - A Modern Blogging Platform

> A full-stack blogging application with authentication, user management, and GraphQL API support.

![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.19.2-blue?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-8.6.0-green?logo=mongodb)
![GraphQL](https://img.shields.io/badge/GraphQL-16.9.0-purple?logo=graphql)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [GraphQL Queries](#graphql-queries)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Authentication & Authorization
- 🔐 **Email/Password Authentication** with OTP verification
- 🔑 **JWT Token-based Sessions**
- 🌐 **Google OAuth 2.0 Integration**
- 👥 **Role-based Access Control** (USER & ADMIN)

### Blogging Features
- ✍️ **Create, Read, Update, Delete (CRUD)** blogs
- 🏞️ **Cover Image Upload** via Cloudinary
- 🔍 **Advanced Search** functionality
- 📊 **Filter & Sort** (by title, newest, oldest)
- 📄 **Pagination Support**
- 👤 **User Profile Management**

### Admin Dashboard
- 📈 **View All Users** and their blog statistics
- 🗑️ **User Management** (delete users and their blogs)
- 📊 **Analytics Overview**

### API & Developer Tools
- 🚀 **REST API** endpoints
- 📡 **GraphQL API** with interactive GraphiQL interface
- 📧 **Email Notifications** (OTP & Password Reset)

---

## 🛠️ Tech Stack

### Backend
- **Node.js** (v20.x) - JavaScript runtime
- **Express.js** (v4.19.2) - Web framework
- **MongoDB** (v8.6.0) - NoSQL database
- **Mongoose** - MongoDB ODM

### Frontend
- **EJS** - Server-side templating
- **Bootstrap** - CSS framework
- **JavaScript** - Client-side scripting

### APIs & Services
- **GraphQL** (v16.9.0) - Query language for APIs
- **Express-GraphQL** - GraphQL middleware
- **Passport.js** - Authentication middleware
- **JWT** - Token-based authentication
- **Nodemailer** - Email service
- **Cloudinary** - Image hosting & management

### Deployment
- **Docker** - Containerization
- **Render** - Cloud hosting

---

## 🚀 Installation

### Prerequisites
- Node.js v20.x or higher
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- Gmail account (for email notifications)
- Google OAuth credentials (optional)

### Clone & Setup

```bash
# Clone the repository
git clone https://github.com/webdeveloper10908-bit/Blogify5.0.0.1.git
cd Blogify5.0.0.1

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev

# Or start production server
npm start
```

Server runs on: `http://localhost:8000`

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=8000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blogify

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Service (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-domain/user/auth/google/callback
```

---

## 📖 Usage

### User Registration & Login

**Sign Up:**
1. Go to `/user/signup`
2. Enter email and receive OTP
3. Verify OTP and set password
4. Account created successfully!

**Sign In:**
1. Go to `/user/signin`
2. Enter email and password
3. Or use "Sign in with Google"

**Password Reset:**
1. Click "Forgot Password" on signin page
2. Enter email
3. Check email for reset link
4. Set new password

### Create & Manage Blogs

**Create Blog:**
1. Sign in to your account
2. Click "Create New Blog"
3. Add title, content, and cover image
4. Publish blog

**View Blogs:**
- Home page displays all blogs
- Search by title or content
- Filter by sort order (newest, oldest, A-Z)
- Pagination support

**Your Profile:**
- `/user/profile` - View all your blogs
- Search your own blogs
- Delete your blogs

### Admin Panel

**Access Admin Dashboard:**
- Only users with ADMIN role can access
- Visit `/admin/users`
- View all users and their blog statistics
- Delete users and their content

---

## 🔌 API Endpoints

### Authentication Routes
```
POST   /user/signup              - Register new user
POST   /user/signin              - Login with email & password
POST   /user/send-otp            - Send OTP to email
POST   /user/forgot-password     - Request password reset
POST   /user/reset-password      - Reset password with token
GET    /user/logout              - Logout user
GET    /user/auth/google         - Google OAuth login
GET    /user/auth/google/callback - Google OAuth callback
```

### Blog Routes (Authenticated)
```
GET    /blogs/add-new            - Get create blog form
POST   /blogs/add-new            - Create new blog
GET    /blogs/:id                - Get single blog
DELETE /blogs/:id                - Delete blog (owner only)
```

### Profile Routes (Authenticated)
```
GET    /user/profile             - View user's blogs
GET    /user/profile?search=...  - Search user's blogs
```

### Admin Routes (Admin Only)
```
GET    /admin/users              - View all users & blogs
DELETE /admin/users/:id          - Delete user
```

### GraphQL
```
GET/POST /graphql                - GraphQL endpoint
```

---

## 📡 GraphQL Queries

Access GraphiQL interface at: `https://your-domain/graphql`

### Example Queries

**Get All Blogs:**
```graphql
query {
  blogs(limit: 10, sort: "newest") {
    _id
    title
    body
    coverImageURL
    createdAt
    createdBy {
      fullName
      email
      profileImageURL
    }
  }
}
```

**Get Single Blog:**
```graphql
query {
  blog(id: "60f5d9c8e3f2a1b2c3d4e5f6") {
    _id
    title
    body
    createdBy {
      fullName
    }
  }
}
```

**Search Blogs:**
```graphql
query {
  blogs(search: "nodejs", limit: 5) {
    _id
    title
    createdAt
  }
}
```

**Get Current User:**
```graphql
query {
  me {
    _id
    fullName
    email
    role
    profileImageURL
  }
}
```

---

## 📁 Project Structure

```
Blogify5.0.0.1/
├── models/                 # Database schemas
│   ├── user.js            # User model with auth methods
│   └── Blog.js            # Blog model
├── routes/                # Express routes
│   ├── User.js            # Auth routes
│   ├── Blog.js            # Blog routes
│   ├── Profile.js         # User profile routes
│   ├── Admin.js           # Admin routes
│   └── GoogleAuthentication.js
├── middlewares/           # Custom middlewares
│   ├── authentication.js  # Auth middleware
│   ├── queryParams.js     # Query parsing middleware
│   └── CloudinaryUploads.js
├── services/              # Business logic
│   ├── authentication.js  # JWT utilities
│   └── email.js           # Email service
├── graphql/               # GraphQL setup
│   └── schema.js          # GraphQL schema & resolvers
├── views/                 # EJS templates
│   ├── home.ejs          # Home page
│   ├── addBlog.ejs       # Create blog form
│   ├── profile.ejs       # User profile
│   └── partials/         # Reusable components
├── public/               # Static files (CSS, JS, images)
├── app.js                # Main application file
├── package.json          # Dependencies
├── Dockerfile            # Docker configuration
└── .env.example          # Environment variables template
```

---

## 🔐 Security Features

✅ **Password Hashing** - SHA256 with salt
✅ **JWT Tokens** - Secure token-based auth (7-day expiry)
✅ **HTTP-only Cookies** - Protection against XSS
✅ **CSRF Protection** - Same-site cookies
✅ **Input Validation** - Email & OTP verification
✅ **Rate Limiting** - OTP expiry (5 minutes)
✅ **Environment Variables** - Sensitive data protection

---

## 🐳 Docker Deployment

```bash
# Build Docker image
docker build -t blogify:latest .

# Run container
docker run -p 8000:8000 \
  -e MONGODB_URI=your_mongodb_uri \
  -e JWT_SECRET=your_secret \
  blogify:latest
```

---

## 📝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🙋 Support

For issues and questions:
- Open an issue on [GitHub Issues](https://github.com/webdeveloper10908-bit/Blogify5.0.0.1/issues)
- Contact: webdeveloper10908@gmail.com

---

## 🌐 Live Demo

**Visit:** [Blogify on Render](https://blogify5-0-0-1.onrender.com)

---

## ⭐ Show Your Support

If you found this project helpful, please consider giving it a star! ⭐

---

**Made with ❤️ by [webdeveloper10908-bit](https://github.com/webdeveloper10908-bit)**

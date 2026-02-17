Campus Resource Management System
Overview

Campus Resource Management System is a full-stack web application that allows institutions to manage campus resources such as labs, classrooms, and event halls.

Users can book resources based on their role, and administrators can manage resources and approve or reject booking requests. The system includes secure authentication using JWT and role-based access control.

Tech Stack
Backend

Java 17

Spring Boot 3.2.5

Spring Security

JWT (JSON Web Tokens)

JPA / Hibernate

MySQL

Maven

Frontend

React 18

React Router DOM

Axios

Tailwind CSS

Framer Motion

jwt-decode

Key Features
Authentication & Security

User registration (Student / Staff)

Secure login with JWT token

Password encryption using BCrypt

Role-based access control (Admin / Student / Staff)

Account lock after 3 failed login attempts

Password strength validation

User Roles & Permissions
Student

View available resources

Book resources (maximum 1 hour per day)

View personal booking history

Track booking status (Pending / Approved / Rejected)

Staff

View available resources

Book resources (maximum 8 hours per booking)

View booking history

Track booking status

Admin

Add, update, delete resources

View all booking requests

Approve or reject bookings with reason

Override conflicts (emergency booking)

Manage resource availability

Resource Management

Add new resources (name, type, capacity, status)

Edit existing resources

Delete resources

Search and filter resources

Real-time availability tracking

Booking System

Time slots between 8 AM and 8 PM

Conflict detection for overlapping bookings

Booking status tracking

Rejection reasons stored

Emergency override option for admin

Project Structure
campus-resource-management/
│
├── backend/
│   ├── src/main/java/com/fsdjava/campus/
│   │   ├── config/        # Security & JWT configuration
│   │   ├── controller/    # REST API endpoints
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── entity/        # JPA entities
│   │   ├── repository/    # Database repositories
│   │   └── service/       # Business logic
│   │
│   └── src/main/resources/
│       └── application.properties
│
└── frontend/
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Page components
    │   ├── services/      # API services
    │   └── App.jsx        # Main app component
    │
    └── package.json

Installation & Setup
Prerequisites

Java 17 or higher

Node.js 18 or higher

MySQL 8.0 or higher

Maven

Git

Backend Setup
1. Clone Repository
git clone https://github.com/yourusername/campus-resource-management.git
cd campus-resource-management/backend

2. Create Database
CREATE DATABASE campus;

3. Configure application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/campus
spring.datasource.username=root
spring.datasource.password=yourpassword

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

jwt.secret=yourSecretKey123456789
jwt.expiration=86400000

server.port=8080

4. Run Backend
mvn clean install
mvn spring-boot:run


Backend runs at:

http://localhost:8080

Frontend Setup
cd ../frontend
npm install
npm run dev


Frontend runs at:

http://localhost:5173

API Endpoints
Public
Method	Endpoint	Description
POST	/api/auth/register	Register user
POST	/api/auth/login	Login and get JWT
Student
Method	Endpoint
GET	/api/student/resources
GET	/api/bookings/my
POST	/api/bookings
Admin
Method	Endpoint
GET	/api/admin/resources
POST	/api/admin/resources
PUT	/api/admin/resources/{id}
DELETE	/api/admin/resources/{id}
GET	/api/bookings/all
PUT	/api/bookings/{id}/approve
PUT	/api/bookings/{id}/reject
Database Schema
Users Table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    failed_attempts INT DEFAULT 0,
    lock_time DATETIME
);

Resources Table
CREATE TABLE resources (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    type VARCHAR(100),
    capacity INT,
    status VARCHAR(50)
);

Bookings Table
CREATE TABLE bookings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    resource_id BIGINT,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    status VARCHAR(50),
    emergency_override BOOLEAN DEFAULT FALSE,
    rejection_reason TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (resource_id) REFERENCES resources(id)
);

Default Test Users
Email	Password	Role
admin@campus.com
	admin123	ADMIN
student@test.com
	Student@123	STUDENT
staff@test.com
	Staff@123	STAFF
Common Issues
Backend Not Starting

Ensure MySQL is running

Check database credentials

Verify port 8080 is free

Login Returns 403

Check credentials

Ensure account is not locked

Verify /api/auth/** is permitted in SecurityConfig

CORS Issues

Ensure frontend origin is added in CORS configuration

Backend must run before frontend

How to Run the Project

Start MySQL

Run backend

Run frontend

Open browser at:

http://localhost:5173

Author

Developed as part of Full Stack Development training.
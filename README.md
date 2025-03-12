#  Online Vehicle Rental System

A full-stack MERN (MongoDB, Express.js, React, Node.js) web application for renting vehicles online, with **user authentication, booking management, and payment integration.

## Features

-  **User Authentication** (Register/Login with JWT)
-  **Vehicle Listings** (Search, Filter & View Details)
-  **Booking System** (Reserve Vehicles for Specific Dates)
- **Secure Payment Integration** (Stripe & Razorpay)
-  **Rental History Tracking** (User Dashboard)
- **Admin Panel** (Manage Users, Vehicles & Bookings)

---

##  Project Structure

Authentication
POST	/api/auth/register	Register a user	No Authentication is required
POST	/api/auth/login	Login a user	No Authentication is required
GET	/api/auth/me	Get current user	Yes Authentication is required

Vehicles

GET	/api/vehicles	Get all vehicles	 No Authentication is required
GET	/api/vehicles/:id	Get vehicle details	No Authentication is required
POST	/api/vehicles	Add new vehicle (Admin)	Yes Authentication is required

Booking

POST	/api/bookings	Create a new booking	 Yes Authentication is required
GET	/api/bookings/my	Get my bookings	Yes Authentication is required
DELETE	/api/bookings/:id	Cancel a booking	Yes Authentication is required

User Roles & Permissions
Role	     Permissions
Admin	Can manage vehicles, bookings, users
User	Can book vehicles, view booking history

Tech Stack
Frontend: React.js + TailwindCSS
Backend: Node.js + Express.js
Database: MongoDB Atlas
Auth: JWT (JSON Web Token)
Payments: Stripe / Razorpay


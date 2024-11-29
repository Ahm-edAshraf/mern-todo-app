# Modern Todo Application

A feature-rich todo application built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Features

- User Authentication (Login/Register)
- Task Management (Create, Read, Update, Delete)
- Task Categories and Tags
- Task Priority Levels
- Drag and Drop Task Reordering
- Dark Mode Support
- Task Analytics
- Search and Filter Functionality
- Responsive Design
- Modern UI with Animations

## Tech Stack

- Frontend:
  - React.js
  - Redux Toolkit (State Management)
  - Material-UI (UI Components)
  - Framer Motion (Animations)
  - React Beautiful DnD (Drag and Drop)
  - Chart.js (Analytics)
  - Axios (API Requests)

- Backend:
  - Node.js
  - Express.js
  - MongoDB (Database)
  - JWT (Authentication)
  - Bcrypt (Password Hashing)

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

4. Start the development servers:
   ```bash
   # Start backend server (from backend directory)
   npm run dev

   # Start frontend server (from frontend directory)
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/user` - Get user data
- PUT `/api/auth/settings` - Update user settings

### Tasks
- GET `/api/tasks` - Get all tasks
- POST `/api/tasks` - Create a new task
- PUT `/api/tasks/:id` - Update a task
- DELETE `/api/tasks/:id` - Delete a task
- PUT `/api/tasks/reorder` - Reorder tasks
- GET `/api/tasks/analytics` - Get task analytics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

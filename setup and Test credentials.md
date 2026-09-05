Source Code Repository Link - frontned - https://github.com/ashirbad811/crm-frontend
backend- https://github.com/ashirbad811/crm-backend
Live Application Link -https://crm-frontend-sable-xi.vercel.app/

Test Credentials -
{
name: 'System Admin',
email: 'admin@crm.com',
password: 'password123',
roleName: 'Admin'
},
{
name: 'Rohan (Manager)',
email: 'rohan@crm.com',
password: 'password123',
roleName: 'Sales Manager'
},
{
name: 'Abhijit',
email: 'abhijit@crm.com',
password: 'password123',
roleName: 'Sales Executive'
},
{
name: 'Soniya',
email: 'soniya@crm.com',
password: 'password123',
roleName: 'Sales Executive'
}
}

Setup instruction -
Backend-

1. Clone the Repository
   git clone https://github.com/ashirbad811/crm-backend

2. Navigate to the Backend Directory
   cd crm-backend

3. Install Dependencies
   npm install

4. Create a .env file in the backend directory:

PORT=5000
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development

5. Run the Database Seed Script
   node seed.js

6. Start the Backend Server
   npm start

Frontend-

1. Clone the Repository
   git clone https://github.com/ashirbad811/crm-frontend

2. Navigate to the Frontend Directory
   cd crm-frontend

3. Install Dependencies
   npm install

4. Create a .env file in the frontend directory:

VITE_API_URL=http://localhost:5000/api

4. Start the Frontend Development Server
   npm run dev

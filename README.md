# Salah Property Maintenance Website

Professional property maintenance website with MongoDB backend integration.

## 🚀 Setup Instructions

### Prerequisites
- Node.js installed on your computer
- MongoDB Atlas account (already configured)

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - The `.env` file is already configured with your MongoDB connection string
   - Make sure the `.env` file is in the project root directory
   - **Important:** Never commit the `.env` file to version control

3. **Start the Server**
   
   Development mode (with auto-restart):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

4. **Access the Website**
   - Open your browser and go to: `http://localhost:5000`
   - The website will be served by the Express server

## 📊 Database Schema

### Contact Form Submissions
Each contact form submission is stored in MongoDB with the following structure:

```javascript
{
  name: String (required),
  phone: String (required),
  email: String (optional),
  service: String (required) - enum: ['painting', 'plumbing', 'tiling', 'carpentry', 'repairs', 'cleaning', 'other'],
  message: String (required),
  status: String (default: 'pending') - enum: ['pending', 'contacted', 'completed'],
  createdAt: Date (default: current date)
}
```

## 🔌 API Endpoints

### Contact Form API

- **POST** `/api/contact` - Submit contact form
  ```json
  {
    "name": "John Doe",
    "phone": "07511688681",
    "email": "john@example.com",
    "service": "painting",
    "message": "I need interior painting services"
  }
  ```

- **GET** `/api/contacts` - Get all contact submissions (admin)
- **GET** `/api/contacts/:id` - Get specific contact by ID
- **PUT** `/api/contacts/:id` - Update contact status
- **DELETE** `/api/contacts/:id` - Delete contact

### Health Check
- **GET** `/api/health` - Check server and database status

## 🔒 Security Notes

- MongoDB credentials are stored in `.env` file (never in code)
- The `.env` file is included in `.gitignore` to prevent accidental commits
- API endpoints are protected with proper error handling
- Input validation is implemented on the backend

## 📁 Project Structure

```
Web/
├── Salah.html          # Main HTML file
├── style.css           # Styling
├── script.js           # Frontend JavaScript
├── server.js           # Backend server
├── package.json        # Node.js dependencies
├── .env                # Environment variables (MongoDB credentials)
├── .gitignore          # Files to exclude from git
└── README.md           # This file
```

## 🎯 Features

- ✅ Responsive design for all devices
- ✅ MongoDB integration for data storage
- ✅ Contact form with validation
- ✅ WhatsApp integration for immediate contact
- ✅ Professional UI/UX design
- ✅ Smooth animations and transitions
- ✅ Mobile navigation

## 🛠️ Troubleshooting

### MongoDB Connection Issues
- Check your internet connection
- Verify MongoDB Atlas whitelist settings (allow IP access)
- Ensure the connection string in `.env` is correct

### Port Already in Use
- Change the PORT in `.env` file (default: 5000)
- Or stop other processes using port 5000

### Dependencies Issues
- Delete `node_modules` folder and `package-lock.json`
- Run `npm install` again

## 📞 Contact Information

- **Phone:** 07511688681, 07471523012
- **Email:** salahpropertymaintenance@gmail.com
- **Instagram:** @salahpropertymaintenance

---

**Note:** This setup uses MongoDB Atlas for cloud database storage. Make sure your MongoDB Atlas cluster is running and accessible.
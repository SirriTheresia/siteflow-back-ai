# Environment Variables Required

Create a `.env` file in the backend root directory with these variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ghl-automator
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ghl-automator

# Server
PORT=4000
FRONTEND_URL=http://localhost:5173

# Authentication
JWT_SECRET=your-secret-key-here-make-it-long-and-secure

# Optional for production
NODE_ENV=development
```

## Quick Setup Commands:

For local MongoDB:
```bash
# Install MongoDB locally or use MongoDB Atlas
# Default connection: mongodb://localhost:27017/ghl-automator
```

For JWT Secret:
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
``` 
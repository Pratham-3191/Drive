# Drive Manager - Full-Stack MERN Storage App

A Google Drive-style file and folder manager built using the MERN stack with JWT authentication stored in HttpOnly cookies, Cloudinary storage, recursive folder size calculations, and a Model Context Protocol (MCP) server for local AI assistant integration.

## Live Demo

Frontend:
https://drive-phi-gilt.vercel.app

Backend:
https://drive-u68c.vercel.app

---

## Features
- **User Authentication**: Secure Sign-up, Login, and Logout using HttpOnly cookies for JWT tokens.
- **Nested Folder Hierarchies**: Supports creating unlimited nested folders with duplicate checks.
- **Image Management**: Upload images directly. Images are saved to Cloudinary, and metadata (including file size in bytes) is stored in MongoDB.
- **Recursive Size Calculation**: View size metrics on directories that auto-calculate based on images contained within the active directory and all of its nested child directories.
- **User Isolation**: Fully protected routes and database query layers ensuring that users can only access their own folders and files.
- **MCP Server Integration**: A lightweight Model Context Protocol (MCP) server to allow Claude Desktop to list directories, create folders, and upload local computer images directly to Drive Manager using natural language!

---

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Axios, React Router, Lucide Icons, Vite
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT (jsonwebtoken), Cookie Parser, Bcryptjs, Multer
- **Storage**: Cloudinary API
- **MCP**: `@modelcontextprotocol/sdk`

---

## Getting Started

### Prerequisites
1. [Node.js](https://nodejs.org/) installed on your machine.
2. [MongoDB](https://www.mongodb.com/) running locally (or an Atlas connection string).
3. A [Cloudinary Account](https://cloudinary.com/) (free tier works perfectly) to get credentials.

---

### Backend Setup

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` directory and configure the variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/drive-manager
   JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY
   CLOUDINARY_CLOUD_NAME=YOUR_CLOUDINARY_CLOUD_NAME
   CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
   CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET
   FRONTEND_URL=http://localhost:5173
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server runs by default on `http://localhost:5000`.*

---

### Frontend Setup

1. Open another terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The client runs by default on `http://localhost:5173`.*

---

### MCP Server (Bonus) Setup

This project includes a Model Context Protocol (MCP) server that lets Claude Desktop interact with your personal cloud drive using natural language tools.

#### 1. Setup the MCP Server
1. Navigate to the `mcp-server` folder:
   ```bash
   cd mcp-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `mcp-server/` directory and fill in user details (Example details given below):
   ```env
   BACKEND_URL=http://localhost:5000/api
   MCP_USER_EMAIL=prathamchaudhari124@gmail.com
   MCP_USER_PASSWORD=123456
   ```

#### 2. Configure Claude Desktop
To add this server to Claude Desktop, edit your `claude_desktop_config.json` configuration file:
- On Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- On macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the server configuration inside the `mcpServers` object:

```json
{
  "mcpServers": {
    "drive-manager": {
      "command": "node",
      "args": [
        "c:/Users/Gigabyte/DobbyAds/mcp-server/index.js"
      ],
      "env": {
        "BACKEND_URL": "http://localhost:5000/api",
        "MCP_USER_EMAIL": "prathamchaudhari124@gmail.com",
        "MCP_USER_PASSWORD": "123456"
      }
    }
  }
}
```

#### Available MCP Tools
- `list_folders`: Shows hierarchical paths, folder lists, images, and sizes.
- `create_folder`: Creates a folder at root level or nested under another folder.
- `upload_image`: Reads an image file from your local computer and streams it directly to your Cloudinary drive.

---

## Project Structure
```
├── backend/
│   ├── controllers/       # Route request handlers
│   ├── middleware/        # Authentication protection middleware
│   ├── models/            # Mongoose MongoDB schemas
│   ├── routes/            # Express endpoint mappings
│   └── utils/             # Cloudinary configuration and streams
├── frontend/
│   └── src/
│       ├── api/           # Axios custom configurations
│       ├── components/    # Reusable layouts, rows, and modal dialogs
│       ├── context/       # Auth React context provider
│       └── pages/         # Login, Signup, and Drive views
└── mcp-server/            # Model Context Protocol service
```

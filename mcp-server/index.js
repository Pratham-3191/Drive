import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';
const EMAIL = process.env.MCP_USER_EMAIL || 'test@example.com';
const PASSWORD = process.env.MCP_USER_PASSWORD || 'password123';

let authCookie = '';

// Helper to authenticate with backend and get httpOnly cookie
async function authenticate() {
  try {
    console.error(`[MCP] Attempting login to ${BACKEND_URL} as ${EMAIL}...`);
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const cookies = response.headers['set-cookie'];
    if (cookies && cookies.length > 0) {
      // Find the token cookie
      const tokenCookie = cookies.find(c => c.startsWith('token='));
      if (tokenCookie) {
        authCookie = tokenCookie.split(';')[0];
        console.error('[MCP] Authentication successful');
        return true;
      }
    }
    console.error('[MCP] Login succeeded but token cookie was not received');
    return false;
  } catch (error) {
    console.error('[MCP] Authentication failed:', error.response?.data?.message || error.message);
    return false;
  }
}

// Initialize MCP Server
const server = new Server(
  {
    name: "drive-manager-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_folders",
        description: "List subfolders and images in a given folder (or root folder if parentFolderId is not provided). Returns details such as folder size and image metadata.",
        inputSchema: {
          type: "object",
          properties: {
            parentFolderId: {
              type: "string",
              description: "Optional folder ID. If omitted or set to 'null', displays the root folder contents."
            }
          }
        }
      },
      {
        name: "create_folder",
        description: "Create a new folder in Drive Manager under a specific parent folder (or at root level).",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the folder to create."
            },
            parentFolderId: {
              type: "string",
              description: "Optional parent folder ID. If omitted or set to 'null', creates the folder at the root level."
            }
          },
          required: ["name"]
        }
      },
      {
        name: "upload_image",
        description: "Upload a local image file from your machine into Drive Manager.",
        inputSchema: {
          type: "object",
          properties: {
            filePath: {
              type: "string",
              description: "Absolute local file path to the image to upload."
            },
            name: {
              type: "string",
              description: "Optional display name for the image. If omitted, uses the filename."
            },
            parentFolderId: {
              type: "string",
              description: "Optional destination folder ID. If omitted or set to 'null', uploads to the root level."
            }
          },
          required: ["filePath"]
        }
      }
    ]
  };
});

// Handle tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // If not authenticated, try to authenticate once
  if (!authCookie) {
    const success = await authenticate();
    if (!success) {
      return {
        content: [{ type: "text", text: "Error: MCP Server is not authenticated. Please check backend status and credentials." }],
        isError: true
      };
    }
  }

  const { name: toolName, arguments: args } = request.params;

  try {
    switch (toolName) {
      case "list_folders": {
        const parentFolderId = args.parentFolderId || 'null';
        const response = await axios.get(`${BACKEND_URL}/folders/content`, {
          params: { parentFolderId },
          headers: { Cookie: authCookie }
        });

        const { currentFolder, breadcrumbs, folders, images, size } = response.data;
        
        let output = `Current Folder: ${currentFolder ? currentFolder.name : 'Root'}\n`;
        output += `Total Folder Size: ${(size / 1024).toFixed(2)} KB (${size} bytes)\n`;
        
        if (breadcrumbs.length > 0) {
          output += `Path: Root > ${breadcrumbs.map(b => b.name).join(' > ')}\n`;
        }
        
        output += `\nSubfolders (${folders.length}):\n`;
        if (folders.length === 0) {
          output += " - None\n";
        } else {
          folders.forEach(f => {
            output += ` - [ID: ${f._id}] ${f.name} (Recursive Size: ${(f.size / 1024).toFixed(2)} KB)\n`;
          });
        }

        output += `\nImages (${images.length}):\n`;
        if (images.length === 0) {
          output += " - None\n";
        } else {
          images.forEach(img => {
            output += ` - [ID: ${img._id}] ${img.name} (Size: ${(img.size / 1024).toFixed(2)} KB, URL: ${img.url})\n`;
          });
        }

        return { content: [{ type: "text", text: output }] };
      }

      case "create_folder": {
        const folderName = args.name;
        const parentFolderId = args.parentFolderId === 'null' || !args.parentFolderId ? null : args.parentFolderId;

        const response = await axios.post(`${BACKEND_URL}/folders`, {
          name: folderName,
          parentFolderId
        }, {
          headers: { Cookie: authCookie }
        });

        const folder = response.data;
        const output = `Successfully created folder:\n - Name: ${folder.name}\n - ID: ${folder._id}\n - Parent Folder: ${folder.parentFolderId || 'Root'}`;
        
        return { content: [{ type: "text", text: output }] };
      }

      case "upload_image": {
        const filePath = args.filePath;
        const imageName = args.name || path.basename(filePath);
        const parentFolderId = args.parentFolderId || 'null';

        // Resolve absolute path
        const resolvedPath = path.resolve(filePath);

        if (!fs.existsSync(resolvedPath)) {
          return {
            content: [{ type: "text", text: `Error: File not found at path: ${resolvedPath}` }],
            isError: true
          };
        }

        // Read file into stream/buffer
        const fileStream = fs.createReadStream(resolvedPath);

        const form = new FormData();
        form.append('image', fileStream);
        form.append('name', imageName);
        form.append('folderId', parentFolderId);

        console.error(`[MCP] Uploading local image ${resolvedPath} as "${imageName}"...`);
        const response = await axios.post(`${BACKEND_URL}/images`, form, {
          headers: {
            ...form.getHeaders(),
            Cookie: authCookie
          }
        });

        const image = response.data;
        const output = `Successfully uploaded image:\n - Name: ${image.name}\n - ID: ${image._id}\n - Size: ${(image.size / 1024).toFixed(2)} KB\n - URL: ${image.url}\n - Folder ID: ${image.folderId || 'Root'}`;

        return { content: [{ type: "text", text: output }] };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${toolName}` }],
          isError: true
        };
    }
  } catch (error) {
    console.error(`[MCP] Error executing tool ${toolName}:`, error);
    const message = error.response?.data?.message || error.message;
    return {
      content: [{ type: "text", text: `API Error: ${message}` }],
      isError: true
    };
  }
});

// Run server using stdio transport
async function run() {
  // Pre-authenticate at startup
  await authenticate();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[MCP] Drive Manager MCP Server running on STDIO transport");
}

run().catch((error) => {
  console.error("[MCP] Fatal error running MCP Server:", error);
  process.exit(1);
});

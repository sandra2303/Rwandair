# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# Start with migration then server
CMD ["sh", "start.sh"]

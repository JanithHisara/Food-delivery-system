# Use a full Node base image (not Alpine)
FROM node:22

# Set working directory
WORKDIR /usr/src/app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps --silent

# Copy all source files
COPY . .

# Expose port (adjust if different)
EXPOSE 5000

# Default command
CMD ["npm", "start"]

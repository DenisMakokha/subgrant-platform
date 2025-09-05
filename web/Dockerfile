# Build stage
FROM node:16-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM node:16-alpine AS production

# Install serve globally
RUN npm install -g serve

# Set the working directory
WORKDIR /app

# Copy the build output from the builder stage
COPY --from=builder /app/build ./build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
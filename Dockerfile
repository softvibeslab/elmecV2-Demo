# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set production environment variables for Expo build
ENV NODE_ENV=production
ENV EXPO_PUBLIC_ENVIRONMENT=production
ENV EXPO_PUBLIC_SUPABASE_URL=https://pdpqkgrqlubyzkcivifk.supabase.co
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcHFrZ3JxbHVieXprY2l2aWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMDk3MzgsImV4cCI6MjA3NDc4NTczOH0.xcjdhR89okeqaMGeq5oYAjuvRk56H9-Wc8SXjHpPls4

# Build the web application
RUN npx expo export --platform web --output-dir dist

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

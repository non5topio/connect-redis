# FROM node:21 AS base

# # Update apt repository and install redis-server
# RUN apt-get update && apt-get install -y redis-server

# # Set the working directory in the container
# WORKDIR /app

# # Copy package files and install dependencies, then install Vitest as a dev dependency
# COPY package*.json ./
# RUN npm install && npm install -D vitest

# FROM base AS test
# # Copy the rest of your application code
# COPY . .

# # Expose the port your app will run on (adjust as needed)
# EXPOSE 3000

# # Start redis-server then run Vitest tests
# CMD redis-server --daemonize yes && npm run test



# FROM node:21 AS base

# # Update apt repository and install redis-server
# RUN apt-get update && apt-get install -y redis-server

# # Set the working directory in the container
# WORKDIR /app

# # Copy package files and install dependencies, then install Vitest as a dev dependency
# COPY package*.json ./
# RUN npm install && npm install -D vitest

# FROM base AS test
# # Copy the rest of your application code
# COPY . .

# # Expose the port your app will run on
# EXPOSE 3000

# # Create a startup script
# RUN echo '#!/bin/bash\nredis-server --daemonize yes\n# Wait for Redis to fully start\nsleep 2\nnpm run test' > /app/start.sh && \
#     chmod +x /app/start.sh

# # Use the startup script as the entry point
# CMD ["/app/start.sh"]



FROM node:21 AS base

# Update apt repository and install redis-server
RUN apt-get update && apt-get install -y redis-server

# Set the working directory in the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install && npm install -D vitest

FROM base AS test
# Copy the application code
COPY . .

# Create a start script for reliable testing
RUN echo '#!/bin/bash\n\
# Stop any existing Redis instance\n\
service redis-server stop\n\
\n\
# Make sure Redis socket directory exists\n\
mkdir -p /var/run/redis\n\
\n\
# Configure Redis to run on default port\n\
echo "Starting Redis server..."\n\
redis-server --daemonize yes --port 6379 --bind 0.0.0.0\n\
\n\
# Wait for Redis to fully initialize\n\
echo "Waiting for Redis to start..."\n\
sleep 3\n\
\n\
# Verify Redis is running\n\
echo "Checking Redis connection..."\n\
redis-cli ping\n\
if [ $? -ne 0 ]; then\n\
  echo "Redis failed to start properly. Exiting..."\n\
  exit 1\n\
fi\n\
echo "Redis is running successfully!"\n\
\n\
# Set environment variable to indicate test environment\n\
export NODE_ENV=test\n\
\n\
# Run the tests\n\
echo "Running tests..."\n\
npm run test\n\
' > /app/start.sh && chmod +x /app/start.sh

# Expose port for Redis
EXPOSE 6379
# Expose port for app
EXPOSE 3000

# Use the start script as the entry point
CMD ["/app/start.sh"]
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

FROM node:21 AS base

# Update apt repository and install redis-server
RUN apt-get update && apt-get install -y redis-server

# Set the working directory in the container
WORKDIR /app

# Copy package files and install dependencies, then install Vitest as a dev dependency
COPY package*.json ./
RUN npm install && npm install -D vitest

FROM base AS test
# Copy the rest of your application code
COPY . .

# Expose the port your app will run on
EXPOSE 3000

# Create a startup script
RUN echo '#!/bin/bash\nredis-server --daemonize yes\n# Wait for Redis to fully start\nsleep 2\nnpm run test' > /app/start.sh && \
    chmod +x /app/start.sh

# Use the startup script as the entry point
CMD ["/app/start.sh"]
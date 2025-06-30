FROM node:20-alpine

WORKDIR /app

# Copy over the packages
COPY package*.json ./

# Install everything
RUN npm install

# Copy source code
COPY . .

# Expose the port
EXPOSE 5173

# Start the application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
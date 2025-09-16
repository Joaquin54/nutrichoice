FROM node:22-alpine
WORKDIR /app

# Copy package files from the frontend folder, not root
COPY package*.json ./

RUN npm ci

# Now copy the rest of the frontend source
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

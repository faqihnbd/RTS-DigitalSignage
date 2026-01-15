FROM node:18-bullseye-slim
WORKDIR /usr/src/app

# Install ffmpeg (used by fluent-ffmpeg/ffprobe)
RUN apt-get update && apt-get install -y ffmpeg ca-certificates --no-install-recommends && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE EXPOSE 3000
CMD ["node", "index.js"]

FROM public.ecr.aws/lambda/nodejs:20

# Install Chromium & dependencies
RUN dnf install -y \
    chromium \
    nss \
    atk \
    at-spi2-atk \
    libXcomposite \
    libXdamage \
    libXrandr \
    mesa-libgbm \
    alsa-lib \
    pango \
    cairo \
    libXcursor \
    libXext \
    libXi \
    libXrender \
    && dnf clean all

WORKDIR /var/task

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm install --production

COPY . .

# Lambda entry point
CMD ["lambda.handler"]

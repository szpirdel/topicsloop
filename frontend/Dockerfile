# Wybierz oficjalny obraz Node.js
FROM node:20-alpine
FROM node:20-alpine AS builder

# Ustaw katalog roboczy
WORKDIR /app

# Kopiuj package.json i package-lock.json
COPY package*.json ./

# Zainstaluj zależności
RUN npm install --retry=10 --timeout=1000000 --force

# Kopiuj pozostałe pliki projektu
COPY . .

RUN npm cache clean --force && \
   npm install --force

# Uruchom build aplikacji (opcja w zależności od środowiska)
RUN npm run build

# Użyj serwera statycznego do obsługi Reacta
RUN npm install -g serve --retry=3 --timeout=300000

# Ustaw domyślne polecenie
CMD ["serve", "-s", "build"]

# Expose port 3000 (lub inny, jeśli potrzebny)
EXPOSE 3000

#Debagowanie Dockera
RUN npm install || cat /path/to/npm-debug.log

#Limit na 2 joby przy instalacji
RUN npm install --legacy-peer-deps --jobs=2
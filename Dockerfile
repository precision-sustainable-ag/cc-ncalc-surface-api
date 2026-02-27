FROM node:22
WORKDIR /usr/app
COPY . .
RUN npm install

WORKDIR /usr/app/public/client
RUN npm install
RUN npm install vite
RUN npm run build

WORKDIR /usr/app

EXPOSE 80
ENTRYPOINT npm start
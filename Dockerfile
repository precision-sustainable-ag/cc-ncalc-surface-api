FROM node:18 as builder
WORKDIR /
COPY . .
RUN npm install
EXPOSE 1000
ENTRYPOINT npm start

FROM nginx:1.23.1-alpine
COPY --from=builder /public /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
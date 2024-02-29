FROM node:14-alpine

WORKDIR /app

COPY mining/package*.json ./

RUN npm install

COPY mining/ .

CMD ["npm", "run", "auto"]

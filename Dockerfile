FROM node:latest

RUN mkdir -p /opt/sliver-ci
WORKDIR /opt/sliver-ci
RUN npm install -g ts-node typescript

COPY package*.json ./
RUN npm install
COPY ./sliver-server /opt/sliver-ci/sliver-server

COPY . ./

ENTRYPOINT [ "ts-node", "run.ts" ]

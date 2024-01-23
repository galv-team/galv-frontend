# SPDX-License-Identifier: BSD-2-Clause
# Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
# of Oxford, and the 'Galv' Developers. All rights reserved.

FROM node:lts@sha256:132309f5136555725debd57b711eb4b329fff22a00588834dbec391a3f9782cf as build

RUN npm install -g pnpm

RUN mkdir -p /app
WORKDIR /app
COPY . /app/

RUN mv .env.vite .env

RUN pnpm install

RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/nginx.conf.template /etc/nginx/conf.d/custom.conf

EXPOSE 80
CMD ["/bin/sh" , "-c" , "exec nginx -g 'daemon off;'"]


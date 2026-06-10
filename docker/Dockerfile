FROM alpine:3.24

RUN apk add --no-cache \
    chromium \
    xvfb \
    x11vnc \
    supervisor \
    bash

ENV DISPLAY=:1

WORKDIR /app
COPY supervisor.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 5900

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

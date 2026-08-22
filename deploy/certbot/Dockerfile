# Custom certbot image: adds the Docker CLI so the renew deploy-hook can
# reload nginx after a successful renewal (docker socket is mounted into the
# certbot container by docker-compose.prod.yml).
FROM certbot/certbot:latest

RUN apk add --no-cache docker-cli

# --deploy-hook runs "docker exec lms-nginx nginx -s reload" after each renewal
ENTRYPOINT ["/bin/sh", "-c", "trap exit TERM; while :; do certbot renew --webroot -w /var/www/certbot --quiet --deploy-hook \"docker exec lms-nginx nginx -s reload\"; sleep 12h & wait $${!}; done;"]
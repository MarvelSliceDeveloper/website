# Apache Reverse Proxy for LMS (Host Apache on :80 + Docker Nginx on 127.0.0.1:8080/8443)

Host Apache already binds `0.0.0.0:80` (Webuzo). Docker `nginx` cannot also bind `80` -> we map it to `127.0.0.1:8080:80` and `127.0.0.1:8443:443` in `docker-compose.prod.yml:14`.

```
Internet :80/:443 -> Host Apache (Webuzo) -> 127.0.0.1:8080 (Docker lms-nginx) -> web/api/landing
```

## Apache VHost (Webuzo -> Apache -> /etc/httpd/conf.d/lms-proxy.conf or Webuzo panel -> Domain -> Proxy)

```apache
<VirtualHost *:80>
    ServerName lms.marvelslice.com
    ServerName www.marvelslice.com
    ServerAlias lms.marvelslice.com www.marvelslice.com

    # Let's Encrypt webroot — must be reachable for certbot --webroot -w /var/www/certbot
    Alias /.well-known/acme-challenge/ /opt/lms/certbot-webroot/.well-known/acme-challenge/
    <Directory /opt/lms/certbot-webroot>
        Options None
        AllowOverride None
        Require all granted
    </Directory>

    ProxyPreserveHost On
    ProxyPass /.well-known/acme-challenge/ !
    ProxyPass / http://127.0.0.1:8080/
    ProxyPassReverse / http://127.0.0.1:8080/
    RequestHeader set X-Forwarded-Proto "http"
</VirtualHost>

# If you let Webuzo handle SSL (recommended), add :443 vhost:
<VirtualHost *:443>
    ServerName lms.marvelslice.com
    ServerName www.marvelslice.com
    SSLEngine on
    SSLCertificateFile /usr/local/webuzo/certs/lms.marvelslice.com/fullchain.pem
    SSLCertificateKeyFile /usr/local/webuzo/certs/lms.marvelslice.com/privkey.pem

    Alias /.well-known/acme-challenge/ /opt/lms/certbot-webroot/.well-known/acme-challenge/
    ProxyPreserveHost On
    ProxyPass /.well-known/acme-challenge/ !
    ProxyPass / http://127.0.0.1:8080/
    ProxyPassReverse / http://127.0.0.1:8080/
    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

Enable proxy modules:
```bash
a2enmod proxy proxy_http headers alias  # Debian/Ubuntu
systemctl restart apache2   # or httpd
```

## Docker side

`docker-compose.prod.yml:14` now:
```yaml
ports:
  - "127.0.0.1:8080:80"
  - "127.0.0.1:8443:443"
```

Certbot: if host Apache handles SSL, you can keep Docker `nginx` on `8080` only and let Webuzo renew certs. If you keep `certbot` container, change its webroot to host path so Apache can serve it:

```yaml
# in docker-compose.prod.yml nginx & certbot:
volumes:
  - ./certbot-webroot:/var/www/certbot
```

Then `mkdir -p certbot-webroot` on host before `up -d`.

## Verify

```bash
docker compose -f docker-compose.prod.yml ps  # nginx 127.0.0.1:8080->80
curl -H "Host: lms.marvelslice.com" http://127.0.0.1:8080/health  # via Docker directly
curl -H "Host: lms.marvelslice.com" http://localhost/.well-known/acme-challenge/test  # via Apache
```

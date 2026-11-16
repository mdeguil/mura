# Putting Mura behind HTTPS

**English** | [Français](../fr/https.md)

Without HTTPS, everything that passes between the browser and Mura travels in the clear: passwords at sign-in, the token that keeps the session open, and the content of projects. Anyone on the same Wi-Fi network, or between the server and the person, can read it. As soon as an instance is open to people other than you, on your own machine, it must be on HTTPS.

Mura comes with what it takes to do this in one command: [Caddy](https://caddyserver.com), placed in front of the application, gets a free certificate from Let's Encrypt, renews it by itself and redirects HTTP to HTTPS.

## What you need

- **A server** reachable from the Internet, with Docker and Docker Compose (version 2.24 or later).
- **A domain name**, for example `mura.example.org`, whose `A` DNS record (and `AAAA` if the server has an IPv6 address) points to the server's IP address. This is set at the domain's registrar; propagation can take from a few minutes to a few hours.
- **Ports 80 and 443 open** on the server's firewall and, if there is one, on the router or the host. Let's Encrypt uses port 80 to check that the domain really is yours.
- **No other service** already using ports 80 or 443 on the server (an Apache or an nginx installed by default, for example). If there is one, see [If you already have a reverse proxy](#if-you-already-have-a-reverse-proxy).

## Setting it up

1. **In `.env`, give the instance's address**, with `https://` and nothing after the domain:

   ```
   MURA_URL=https://mura.example.org
   ```

   It is the same variable as the one for the links in e-mails: it serves both.

2. **Still in `.env`, add the HTTPS file** to the ones Docker Compose reads:

   ```
   COMPOSE_FILE=docker-compose.yml:docker-compose.https.yml
   ```

   On a Windows server, the separator is `;` instead of `:`.

3. **Start or restart Mura**:

   ```bash
   docker compose up -d --build
   ```

4. **Watch Caddy get the certificate**:

   ```bash
   docker compose logs -f caddy
   ```

   After a few seconds, the line `certificate obtained successfully` appears. `Ctrl+C` leaves the logs; Caddy keeps running.

5. **Open `https://mura.example.org`**: the padlock shows, and `http://mura.example.org` redirects to the HTTPS version.

Once Caddy is in place, the frontend is no longer published on `FRONTEND_PORT`: everything goes through ports 80 and 443.

## What the configuration does

- [`docker-compose.https.yml`](../../docker-compose.https.yml) adds the `caddy` service on ports 80 and 443, and removes the frontend's port. Certificates are kept in the `caddy_data` volume: they survive restarts, and Caddy renews them before they expire.
- [`caddy/Caddyfile`](../../caddy/Caddyfile) tells Caddy to serve the domain of `MURA_URL`, to compress responses, to send the HSTS header (the browser remembers that it must never come over HTTP again for a year) and to pass everything to the frontend, which in turn passes `/api` to the backend.
- People's real address is passed all the way to the backend, which uses it to limit sign-in attempts and forgotten-password requests. Caddy ignores the one a client claims to have.

## Checking that all is well

- **The certificate**: click the browser's padlock; the issuer must be Let's Encrypt.
- **The e-mails**: ask for a "Forgot password" link; it must start with `https://mura.example.org/`.
- **The site's grade**: [SSL Labs](https://www.ssllabs.com/ssltest/) tests the HTTPS configuration of a public domain. Caddy gets an A without any tuning.

## If something goes wrong

**`certificate obtained successfully` never appears, or the logs mention `ACME` and `challenge failed`.**
Let's Encrypt cannot reach your server. Check, in this order:
- that the domain really points to the server: `nslookup mura.example.org` must give its IP address;
- that ports 80 and 443 are open from outside (the server's firewall, the host's, the router's port forwarding);
- that no other service is using these ports: `docker compose logs caddy` then says `address already in use`.

After too many failures, Let's Encrypt makes you wait an hour; Caddy tries again by itself.

**`required variable MURA_URL is missing a value` at startup.**
`MURA_URL` is empty in `.env`. The HTTPS file needs it to know which domain to serve.

**The browser shows "Too many redirects".**
Another proxy in front of Caddy (Cloudflare in "Flexible" mode, for example) talks HTTP to Caddy, which redirects to HTTPS, and so on. Switch that proxy to "Full (strict)" mode, or remove it.

**The links in e-mails still point to `localhost`.**
The backend was not restarted after `MURA_URL` changed: `docker compose up -d` recreates it with the new value.

## If you already have a reverse proxy

If the server already runs nginx, Traefik or Apache for other sites, do not use `docker-compose.https.yml`: let your proxy handle the certificate and have it pass requests to Mura.

- Keep `MURA_URL=https://mura.example.org` in `.env`, without the `COMPOSE_FILE` line.
- Point your proxy at `http://127.0.0.1:5173` (or the port chosen in `FRONTEND_PORT`).
- Pass people's real address in the `X-Forwarded-For` header, without which the sign-in limits would count everyone as a single person.
- Close the `FRONTEND_PORT` port to the rest of the Internet with the server's firewall: only your proxy should be able to reach it.

For example, with nginx and a certificate obtained by Certbot:

```nginx
server {
    listen 443 ssl;
    server_name mura.example.org;

    ssl_certificate     /etc/letsencrypt/live/mura.example.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mura.example.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

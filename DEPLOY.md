Deployment to a VPS (IP-only) using Docker + Nginx

Quick steps

1. Copy repository to your VPS (git clone or scp).
2. Install Docker and Docker Compose on the VPS.
3. Create a `.env` from `.env.example` and fill database credentials.
4. From project root run:

```bash
docker compose build --parallel
docker compose up -d
```

5. After enabling HTTPS, open https://69.62.84.122/admin/ for admin, `/central/` and `/display/` for others.

If another nginx is already running on the host (occupying ports 80/443), this stack maps the proxy to host ports `8080` (HTTP) and `8443` (HTTPS) to avoid conflicts. In that case use:

```text
http://69.62.84.122:8080/admin/
https://69.62.84.122:8443/admin/
```

Notes

- The top-level `nginx` container proxies `/api/` to the backend and serves frontends under `/admin/`, `/central/`, `/display/`.
- Backend uploads are persisted to `./backend/uploads` on the host via a bind mount.
- If you use an external DB, ensure the backend can reach it (open firewall, correct DB env vars).

HTTPS (IP address)

- Public CAs (Let's Encrypt) do not issue certificates for bare IP addresses. To serve HTTPS on the VPS IP you can either obtain a commercial IP certificate (rare/paid) or create a self-signed certificate for testing.
- Steps to create a self-signed certificate on the VPS and run the stack:

```bash
# on the VPS, from project root
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
	-keyout nginx/certs/server.key \
	-out nginx/certs/server.crt \
	-subj "/CN=69.62.84.122"

docker compose build --parallel
docker compose up -d
```

- The `docker-compose.yml` mounts `./nginx/certs` into the nginx container at `/etc/nginx/certs` and nginx is configured to listen on port 443 for IP `69.62.84.122`.
- Your browser will warn about an untrusted certificate for the self-signed cert — you can add an exception to proceed.

Troubleshooting

- To see logs:

```bash
docker compose logs -f nginx
docker compose logs -f backend
```

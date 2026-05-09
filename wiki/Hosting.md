Under construction!

## Self-Hosting

### Local Network

Local network connection is currently the default assumption of these docs.

### Remote Access

In order to allow players and even other DMs to remotely access to your installation, you need to enable additional outside services. The easiest two approaches to this are either using a Virtual Private Network (VPN), or a combination of Dynamic DNS (DDNS) and local port forwarding:

- **VPN:** Many modern routers feature built-in VPN configuration. See your router's docs for more details.
- **DDNS:** A number of [free and paid online DDNS services](https://www.google.com/search?q=dynamic+dns&oq=dynamic+dns) exist that can forward a custom hostname to your home internet network. Using port forwarding (see your router's docs) it's easy to then forward a remote port to the host port of your Dungeon Revealer installation.

### Hosting on a Server

- [Install Dungeon Revealer on a Digital Ocean Droplet](https://www.ehrenpforte.com/technical-2/943/)

#### Deploying on Oracle Cloud Free Tier (Always-On, Free)

Oracle Cloud offers a permanently free VM (VM.Standard.E2.1.Micro) that is sufficient for small group sessions (2–6 players) and stays online 24/7 without any cost.

---

**Architecture overview**

The VPS is a low-resource machine (1 vCPU, 1 GB RAM). Compiling the application directly on it would take hours. Instead, we use the following split:

- **GitHub Actions** (powerful runner) — builds the Docker image and pushes it to Docker Hub
- **Oracle VPS** (low-resource) — only pulls the pre-built image from Docker Hub and runs it

This keeps deployments fast (~10–15 min total) and reliable.

```
push to master
      │
      ▼
① Bump version  (GitHub Actions)
      │
      ▼
② Build Docker image  (GitHub Actions — fast)
      │
      ▼
③ Push image to Docker Hub
      │
      ▼
④ SSH → VPS → docker pull + restart  (~1 min)
      │
      ▼
✅  App updated at https://your-domain.duckdns.org
```

---

**Prerequisites**

- Oracle Cloud account with a free VM running Ubuntu 20.04+
- A reserved (static) public IPv4 attached to the VM
- A free [DuckDNS](https://www.duckdns.org) subdomain pointing to your IP
- Ports 22, 80 and 443 open in the Oracle Cloud security list **and** in Ubuntu's iptables
- A free [Docker Hub](https://hub.docker.com) account to host the image

---

**Step 1 — Install Docker on the VPS**

Connect via SSH, then run:

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu focal stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
```

---

**Step 2 — Run the container for the first time**

Pull the image from Docker Hub and start the container:

```bash
sudo docker pull your-dockerhub-user/navis:latest

sudo docker run -d \
  --name navis \
  --restart always \
  -p 3000:3000 \
  -v /home/ubuntu/navis-data:/var/data/navis \
  -e DATA_DIRECTORY=/var/data/navis \
  -e DM_PASSWORD='your-dm-password' \
  -e PC_PASSWORD='your-pc-password' \
  your-dockerhub-user/navis:latest
```

> **Data persistence:** The `-v /home/ubuntu/navis-data:/var/data/navis` flag mounts a folder from the host into the container. All maps, tokens and notes are stored there and will survive container restarts or image updates. Never omit this flag.

---

**Step 3 — Set up HTTPS with nginx + Let's Encrypt**

nginx acts as a reverse proxy in front of the app and Let's Encrypt provides a free SSL certificate that renews automatically every 90 days.

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Make sure ports 80 and 443 are open in the firewall
sudo apt-get install -y iptables-persistent
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4

# Create the nginx configuration for the app
sudo tee /etc/nginx/sites-available/navis > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.duckdns.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 100m;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/navis /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Request the SSL certificate — certbot will automatically update the nginx config for HTTPS
sudo certbot --nginx -d your-domain.duckdns.org --non-interactive --agree-tos -m your@email.com
```

The app is now accessible at:

- `https://your-domain.duckdns.org` — Player view
- `https://your-domain.duckdns.org/mj` — Dungeon Master view

---

**Step 4 — Set up automatic deployment (GitHub Actions)**

Two workflow files handle CI/CD:

| Pipeline                                 | File         | Purpose                                                         | Triggered by           |
| ---------------------------------------- | ------------ | --------------------------------------------------------------- | ---------------------- |
| **[Auto] Build, Push & Deploy to VPS**   | `deploy.yml` | Bump version + build image + push to Docker Hub + deploy to VPS | Every push to `master` |
| **[Manual] Build and Push Docker Image** | `docker.yml` | Build and push image only, no deployment                        | Manual trigger only    |

**Why two pipelines?**

**[Manual] Build and Push Docker Image** is kept for manual use — for example, to force a fresh image rebuild without pushing any code change. On a normal push to `master`, only **[Auto] Build, Push & Deploy to VPS** runs. It already includes the build and push steps internally, so triggering both at the same time would build the exact same image twice in parallel, wasting time and GitHub Actions minutes.

Add the following secrets to your GitHub repository under **Settings → Secrets and variables → Actions**:

| Secret               | Description                                   |
| -------------------- | --------------------------------------------- |
| `VPS_HOST`           | Public IP address of the Oracle VM            |
| `VPS_SSH_KEY`        | Private SSH key used to connect to the VM     |
| `DOCKERHUB_USERNAME` | Your Docker Hub username                      |
| `DOCKERHUB_TOKEN`    | A Docker Hub access token (not your password) |
| `DM_PASSWORD`        | Password for the Dungeon Master interface     |
| `PC_PASSWORD`        | Password for the player interface             |

Once the secrets are set, every merge to `master` will automatically build, push and deploy the new version. The VPS itself never compiles anything — it only pulls the ready-made image.

### Usage with Reverse Proxy

#### Basic Usage

You can configure the base url dungeon-revealer uses with the `PUBLIC_URL` environment variable.
This can be helpful for use-cases in which you want to expose dungeon-revealer under a non root path such as `https://my-site.com/dungeon-revealer`.

```bash
PUBLIC_URL=https://my-site.com/dungeon-revealer dungeon-revealer
```

#### Example NGINX Configuration

For this example we assume that dungeon-revealer is listening on `127.0.0.1`.

```conf
upstream dungeon-revealer {
    server 127.0.0.1:3000;
}

server {
    listen       80;
    server_name  my-site.com;

    location /dungeon-revealer {
        # rewrite the url to point to 127.0.0.1/dm instead of 127.0.0.1/dungeon-revealer/dm
        rewrite ^/dungeon-revealer(/.*)$ $1 break;
        proxy_pass http://dungeon-revealer/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

```

#### Example Apache HTTPD Configuration

For this example we assume that dungeon-revealer is listening on `127.0.0.1`.

```
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so

<VirtualHost *:80>

  RewriteEngine On

  RewriteCond %{HTTP:Upgrade} websocket               [NC]
  RewriteRule /dungeon-revealer/(.*)           ws://127.0.0.1:3000/$1  [P]

  ProxyPass /dungeon-revealer http://127.0.0.1:3000
  ProxyPassReverse /dungeon-revealer http://127.0.0.1:3000
</VirtualHost>
```

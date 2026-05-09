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

Oracle Cloud offers a permanently free VM (VM.Standard.E2.1.Micro) sufficient for small group sessions (2–6 players).

**Prerequisites**

- Oracle Cloud account with a free VM running Ubuntu 20.04+
- A reserved public IPv4 attached to the VM
- A free DuckDNS subdomain pointing to your IP
- Docker installed on the VM
- Ports 22, 80, 443 open in Oracle Cloud security list and Ubuntu iptables

**Install Docker**

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu focal stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER
```

**Build and run the container**

```bash
git clone https://github.com/YOUR_USER/dungeon-revealer.git
cd dungeon-revealer
git checkout YOUR_BRANCH
sudo docker build -t dungeon-revealer .

sudo docker run -d \
  --name dungeon-revealer \
  --restart always \
  -p 3000:3000 \
  -v /home/ubuntu/dungeon-data:/var/data/dungeon-revealer \
  -e DATA_DIRECTORY=/var/data/dungeon-revealer \
  -e DM_PASSWORD='your-dm-password' \
  -e PC_PASSWORD='your-pc-password' \
  dungeon-revealer
```

> **Important:** Always use `-v` to mount a host directory to `/var/data/dungeon-revealer` and set `DATA_DIRECTORY` to the same path. This ensures maps, tokens and notes persist across container restarts and redeployments.

**Set up HTTPS with nginx + Let's Encrypt**

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Open firewall ports
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4

# Configure nginx
sudo tee /etc/nginx/sites-available/dungeon-revealer > /dev/null << 'EOF'
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
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/dungeon-revealer /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# Generate SSL certificate (auto-renews every 90 days)
sudo certbot --nginx -d your-domain.duckdns.org --non-interactive --agree-tos -m your@email.com
```

**Updating the application**

```bash
ssh your-vps
cd dungeon-revealer
git pull
sudo docker build -t dungeon-revealer .
sudo docker stop dungeon-revealer && sudo docker rm dungeon-revealer
sudo docker run -d \
  --name dungeon-revealer \
  --restart always \
  -p 3000:3000 \
  -v /home/ubuntu/dungeon-data:/var/data/dungeon-revealer \
  -e DATA_DIRECTORY=/var/data/dungeon-revealer \
  -e DM_PASSWORD='your-dm-password' \
  -e PC_PASSWORD='your-pc-password' \
  dungeon-revealer
```

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

# Deployment Guide

## Production Deployment

### 1. Server Requirements

**Minimum:**
- 4 CPU cores
- 16GB RAM
- 100GB SSD storage
- Ubuntu 20.04+ or similar Linux distribution

**Recommended:**
- 8+ CPU cores
- 32GB RAM
- GPU (NVIDIA with CUDA support)
- 500GB SSD storage

### 2. Pre-Deployment Checklist

- [ ] Domain name registered and DNS configured
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] MongoDB Atlas account created (or local MongoDB secured)
- [ ] OpenAI API key obtained
- [ ] Firewall configured (ports 80, 443, 22)
- [ ] Backup strategy implemented

### 3. Docker Production Deployment
```bash
# 1. Clone repository
git clone https://github.com/your-org/ai-synapse-ocr.git
cd ai-synapse-ocr

# 2. Configure production environment
cp .env.example .env
nano .env  # Edit with production values

# 3. Update docker-compose for production
cp docker-compose.yml docker-compose.prod.yml
nano docker-compose.prod.yml  # Update configurations

# 4. Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build

# 5. Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Nginx Reverse Proxy (Optional)

If deploying behind Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        client_max_body_size 50M;
    }
}
```

### 5. Monitoring

Set up monitoring with:
- Prometheus + Grafana for metrics
- ELK Stack for log aggregation
- Uptime Robot for availability monitoring

### 6. Backup Strategy
```bash
# MongoDB backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec ai-synapse-mongodb mongodump --out /backup/mongodb_$DATE
```

### 7. Scaling

For high traffic:
- Use Docker Swarm or Kubernetes
- Set up load balancer
- Deploy multiple backend instances
- Use MongoDB replica sets
- Implement CDN for static assets

---

For detailed deployment instructions, consult your system administrator or DevOps team.
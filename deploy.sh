#!/bin/bash
set -e

cd ~/track-job
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
echo "Deploy complete!"

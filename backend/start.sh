#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Link PostgreSQL in Railway Variables."
  exit 1
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Applying database schema..."
npx prisma db push --accept-data-loss

echo "Starting BeeFood backend..."
exec node server.js

#!/bin/sh
set -e

echo "Generating Prisma client..."
npx prisma generate

echo "Applying database schema..."
if ! npx prisma migrate deploy; then
  echo "migrate deploy failed, falling back to db push..."
  npx prisma db push --accept-data-loss
fi

echo "Starting BeeFood backend..."
exec node server.js

#!/bin/sh
echo "Waiting for database..."
sleep 5
echo "Running migrations..."
node src/config/migrate.js
echo "Running seed..."
node src/config/seed.js
echo "Starting server..."
node src/server.js

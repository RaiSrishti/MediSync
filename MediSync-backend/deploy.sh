#!/bin/bash
# Deployment script for Render

echo "Starting MediSync Backend Deployment..."

# Clean install dependencies
echo "Installing dependencies..."
rm -rf node_modules package-lock.json
npm install

# Check if Express version is correct
echo "Checking Express version..."
npm list express

echo "Starting application..."
npm start

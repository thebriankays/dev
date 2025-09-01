#!/bin/bash
# Install dependencies for AreaExplorer and Cesium integration

echo "Installing required dependencies..."

# Install react-google-autocomplete for place search
pnpm add react-google-autocomplete

# Install copy-webpack-plugin for Cesium assets
pnpm add -D copy-webpack-plugin

echo "Dependencies installed successfully!"
echo ""
echo "Now run these commands to complete setup:"
echo "1. Clear Next.js cache: rm -rf .next"
echo "2. Restart dev server: pnpm dev"

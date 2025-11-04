#!/bin/bash
# Restart OmniRambles backend service

echo "Restarting OmniRambles backend service..."
sudo systemctl restart omnirambles-backend.service

echo ""
echo "Checking service status..."
sudo systemctl status omnirambles-backend.service --no-pager -l

#!/bin/bash
# Install and start OmniRambles service

echo "Installing OmniRambles backend service..."
sudo cp /home/neil/Coding/omnirambles/omnirambles-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable omnirambles-backend.service
sudo systemctl start omnirambles-backend.service

echo ""
echo "Service installation complete!"
echo ""
echo "Checking service status..."
sudo systemctl status omnirambles-backend.service

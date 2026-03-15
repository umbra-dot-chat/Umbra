#!/bin/bash
export PATH="/Users/mattmattmattmatt/.nvm/versions/node/v22.22.1/bin:/Users/mattmattmattmatt/.cargo/bin:$PATH"
cd /Users/mattmattmattmatt/Development/Umbra
node scripts/postinstall.js
exec npx expo start --port 8083 --web

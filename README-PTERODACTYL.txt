NEYX WEBSITE - PTERODACTYL

1. Upload/extract the CONTENTS of this ZIP into the server root.
2. Make sure package.json is directly in /home/container/package.json.
3. Startup command:
   npm start

4. Set the server allocation port in Pterodactyl. The app automatically uses
   the PORT environment variable supplied by Pterodactyl.

5. If Pterodactyl assigns port 2005, the app will listen on 0.0.0.0:2005.
6. Do NOT use `npm install` as the startup command; Pterodactyl normally
   installs dependencies before the startup command.

The API address is configured in:
assets/config.js

Current API:
https://nopeequupanel.priasologembira.web.id


IMPORTANT FOR THIS PTERODACTYL SERVER:
The allocation shown is 0.0.0.0:2005. The server now defaults to port 2005
if Pterodactyl does not provide PORT/SERVER_PORT.

Startup command:
npm start

Do NOT use:
PORT=2005 npm start

After starting, console should say:
NEYX Website running on http://0.0.0.0:2005

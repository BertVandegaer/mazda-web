# Dynatrace Maintenance Webapp

This app lets you view Dynatrace hosts and schedule maintenance windows via a web UI.  
**Ready for Render.com deployment!**

## Features

- Lists all hosts per configured Dynatrace environment.
- Create maintenance windows for any host.
- Stores secrets/config locally (never commit `backend/config.json`).

## Quickstart

1. **Clone the repo**
2. **Configure Dynatrace:**  
   Copy `backend/config.json.example` to `backend/config.json` and fill in your environments & tokens.
3. **Install dependencies:**  
   ```sh
   npm run install-all
   ```
4. **Start servers:**  
   ```sh
   npm start
   ```
   - Backend: http://localhost:4000
   - Frontend: http://localhost:3000

## Deploy to Render.com

- Uses `render.yaml` for two services (Node backend & static frontend).
- Add your `backend/config.json` as a secret file or disk in Render.

## Security

- Never commit `backend/config.json` to GitHub.
- Use Render secrets for deployment.

## To-do

- Implement real Dynatrace API for maintenance window creation in `backend/dynatrace.js`.
- Add user auth for web access if needed.

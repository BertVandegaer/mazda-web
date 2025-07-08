const express = require('express');
const cors = require('cors');
const dynatrace = require('./dynatrace');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/hosts', async (req, res) => {
  const envName = req.query.env;
  try {
    if (envName) {
      // Only fetch for the requested environment
      const config = dynatrace.getConfig();
      const env = config.find(e => e.environment === envName);
      if (!env) return res.status(404).json({ error: "Environment not found" });
      const hosts = await dynatrace.fetchHostsForEnv(env);
      res.json(hosts);
    } else {
      // Existing behavior: fetch all
      const hosts = await dynatrace.fetchAllHosts();
      res.json(hosts);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch hosts', detail: err.message });
  }
});

app.post('/api/maintenance', async (req, res) => {
  console.log('[INFO] /api/maintenance called with:', req.body);
  try {
    const result = await dynatrace.createMaintenanceWindow(req.body);
    res.json(result);
  } catch (err) {
    console.error('[ERROR] /api/maintenance failed:', err.message);
    res.status(500).json({ error: 'Failed to create maintenance window', detail: err.message });
  }
});

app.get('/api/environments', (req, res) => {
  try {
    const config = dynatrace.getConfig();
    // You can choose to just return environment names, or more info if you like
    res.json(config.map(e => ({
      environment: e.environment,
      url: e.url // Optional: include url or other meta
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load environments', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

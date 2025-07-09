const fs = require('fs');
const fetch = require('node-fetch');

function getConfig() {
  const configPath = './config.json';
  if (!fs.existsSync(configPath)) throw new Error('Config file missing');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

async function fetchHostsForEnv(env) {
  const apiUrl = `${env.url}/api/v1/entity/infrastructure/hosts`;
  console.log(`[INFO] Fetching hosts for environment: ${env.environment} (${apiUrl})`);
  try {
    const response = await fetch(apiUrl, {
      headers: { Authorization: `Api-Token ${env.token}` },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`[${env.environment}] HTTP ${response.status}: ${text}`);
    }
    const data = await response.json();
    console.log(`[INFO] Received ${Array.isArray(data) ? data.length : 0} hosts from ${env.environment}`);
    return (data || []).map(h => ({
      hostname: h.displayName || h.hostName,
      environment: env.environment,
      // Optionally include ID for real maintenance window logic
      entityId: h.entityId
    }));
  } catch (err) {
    console.error(`[ERROR] Failed to fetch hosts for ${env.environment}:`, err.message);
    throw err;
  }
}

async function fetchAllHosts() {
  const config = getConfig();
  const all = await Promise.all(
    config.map(env =>
      fetchHostsForEnv(env).catch(e => {
        console.error(`[ERROR] Skipping environment ${env.environment} due to error:`, e.message);
        return [];
      })
    )
  );
  return all.flat();
}

async function createMaintenanceWindow({ hostname, patchLabel, startTime, endTime, environment }) {
  const config = getConfig();
  const env = config.find(e => e.environment === environment);
  if (!env) throw new Error('Environment not found in config');

  // For real integration, you need the Dynatrace entityId for the host!
  // Here, we fetch all hosts and find the entityId for the given hostname.
  let entityId = null;
  try {
    const hosts = await fetchHostsForEnv(env);
    const match = hosts.find(h => h.hostname === hostname);
    entityId = match ? match.entityId : null;
  } catch (err) {
    console.error(`[ERROR] Could not retrieve entityId for host ${hostname}:`, err.message);
  }
  if (!entityId) {
    throw new Error(`Could not find entityId for host: ${hostname}`);
  }

  const payload = {
    name: patchLabel || `Patch window for ${hostname}`,
    description: `Automated maintenance window for host ${hostname}`,
    type: "PLANNED",
    suppression: "DETECT_PROBLEMS_AND_ALERT",
    schedule: {
      type: "ONCE",
      startTime: startTime,
      endTime: endTime
    },
    scope: [
      {
        entities: [entityId]
      }
    ]
  };

  const mwload =   {
  "schemaId": "builtin:alerting.maintenance-window",
  "schemaVersion": "2.15",
  "scope": "environment",
  "value": {
    "enabled": true,
    "generalProperties": {
      "name": `${hostname}`,
      "description": null,
      "maintenanceType": "PLANNED",
      "suppression": "DETECT_PROBLEMS_DONT_ALERT",
      "disableSyntheticMonitorExecution": true
    },
    "schedule": {
      "scheduleType": "ONCE",
      "onceRecurrence": {
        "startTime": startTime,
        "endTime": endTime,
        "timeZone": "Europe/Brussels"
      }
    },
    "filters": [
      {
        "entityType": null,
        "entityId": null,
        "entityTags": [
          "Host": `${hostname}`
        ],
        "managementZones": []
      }
    ]
  }
};



  console.log(`[INFO] Creating maintenance window for host ${hostname} in ${environment}`);
  console.log(`[INFO] mwload:`, JSON.stringify(mwload, null, 2));

  // Uncomment for real Dynatrace API call
  
  const apiUrl = `${env.url}/api/v2/settings/objects?validateOnly=false&adminAccess=false`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Accept": "application/json; charset=utf-8",
      "Authorization": `Api-Token ${env.token}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(mwload)
  });
  const result = await response.json();
  if (!response.ok) {
    console.error(`[ERROR] Failed to create maintenance window:`, result);
    throw new Error(result.message || 'Failed to create maintenance window');
  }
  return {
    status: "ok",
    message: "Maintenance window created",
    dynatraceResponse: result
  };
  

  // Mock response for testing
  return {
    status: "ok",
    message: `Maintenance window would be created for host ${hostname} in ${environment}`,
    debugPayload: mwload
  };
}

module.exports = { fetchAllHosts, fetchHostsForEnv, createMaintenanceWindow, getConfig };

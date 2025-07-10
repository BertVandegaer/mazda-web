import React, { useEffect, useState } from "react";
import HostTable from "./HostTable";

function App() {
  const [envs, setEnvs] = useState([]);
  const [selectedEnv, setSelectedEnv] = useState("");
  const [hosts, setHosts] = useState([]);
  const [error, setError] = useState("");
  const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

  // Fetch environments on load
  useEffect(() => {
    fetch(`${API_BASE}/api/environments`)
      .then(res => res.json())
      .then(setEnvs)
      .catch(err => setError("Error loading environments: " + err.message));
  }, []);

  // Fetch hosts when environment changes
  useEffect(() => {
    if (!selectedEnv) return;
    fetch(`${API_BASE}/api/hosts?env=${encodeURIComponent(selectedEnv)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch hosts');
        return res.json();
      })
      .then(setHosts)
      .catch(err => setError("Error loading hosts: " + err.message));
  }, [selectedEnv]);

  return (
    <div style={{padding: 24}}>
      <h1>Dynatrace Maintenance Manager</h1>
      {error && <div style={{color: "red", marginBottom: 16}}>{error}</div>}
      <div>
        <label>
          Select environment:{" "}
          <select
            value={selectedEnv}
            onChange={e => setSelectedEnv(e.target.value)}
          >
            <option value="">-- Select --</option>
            {envs.map(e => (
              <option key={e.environment} value={e.environment}>
                {e.environment}
              </option>
            ))}
          </select>
        </label>
                <label>
          Fill API token:{" "}
          <select
            value={selectedToken}
            onChange={e => selectedToken(e.target.value)}
          >
            <option value="">-- Select --</option>
            {envs.map(e => (
              <option key={e.token} value={e.token}>
                {e.token}
              </option>
            ))}
          </select>
        </label>
      </div>
      {selectedEnv && selectedToken && <HostTable hosts={hosts} />}
    </div>
  );
}

export default App;

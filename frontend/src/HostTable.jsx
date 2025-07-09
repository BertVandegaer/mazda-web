import React, { useState } from "react";

function nowISO() {
  // Returns YYYY-MM-DDTHH:mm
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const defaultRow = (hosts = []) => ({
  hostname: "",
  patchLabel: "",
  patchStart: nowISO(),
  patchEnd: nowISO(),
  environment: "",
  actionStatus: "",
});

function HostTable({ hosts }) {
  const [rows, setRows] = useState([]);
  const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

  const addRow = () => setRows([...rows, defaultRow(hosts)]);

  const handleChange = (idx, key, value) => {
    const newRows = [...rows];
    if (key === "hostname") {
      const hostObj = hosts.find((h) => h.hostname === value);
      newRows[idx].hostname = value;
      newRows[idx].environment = hostObj ? hostObj.environment : "";
      newRows[idx].patchStart = nowISO();
      newRows[idx].patchEnd = nowISO();
    } else {
      newRows[idx][key] = value;
    }
    setRows(newRows);
  };

  const handleAction = async (idx) => {
    const row = rows[idx];
    const payload = {
      hostname: row.hostname,
      patchLabel: row.patchLabel,
      startTime: row.patchStart,
      endTime: row.patchEnd,
      environment: row.environment,
    };
    const res = await fetch(`${API_BASE}/api/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const newRows = [...rows];
    newRows[idx].actionStatus = data.status === "ok" ? "Created" : "Failed";
    setRows(newRows);
  };

  return (
    <div>
      <button onClick={addRow}>➕ Add Row</button>
      <table border="1" cellPadding={6} style={{marginTop: 16, minWidth: 600}}>
        <thead>
          <tr>
            <th>Hostname</th>
            <th>Patch Label</th>
            <th>Patch Start</th>
            <th>Patch End</th>
            <th>Environment</th>
            <th>Action</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>
                <select
                  value={row.hostname}
                  onChange={e => handleChange(idx, "hostname", e.target.value)}
                >
                  <option value="">Select host</option>
                  {hosts.map(h => (
                    <option key={h.hostname + h.environment} value={h.hostname}>
                      {h.hostname}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  value={row.patchLabel}
                  onChange={e => handleChange(idx, "patchLabel", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="datetime-local"
                  value={row.patchStart}
                  onChange={e => handleChange(idx, "patchStart", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="datetime-local"
                  value={row.patchEnd}
                  onChange={e => handleChange(idx, "patchEnd", e.target.value)}
                />
              </td>
              <td>
                <input value={row.environment} readOnly />
              </td>
              <td>
                <button onClick={() => handleAction(idx)}>Create MW</button>
              </td>
              <td>{row.actionStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HostTable;

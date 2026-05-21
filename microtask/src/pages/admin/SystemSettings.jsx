import { useEffect, useState } from "react";
import "./SystemSettings.css";

const SystemSettings = () => {

  const token = localStorage.getItem("token");

  const [settings, setSettings] = useState({
    supportEmail: "",
    commissionPercent: 10,
    minWithdrawal: 500,
    maintenanceMode: false,
    maintenanceMessage: "",
    loginEnabled: true,
    userControls: {
      allowWorkerRegistration: true,
      allowProviderRegistration: true,
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/settings", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    setSettings(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const toggleSwitch = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const toggleUserControl = (key, value) => {
    setSettings({
      ...settings,
      userControls: {
        ...settings.userControls,
        [key]: value
      }
    });
  };

  const saveSettings = async () => {
    await fetch("https://microtask-platform-backend-y3xo.onrender.com/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });

    alert("Settings Updated Successfully 🚀");
  };

  return (
    <div className="settings-container">

      <h2 className="settings-title">System Settings</h2>

      {/* SUPPORT */}
      <div className="card">
        <h3>Support</h3>
        <input
          name="supportEmail"
          value={settings.supportEmail}
          onChange={handleChange}
          placeholder="Support Email"
        />
      </div>

      {/* FINANCE */}
      <div className="card">
        <h3>Finance</h3>

        <div className="input-group">
          <label>Commission (%)</label>
          <input
            type="number"
            name="commissionPercent"
            value={settings.commissionPercent}
            onChange={handleChange}
          />
        </div>

      </div>

      {/* CONTROLS */}
      <div className="card">
        <h3>Access Control</h3>

        <div className="toggle-row">
          <span>Login Enabled</span>
          <div
            className={`toggle ${settings.loginEnabled ? "active" : ""}`}
            onClick={() => toggleSwitch("loginEnabled", !settings.loginEnabled)}
          >
            <div className="circle"></div>
          </div>
        </div>

        <div className="toggle-row">
          <span>Worker Registration</span>
          <div
            className={`toggle ${settings.userControls.allowWorkerRegistration ? "active" : ""}`}
            onClick={() =>
              toggleUserControl(
                "allowWorkerRegistration",
                !settings.userControls.allowWorkerRegistration
              )
            }
          >
            <div className="circle"></div>
          </div>
        </div>

        <div className="toggle-row">
          <span>Provider Registration</span>
          <div
            className={`toggle ${settings.userControls.allowProviderRegistration ? "active" : ""}`}
            onClick={() =>
              toggleUserControl(
                "allowProviderRegistration",
                !settings.userControls.allowProviderRegistration
              )
            }
          >
            <div className="circle"></div>
          </div>
        </div>

      </div>

      {/* MAINTENANCE */}
      <div className="card">
        <h3>Maintenance</h3>

        <div className="toggle-row">
          <span>Maintenance Mode</span>
          <div
            className={`toggle ${settings.maintenanceMode ? "active" : ""}`}
            onClick={() =>
              toggleSwitch("maintenanceMode", !settings.maintenanceMode)
            }
          >
            <div className="circle"></div>
          </div>
        </div>

        <textarea
          name="maintenanceMessage"
          value={settings.maintenanceMessage}
          onChange={handleChange}
          placeholder="Maintenance message..."
        />

      </div>

      <button className="save-btn" onClick={saveSettings}>
        Save Settings
      </button>

    </div>
  );
};

export default SystemSettings;
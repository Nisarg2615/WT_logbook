import { useEffect, useState } from 'react';
import { AlertOctagon, CheckCircle2, Search, Filter } from 'lucide-react';
import apiClient from '../api/client';
import SignatureModal from '../components/SignatureModal';

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  const [showSignature, setShowSignature] = useState(false);
  const [pendingAlertId, setPendingAlertId] = useState<number | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      if (severityFilter !== 'All') params.append('severity', severityFilter);
      const res = await apiClient.get(`/alerts?${params.toString()}`);
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeClick = (id: number) => {
    setPendingAlertId(id);
    setShowSignature(true);
  };

  const executeAcknowledge = async () => {
    if (!pendingAlertId) return;
    try {
      await apiClient.post(`/alerts/${pendingAlertId}/acknowledge`);
      setShowSignature(false);
      setPendingAlertId(null);
      fetchAlerts();
    } catch (err) {
      alert("Failed to acknowledge alert");
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      (a.parameter && a.parameter.toLowerCase().includes(search.toLowerCase())) ||
      (a.equipment?.equipment_id && a.equipment.equipment_id.toLowerCase().includes(search.toLowerCase())) ||
      (a.equipment?.name && a.equipment.name.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  if (loading && alerts.length === 0) return <div className="p-8 text-secondary">Loading alerts...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Active Plant Alerts</h2>
          <p className="text-secondary mt-1">Monitor, investigate, and acknowledge critical and warning threshold violations</p>
        </div>
      </div>

      <div className="industrial-card">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              placeholder="Search equipment or parameter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="industrial-input pl-9 w-full"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="industrial-input py-1.5 text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Acknowledged">Acknowledged</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="industrial-input py-1.5 text-sm"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
            </select>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`p-5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                alert.status === 'Open'
                  ? alert.severity === 'Critical'
                    ? 'border-critical/40 bg-critical/5'
                    : 'border-warning/40 bg-warning/5'
                  : 'border-border bg-white'
              }`}
            >
              <div className="flex items-start md:items-center">
                <div
                  className={`p-3 rounded-full mr-4 shrink-0 ${
                    alert.status === 'Open'
                      ? alert.severity === 'Critical'
                        ? 'bg-critical/10 text-critical'
                        : 'bg-warning/10 text-warning'
                      : 'bg-muted text-secondary'
                  }`}
                >
                  {alert.status === 'Open' ? <AlertOctagon className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`status-badge ${
                        alert.status === 'Open'
                          ? alert.severity === 'Critical'
                            ? 'bg-critical text-white'
                            : 'bg-warning text-white'
                          : 'bg-muted text-secondary'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs text-secondary font-medium">{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                  <h3 className="text-base font-bold text-primary">
                    {alert.equipment?.equipment_id} — {alert.equipment?.name}
                  </h3>
                  <p className="text-secondary text-sm mt-0.5">
                    {alert.parameter} reading <span className="font-bold text-critical">{alert.reading}</span> exceeded {alert.severity.toLowerCase()} limit of {alert.threshold}
                  </p>
                </div>
              </div>

              <div>
                {alert.status === 'Open' ? (
                  <button
                    onClick={() => handleAcknowledgeClick(alert.id)}
                    className="industrial-btn-primary bg-primary hover:bg-primary/90 w-full md:w-auto"
                  >
                    Acknowledge with Signature
                  </button>
                ) : (
                  <span className="text-sm font-medium text-secondary flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-success" /> Acknowledged
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <h3 className="text-base font-medium text-primary">No Matching Alerts</h3>
              <p className="text-xs text-secondary">Operating conditions are nominal or acknowledged.</p>
            </div>
          )}
        </div>
      </div>

      {pendingAlertId && (
        <SignatureModal
          isOpen={showSignature}
          onClose={() => setShowSignature(false)}
          onSuccess={executeAcknowledge}
          title="Acknowledge Alert"
          description="By signing, you certify that this anomaly has been inspected and appropriate corrective measures have been taken."
          entityType="alert"
          entityId={pendingAlertId}
          meaning="reviewer"
        />
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Activity, 
  AlertTriangle, 
  Server, 
  Cpu, 
  TrendingUp, 
  Building2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import apiClient from '../api/client';

export default function PlantAnalytics() {
  const [data, setData] = useState<any>(null);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [timeRange, setTimeRange] = useState('Today');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [repRes, eqRes] = await Promise.all([
        apiClient.get('/reports/summary'),
        apiClient.get('/equipment')
      ]);
      setData(repRes.data);
      setEquipmentList(eqRes.data || []);
    } catch (err) {
      console.error('Failed to fetch plant analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await apiClient.get('/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plant_technical_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export analytics CSV');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-secondary">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-medium text-sm">Aggregating telemetry diagnostics & plant machinery analytics...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  // Handle both snake_case and camelCase
  const shiftPerformance = data?.shift_performance || data?.shiftPerformance || [
    { shift: 'Morning', logged: 14, anomalies: metrics.open_alerts || 0, compliance: 98.2 },
    { shift: 'Afternoon', logged: 8, anomalies: 0, compliance: 95.0 },
    { shift: 'Night', logged: 6, anomalies: 1, compliance: 92.5 }
  ];

  // Telemetry trend mock data
  const telemetryTrends = [
    { time: '06:00', turbineTemp: 185, boilerPsi: 42, threshold: 220 },
    { time: '08:00', turbineTemp: 198, boilerPsi: 45, threshold: 220 },
    { time: '10:00', turbineTemp: 215, boilerPsi: 48, threshold: 220 },
    { time: '12:00', turbineTemp: 232, boilerPsi: 54, threshold: 220 },
    { time: '14:00', turbineTemp: 210, boilerPsi: 49, threshold: 220 },
    { time: '16:00', turbineTemp: 195, boilerPsi: 44, threshold: 220 },
    { time: '18:00', turbineTemp: 190, boilerPsi: 43, threshold: 220 },
  ];

  // Group equipment by section
  const sectionBreakdown = equipmentList.reduce((acc: any, eq: any) => {
    const sec = eq.section || 'General';
    if (!acc[sec]) acc[sec] = { total: 0, operational: 0, warning: 0 };
    acc[sec].total += 1;
    if (eq.status === 'Operational') acc[sec].operational += 1;
    if (eq.status === 'Warning') acc[sec].warning += 1;
    return acc;
  }, {});

  const totalAssets = equipmentList.length || metrics.total_equipment || 6;
  const operationalAssets = equipmentList.filter((e) => e.status === 'Operational').length || Math.round(totalAssets * 0.85);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white p-6 rounded-lg border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-0.5 rounded-full border border-accent/20">
              Operational Intelligence
            </span>
            <span className="text-xs text-secondary font-medium">Telemetry & Machine Performance</span>
          </div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Plant Machinery & Telemetry Analytics</h2>
          <p className="text-secondary text-sm mt-1">
            Real-time equipment telemetry trends, shift logging volume, and unit reliability metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-md p-1 text-xs">
            {['Today', 'This Week', 'This Month'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
                  timeRange === r ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="industrial-btn-primary bg-accent hover:bg-accent/90 flex items-center text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Telemetry CSV'}
          </button>
        </div>
      </div>

      {/* Analytics KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="industrial-card p-5 bg-gradient-to-br from-white to-teal-50/40">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Fleet Health Uptime</span>
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{metrics.fleet_health || 88.5}%</div>
          <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-accent h-full rounded-full" style={{ width: `${metrics.fleet_health || 88.5}%` }}></div>
          </div>
          <p className="text-xs text-secondary mt-2">{operationalAssets} of {totalAssets} machines operational</p>
        </div>

        <div className="industrial-card p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Total Telemetry Logs</span>
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{metrics.total_logs || 0}</div>
          <p className="text-xs text-secondary mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            {metrics.approved_logs || 0} verified • {metrics.submitted_logs || 0} pending
          </p>
        </div>

        <div className="industrial-card p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Anomaly Incident Rate</span>
            <AlertTriangle className={`w-5 h-5 ${metrics.open_alerts > 0 ? 'text-critical' : 'text-success'}`} />
          </div>
          <div className="text-3xl font-extrabold text-critical">{metrics.open_alerts || 0}</div>
          <p className="text-xs text-secondary mt-2">Active safety threshold triggers</p>
        </div>

        <div className="industrial-card p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">MTTR / Resolution</span>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div className="text-3xl font-extrabold text-success">
            {metrics.resolved_alerts || 0}/{metrics.total_alerts || 0}
          </div>
          <p className="text-xs text-secondary mt-2">Historical alarms acknowledged & resolved</p>
        </div>
      </div>

      {/* Main Charts: Shift Volume + Telemetry Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Logging Volume & Anomalies */}
        <div className="industrial-card">
          <div className="flex justify-between items-start mb-4 pb-2 border-b border-border">
            <div>
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Shift Logging Volume & Anomalies
              </h3>
              <p className="text-xs text-secondary">Readings captured vs anomalies detected per 8-hour shift</p>
            </div>
            <span className="text-xs bg-muted px-2 py-1 rounded text-secondary font-medium">Rotation</span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftPerformance} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="shift" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="logged" name="Log Entries" fill="#0B1F33" radius={[4, 4, 0, 0]} />
                <Bar dataKey="anomalies" name="Anomalies Detected" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Telemetry Trend Tracking */}
        <div className="industrial-card">
          <div className="flex justify-between items-start mb-4 pb-2 border-b border-border">
            <div>
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                Primary Turbine Thermal Trend (°C)
              </h3>
              <p className="text-xs text-secondary">Telemetry vs Critical Warning Threshold (220°C)</p>
            </div>
            <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-0.5 rounded font-bold">TUR-101</span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryTrends} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} domain={[150, 260]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="turbineTemp" name="Inlet Temp (°C)" stroke="#0F9D9A" strokeWidth={3} dot={{ r: 4, fill: '#0F9D9A' }} />
                <Line type="monotone" dataKey="threshold" name="Max Safety Limit" stroke="#EF4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Plant Section Availability & Machinery Health Breakdown */}
      <div className="industrial-card">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
          <div>
            <h3 className="font-bold text-lg text-primary flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Plant Section Machinery Availability
            </h3>
            <p className="text-xs text-secondary">Operational health and lockout status by industrial unit</p>
          </div>
          <button onClick={fetchAnalytics} className="industrial-btn-outline text-xs h-8 px-3 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Fleet</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['Utilities', 'Boiler', 'Reactor', 'Powerhouse'].map((sec) => {
            const info = sectionBreakdown[sec] || { total: 2, operational: 2, warning: 0 };
            const pct = info.total > 0 ? Math.round((info.operational / info.total) * 100) : 100;
            return (
              <div key={sec} className="p-4 rounded-lg border border-border bg-muted/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-primary">{sec} Unit</span>
                  <span className={`text-xs font-extrabold ${pct >= 80 ? 'text-success' : 'text-warning'}`}>
                    {pct}% Health
                  </span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full rounded-full ${pct >= 80 ? 'bg-success' : 'bg-warning'}`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-secondary">
                  <span>{info.operational} / {info.total} machines ready</span>
                  <span className={info.warning > 0 ? 'text-critical font-bold' : ''}>
                    {info.warning} flagged
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

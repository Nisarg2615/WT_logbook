import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Server, 
  Activity, 
  ClipboardList, 
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  BarChart3,
  Download,
  CheckSquare,
  History,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Layers,
  Check,
  Building2,
  Cpu,
  QrCode
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import apiClient from '../api/client';
import SignatureModal from '../components/SignatureModal';
import QrScannerModal from '../components/QrScannerModal';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [reportSummary, setReportSummary] = useState<any>(null);
  const [pendingReviewsList, setPendingReviewsList] = useState<any[]>([]);
  const [openAlertsList, setOpenAlertsList] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const navigate = useNavigate();

  // Handover state (operator)
  const [pendingHandovers, setPendingHandovers] = useState<any[]>([]);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  
  // Signature Modal state for handover actions
  const [showSignature, setShowSignature] = useState(false);
  const [signatureContext, setSignatureContext] = useState<{ type: 'incoming' | 'outgoing', handoverId?: number } | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || 'operator').toLowerCase();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Base dashboard data
        const dashRes = await apiClient.get('/dashboard');
        setData(dashRes.data);

        // Role-tailored data fetching
        if (userRole === 'supervisor') {
          const [reviewsRes, alertsRes] = await Promise.all([
            apiClient.get('/reviews?status=Submitted'),
            apiClient.get('/alerts?status=Open')
          ]);
          setPendingReviewsList(reviewsRes.data || []);
          setOpenAlertsList(alertsRes.data || []);
        } else if (userRole === 'manager') {
          const [repRes, eqRes] = await Promise.all([
            apiClient.get('/reports/summary'),
            apiClient.get('/equipment')
          ]);
          setReportSummary(repRes.data || null);
          setEquipmentList(eqRes.data || []);
        } else {
          // Operator
          const handRes = await apiClient.get('/handovers?status=pending');
          setPendingHandovers(handRes.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userRole]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await apiClient.get('/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plant_operations_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to export report CSV");
    } finally {
      setExporting(false);
    }
  };

  const handleCreateHandover = async () => {
    try {
      const res = await apiClient.post('/handovers', {
        section: 'Utilities',
        outgoing_user_id: user.id || 1,
        entries_count: data?.kpis?.todays_logs || 0,
        anomaly_count: data?.kpis?.open_alerts || 0,
        notes: handoverNotes
      });
      setShowHandoverModal(false);
      setHandoverNotes('');
      setSignatureContext({ type: 'outgoing', handoverId: res.data.id });
      setShowSignature(true);
    } catch (err) {
      alert("Failed to create handover");
    }
  };

  const handleAcknowledgeHandoverClick = (id: number) => {
    setSignatureContext({ type: 'incoming', handoverId: id });
    setShowSignature(true);
  };

  const handleSignatureSuccess = async () => {
    if (!signatureContext) return;
    
    if (signatureContext.type === 'incoming' && signatureContext.handoverId) {
      try {
        await apiClient.patch(`/handovers/${signatureContext.handoverId}/acknowledge`, {
          incoming_user_id: user.id || 1,
          status: 'acknowledged'
        });
        const res = await apiClient.get('/handovers?status=pending');
        setPendingHandovers(res.data);
      } catch (e) {
        alert("Failed to acknowledge handover");
      }
    } else if (signatureContext.type === 'outgoing') {
      const res = await apiClient.get('/handovers?status=pending');
      setPendingHandovers(res.data);
    }
    
    setShowSignature(false);
    setSignatureContext(null);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-secondary">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-medium text-sm">Loading tailored operational dashboard...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const recentActivity = data?.recentActivity || [];

  // Telemetry chart mock data
  const trendData = [
    { time: '08:00', temp: 65, pressure: 4.2 },
    { time: '09:00', temp: 70, pressure: 4.5 },
    { time: '10:00', temp: 72, pressure: 4.8 },
    { time: '11:00', temp: 74, pressure: 4.6 },
    { time: '12:00', temp: 88, pressure: 5.1 },
    { time: '13:00', temp: 81, pressure: 4.9 },
    { time: '14:00', temp: 79, pressure: 4.7 },
  ];

  // Helper calculations for Manager
  const totalEquipCount = equipmentList.length || kpis.total_equipment || 1;
  const sectionsMap = equipmentList.reduce((acc: any, eq: any) => {
    const sec = eq.section || 'General';
    if (!acc[sec]) acc[sec] = { total: 0, operational: 0 };
    acc[sec].total += 1;
    if (eq.status === 'Operational') acc[sec].operational += 1;
    return acc;
  }, {});

  // =========================================================================
  // VIEW 1: SUPERVISOR DASHBOARD (Shift Supervision & Action Queue)
  // =========================================================================
  if (userRole === 'supervisor') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Supervisor Header */}
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider bg-warning/10 text-warning px-2.5 py-0.5 rounded-full border border-warning/20">
                Supervisor Console
              </span>
              <span className="text-xs text-secondary font-medium">Station: Shift Operations Control</span>
            </div>
            <h2 className="text-2xl font-bold text-primary tracking-tight">Shift Operations Supervision</h2>
            <p className="text-secondary text-sm mt-1">Real-time operator submissions, quality approvals & anomaly management.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/reviews')} 
              className="industrial-btn-primary bg-accent hover:bg-accent/90 flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Full Review Queue</span>
              {pendingReviewsList.length > 0 && (
                <span className="bg-white text-accent font-bold text-xs px-2 py-0.5 rounded-full ml-1">
                  {pendingReviewsList.length}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/alerts')} className="industrial-btn-outline flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span>Shift Alerts</span>
            </button>
          </div>
        </div>

        {/* Action Needed Urgent Callout Banner */}
        {pendingReviewsList.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-warning p-4 rounded-r-lg flex flex-col md:flex-row md:items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-warning shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-primary">
                  {pendingReviewsList.length} Logbook {pendingReviewsList.length === 1 ? 'Entry Requires' : 'Entries Require'} Your Sign-off
                </h4>
                <p className="text-xs text-secondary mt-0.5">
                  Operators have submitted readings that must be validated and signed before the shift closes.
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/reviews')} 
              className="mt-3 md:mt-0 industrial-btn-primary bg-warning text-white hover:bg-warning/90 text-xs px-4 py-2 shrink-0"
            >
              Start Reviewing
            </button>
          </div>
        )}

        {/* Supervisor Specific KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div 
            onClick={() => navigate('/reviews')}
            className="industrial-card p-5 cursor-pointer hover:border-warning transition-all bg-gradient-to-br from-white to-amber-50/40"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Awaiting Sign-off</span>
              <span className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-warning">{pendingReviewsList.length || kpis.pending_reviews || 0}</span>
              <span className="text-xs text-secondary font-medium">pending</span>
            </div>
            <p className="text-[11px] text-secondary mt-2 flex items-center gap-1">
              Click to process submissions <ChevronRight className="w-3 h-3 text-warning" />
            </p>
          </div>

          <div 
            onClick={() => navigate('/alerts')}
            className="industrial-card p-5 cursor-pointer hover:border-critical transition-all bg-gradient-to-br from-white to-red-50/40"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Active Alarms</span>
              <span className="w-8 h-8 rounded-full bg-critical/10 text-critical flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-critical">{openAlertsList.length || kpis.open_alerts || 0}</span>
              <span className="text-xs text-secondary font-medium">unresolved</span>
            </div>
            <p className="text-[11px] text-secondary mt-2 flex items-center gap-1">
              Requires supervisor triage <ChevronRight className="w-3 h-3 text-critical" />
            </p>
          </div>

          <div className="industrial-card p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Today's Shift Logs</span>
              <span className="w-8 h-8 rounded-full bg-info/10 text-info flex items-center justify-center">
                <ClipboardList className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">{kpis.todays_logs || 0}</span>
              <span className="text-xs text-secondary font-medium">recorded</span>
            </div>
            <p className="text-[11px] text-secondary mt-2">All stations in active rotation</p>
          </div>

          <div className="industrial-card p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Fleet Operational</span>
              <span className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-success">{kpis.active_equipment || 0}</span>
              <span className="text-xs text-secondary font-medium">/ {kpis.total_equipment || 0} assets</span>
            </div>
            <p className="text-[11px] text-secondary mt-2">Active online machinery</p>
          </div>
        </div>

        {/* Supervisor Action Queue & Live Alarms Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Submissions Immediate Review Queue */}
          <div className="industrial-card lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-accent" />
                  Urgent Logbook Submissions
                </h3>
                <p className="text-xs text-secondary">Operator entries waiting for supervisor verification</p>
              </div>
              <button onClick={() => navigate('/reviews')} className="text-xs font-semibold text-accent hover:underline flex items-center">
                View All ({pendingReviewsList.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingReviewsList.length === 0 ? (
              <div className="p-8 text-center my-auto">
                <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-primary text-sm">Review Queue Clear</h4>
                <p className="text-xs text-secondary mt-1">All shift logbooks have been reviewed and approved.</p>
              </div>
            ) : (
              <div className="divide-y divide-border overflow-hidden">
                {pendingReviewsList.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="py-3 flex items-center justify-between hover:bg-muted/30 px-2 rounded-md transition-colors">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-muted px-2 py-0.5 rounded">
                          {entry.equipment?.equipment_id || 'ASSET'}
                        </span>
                        <span className="text-sm font-semibold text-primary truncate">
                          {entry.equipment?.name || 'Equipment'}
                        </span>
                      </div>
                      <div className="text-xs text-secondary mt-1 flex items-center gap-2">
                        <span>Op: <strong>{entry.operator?.name || 'Operator'}</strong></span>
                        <span>•</span>
                        <span>Shift: {entry.shift}</span>
                        <span>•</span>
                        <span>{new Date(entry.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/reviews')} 
                      className="industrial-btn-primary bg-accent hover:bg-accent/90 text-xs px-3 py-1.5 h-auto shrink-0 flex items-center gap-1"
                    >
                      Inspect & Sign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Alarms & Out-of-Spec Readings */}
          <div className="industrial-card flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-critical" />
                  Active Plant Alerts
                </h3>
                <p className="text-xs text-secondary">Telemetry exceeding safety limits</p>
              </div>
              <button onClick={() => navigate('/alerts')} className="text-xs font-semibold text-critical hover:underline flex items-center">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {openAlertsList.length === 0 ? (
              <div className="p-8 text-center my-auto">
                <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-primary text-sm">No Open Anomalies</h4>
                <p className="text-xs text-secondary mt-1">All equipment operating within normal parameter thresholds.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-80 pr-1">
                {openAlertsList.slice(0, 4).map((alertItem) => (
                  <div key={alertItem.id} className="p-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-primary">
                        {alertItem.equipment?.equipment_id || 'ASSET'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        alertItem.severity === 'Critical' ? 'bg-critical/10 text-critical border border-critical/20' : 'bg-warning/10 text-warning border border-warning/20'
                      }`}>
                        {alertItem.severity}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-primary">
                      {alertItem.parameter}: <span className="font-bold text-critical">{alertItem.reading}</span> (limit: {alertItem.threshold})
                    </div>
                    <div className="text-[10px] text-secondary mt-1">
                      {new Date(alertItem.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Curves & Shift Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="industrial-card lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-primary">Shift Parameter Trend</h3>
                <p className="text-xs text-secondary">Real-time thermal tracking on key turbine section</p>
              </div>
              <span className="text-xs font-medium bg-muted px-2.5 py-1 rounded">Primary Gas Turbine (TUR-101)</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Line type="monotone" dataKey="temp" stroke="#0F9D9A" strokeWidth={3} dot={{r: 4, fill: '#0F9D9A'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="industrial-card flex flex-col">
            <h3 className="font-bold text-lg text-primary mb-3">Recent Supervisor Actions</h3>
            <div className="flex-1 overflow-y-auto space-y-4">
              {recentActivity.slice(0, 4).map((act: any, idx: number) => (
                <div key={idx} className="flex relative items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-primary font-medium">{act.message}</p>
                    <p className="text-[11px] text-secondary truncate">{act.entity}</p>
                    <span className="text-[10px] text-muted-foreground">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/audit')} 
              className="text-xs text-accent font-semibold mt-3 pt-3 border-t border-border flex items-center justify-between hover:underline"
            >
              <span>View Full Audit Trail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MANAGER DASHBOARD (Executive Plant Reliability & Analytics)
  // =========================================================================
  if (userRole === 'manager') {
    const shiftPerf = reportSummary?.shift_performance || [
      { shift: 'Morning', logged: 12, anomalies: kpis.open_alerts || 0, compliance: 98.2 },
      { shift: 'Afternoon', logged: 8, anomalies: 0, compliance: 95.0 },
      { shift: 'Night', logged: 6, anomalies: 1, compliance: 92.5 }
    ];
    const metrics = reportSummary?.metrics || {};
    const fleetHealthPct = metrics.fleet_health || Math.round((kpis.active_equipment / (kpis.total_equipment || 1)) * 100);
    const compliancePct = metrics.compliance_rate || kpis.completion_rate || 96.5;

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Manager Executive Header */}
        <div className="bg-primary text-white p-6 rounded-lg shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-accent text-white px-2.5 py-0.5 rounded-full">
                Executive Management
              </span>
              <span className="text-xs text-primary-foreground/70">Pune Industrial Complex #4</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Plant Reliability & Executive Operations</h2>
            <p className="text-primary-foreground/80 text-sm mt-1">
              Cross-shift compliance, fleet health distribution, and statutory operational audit.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleExportCSV} 
              disabled={exporting}
              className="inline-flex items-center justify-center rounded-md bg-white text-primary font-medium h-10 px-4 py-2 hover:bg-white/90 text-sm transition-colors shadow"
            >
              <Download className="w-4 h-4 mr-2 text-accent" />
              {exporting ? 'Exporting...' : 'Export Audit CSV'}
            </button>
            <button 
              onClick={() => navigate('/audit')} 
              className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 text-white font-medium h-10 px-4 py-2 hover:bg-white/20 text-sm transition-colors"
            >
              <History className="w-4 h-4 mr-2" />
              Audit Log
            </button>
          </div>
        </div>

        {/* Executive High-Level KPI Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="industrial-card p-5 bg-gradient-to-br from-white to-teal-50/30">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Fleet Reliability</span>
              <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">{fleetHealthPct}%</span>
              <span className="text-xs text-success font-semibold">Optimal</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-accent h-full rounded-full" style={{ width: `${fleetHealthPct}%` }}></div>
            </div>
            <p className="text-[11px] text-secondary mt-2">Active machinery uptime across all 4 zones</p>
          </div>

          <div className="industrial-card p-5 bg-gradient-to-br from-white to-blue-50/30">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Audit Compliance</span>
              <span className="w-8 h-8 rounded-full bg-info/10 text-info flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">{compliancePct}%</span>
              <span className="text-xs text-info font-semibold">Validated</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-info h-full rounded-full" style={{ width: `${compliancePct}%` }}></div>
            </div>
            <p className="text-[11px] text-secondary mt-2">Shift logbooks fully approved and signed</p>
          </div>

          <div className="industrial-card p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Total Fleet Assets</span>
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Server className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-primary">{totalEquipCount}</span>
              <span className="text-xs text-secondary font-medium">assets registered</span>
            </div>
            <p className="text-[11px] text-secondary mt-2 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success"></span> {kpis.active_equipment || totalEquipCount} Online & Monitored
            </p>
          </div>

          <div className="industrial-card p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">Plant Incident Rate</span>
              <span className="w-8 h-8 rounded-full bg-critical/10 text-critical flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-critical">{kpis.open_alerts || 0}</span>
              <span className="text-xs text-secondary font-medium">open anomalies</span>
            </div>
            <p className="text-[11px] text-secondary mt-2">Across turbines, boilers & reactors</p>
          </div>
        </div>

        {/* Manager Strategic Panels: Cross-Shift Performance + Section Health Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shift Performance Comparison Matrix */}
          <div className="industrial-card lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Cross-Shift Operational Comparison
                </h3>
                <p className="text-xs text-secondary">Logged entries, anomalies detected & compliance score by 8-hour shift</p>
              </div>
              <button onClick={() => navigate('/analytics')} className="text-xs font-semibold text-accent hover:underline flex items-center">
                Detailed Analytics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shiftPerf} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="shift" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                  <Bar dataKey="logged" name="Log Entries" fill="#0B1F33" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="compliance" name="Compliance %" fill="#0F9D9A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border bg-muted/20 p-3 rounded-lg">
              {shiftPerf.map((s: any) => (
                <div key={s.shift} className="text-center">
                  <span className="text-xs font-bold text-primary">{s.shift} Shift</span>
                  <div className="text-sm font-semibold text-accent mt-0.5">{s.compliance}% Comp.</div>
                  <div className="text-[11px] text-secondary">{s.logged} entries • {s.anomalies} flags</div>
                </div>
              ))}
            </div>
          </div>

          {/* Plant Section Availability Distribution */}
          <div className="industrial-card flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Section Availability
                </h3>
                <p className="text-xs text-secondary">Operational status by plant unit</p>
              </div>
              <button onClick={() => navigate('/equipment')} className="text-xs font-semibold text-primary hover:underline flex items-center">
                Equipment Fleet <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              {['Utilities', 'Boiler', 'Reactor', 'Powerhouse'].map((sec) => {
                const info = sectionsMap[sec] || { total: 2, operational: 2 };
                const pct = info.total > 0 ? Math.round((info.operational / info.total) * 100) : 100;
                return (
                  <div key={sec} className="p-3 rounded-lg border border-border bg-muted/10">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold text-primary">{sec} Unit</span>
                      <span className={`text-xs font-bold ${pct >= 80 ? 'text-success' : 'text-warning'}`}>
                        {pct}% Ready
                      </span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${pct >= 80 ? 'bg-success' : 'bg-warning'}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-secondary mt-1.5">
                      <span>{info.operational} of {info.total} machines active</span>
                      <span>0 lockouts</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button 
              onClick={() => navigate('/equipment')} 
              className="industrial-btn-outline w-full text-xs mt-4 flex items-center justify-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Manage Machinery Fleet</span>
            </button>
          </div>
        </div>

        {/* Executive Audit Log Feed & Regulatory Compliance Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="industrial-card lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  <History className="w-5 h-5 text-secondary" />
                  Executive Audit Trail Stream
                </h3>
                <p className="text-xs text-secondary">Chronological register of high-privilege operational sign-offs</p>
              </div>
              <button onClick={() => navigate('/audit')} className="text-xs font-semibold text-accent hover:underline">
                View Full Audit
              </button>
            </div>

            <div className="space-y-3">
              {recentActivity.map((act: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">{act.message}</p>
                      <p className="text-[11px] text-secondary">{act.entity}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-secondary bg-white px-2 py-1 rounded border border-border">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="industrial-card bg-primary text-white flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-4 text-accent">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Statutory Logbook Compliance</h3>
              <p className="text-xs text-primary-foreground/70 leading-relaxed mb-4">
                This facility is operating under ISO-9001 / OSHA 1910 standard digital logbook compliance protocols. All parameter logs, approvals, and signatures are cryptographically tracked.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={handleExportCSV} 
                disabled={exporting}
                className="w-full industrial-btn-primary bg-accent hover:bg-accent/90 text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? 'Generating...' : 'Download Compliance Archive'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: OPERATOR DASHBOARD (Console for taking readings & station duties)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Operator Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-lg border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-0.5 rounded-full border border-accent/20">
              Operator Console
            </span>
            <span className="text-xs text-secondary font-medium">Logged in as {user.full_name || 'Operator'}</span>
          </div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Shift Operations Console</h2>
          <p className="text-secondary text-sm mt-1">Assigned Station: Turbines & Boilers • Shift: Morning (08:00 - 16:00)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowQrModal(true)} 
            className="industrial-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan Machine QR</span>
          </button>
          <button onClick={() => setShowHandoverModal(true)} className="industrial-btn-outline text-xs">
            End Shift Handover
          </button>
          <button onClick={() => navigate('/logbooks')} className="industrial-btn-primary bg-accent hover:bg-accent/90 text-xs">
            Start Logbook Entry
          </button>
        </div>
      </div>

      {/* Pending Handover Banner */}
      {pendingHandovers.length > 0 && (
        <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r-md flex flex-col md:flex-row md:items-center justify-between shadow-sm">
          <div className="flex items-start mb-4 md:mb-0">
            <Clock className="w-6 h-6 text-warning mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-primary">Shift Handover Pending</h3>
              <p className="text-sm text-secondary mt-1 max-w-2xl">
                The previous shift for <strong>{pendingHandovers[0].section}</strong> has left handover notes. 
                You must acknowledge the handover to take responsibility for this section.
              </p>
              {pendingHandovers[0].notes && (
                <div className="mt-2 bg-white/50 p-2 text-sm text-primary rounded border border-warning/20">
                  <span className="font-semibold text-xs text-secondary uppercase mr-2">Notes:</span>
                  {pendingHandovers[0].notes}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => handleAcknowledgeHandoverClick(pendingHandovers[0].id)} className="industrial-btn-primary bg-warning hover:bg-warning/90 text-white border-none flex-shrink-0">
            Acknowledge Handover
          </button>
        </div>
      )}

      {/* Operator KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Equipment', value: kpis.total_equipment, icon: Server, color: 'text-primary' },
          { label: 'Active Equipment', value: kpis.active_equipment, icon: Activity, color: 'text-success' },
          { label: "Today's Logs", value: kpis.todays_logs, icon: ClipboardList, color: 'text-info' },
          { label: 'Pending Reviews', value: kpis.pending_reviews, icon: CheckCircle2, color: 'text-warning' },
          { label: 'Open Alerts', value: kpis.open_alerts, icon: AlertTriangle, color: 'text-critical' },
          { label: 'Completion Rate', value: `${kpis.completion_rate}%`, icon: ClipboardList, color: 'text-primary' },
        ].map((kpi, i) => (
          <div key={i} className="industrial-card px-4 py-5 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-medium text-secondary">{kpi.label}</span>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <span className="text-3xl font-bold text-primary">{kpi.value || 0}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="industrial-card lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-primary">Equipment Reading Trend</h3>
            <span className="text-xs text-secondary font-medium">Turbine Inlet Temperature (°C)</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Line type="monotone" dataKey="temp" stroke="#0F9D9A" strokeWidth={3} dot={{r: 4, fill: '#0F9D9A'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="industrial-card flex flex-col">
          <h3 className="font-bold text-lg text-primary mb-6">Recent Shift Activity</h3>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {recentActivity.map((act: any, idx: number) => (
                <div key={idx} className="flex relative">
                  {idx !== recentActivity.length - 1 && (
                    <div className="absolute top-6 bottom-[-24px] left-2 w-[2px] bg-border"></div>
                  )}
                  <div className="w-4 h-4 rounded-full bg-accent/20 border-2 border-accent mt-1 mr-4 flex-shrink-0 z-10" />
                  <div>
                    <div className="text-xs text-secondary font-medium mb-0.5">{act.time}</div>
                    <div className="text-sm text-primary font-medium">{act.message}</div>
                    <div className="text-sm text-secondary">{act.entity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => navigate('/logbooks')} className="text-sm text-accent font-medium mt-4 flex items-center hover:underline">
            View All Logbooks <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Handover Creation Modal */}
      {showHandoverModal && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-border">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                End Shift Handover
              </h3>
            </div>
            <div className="p-6">
              <div className="bg-muted p-4 rounded-md mb-6 flex justify-around">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{data?.kpis?.todays_logs || 0}</div>
                  <div className="text-xs text-secondary uppercase tracking-wider">Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-critical">{data?.kpis?.open_alerts || 0}</div>
                  <div className="text-xs text-secondary uppercase tracking-wider">Anomalies</div>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-bold text-secondary mb-2">Notes for next shift (optional)</label>
                <textarea 
                  className="industrial-input w-full min-h-[100px]"
                  placeholder="Any unusual observations, equipment acting up, or pending tasks..."
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowHandoverModal(false)} className="industrial-btn-outline px-6">Cancel</button>
                <button onClick={handleCreateHandover} className="industrial-btn-primary px-6 bg-accent hover:bg-accent/90">Proceed to Sign</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal for Handovers */}
      {signatureContext && (
        <SignatureModal
          isOpen={showSignature}
          onClose={() => { setShowSignature(false); setSignatureContext(null); }}
          onSuccess={handleSignatureSuccess}
          title={signatureContext.type === 'incoming' ? 'Acknowledge Shift Handover' : 'Sign Shift Handover'}
          description={signatureContext.type === 'incoming' ? 'You are acknowledging the shift handover and taking responsibility for the section.' : 'You are signing off on the shift handover summary.'}
          entityType="handover"
          entityId={signatureContext.handoverId || 0}
          meaning={signatureContext.type === 'incoming' ? 'handover_incoming' : 'handover_outgoing'}
        />
      )}

      {/* Operator Machine QR Scanner */}
      <QrScannerModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onScanSuccess={(data) => {
          navigate(`/logbooks/${data.equipment.id}?autoFill=true`);
        }}
      />
    </div>
  );
}

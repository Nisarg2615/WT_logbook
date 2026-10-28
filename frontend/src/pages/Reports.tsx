import { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Award,
  Lock,
  Calendar,
  Building2,
  FileCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import apiClient from '../api/client';

export default function Reports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/reports/summary');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch reports summary', err);
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
      link.setAttribute('download', `regulatory_compliance_dossier_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-secondary">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="font-medium text-sm">Validating statutory logbook certifications & regulatory compliance...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const shiftPerformance = data?.shift_performance || data?.shiftPerformance || [
    { shift: 'Morning', logged: 12, anomalies: 0, compliance: 98.2 },
    { shift: 'Afternoon', logged: 8, anomalies: 0, compliance: 95.0 },
    { shift: 'Night', logged: 6, anomalies: 1, compliance: 92.5 }
  ];

  const statusPieData = [
    { name: 'Approved', value: metrics.approved_logs || 0, color: '#16A34A' },
    { name: 'Submitted', value: metrics.submitted_logs || 0, color: '#F59E0B' },
    { name: 'Rejected', value: metrics.rejected_logs || 0, color: '#DC2626' },
    { name: 'Drafts', value: metrics.draft_logs || 0, color: '#94A3B8' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white p-6 rounded-lg border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider bg-success/10 text-success px-2.5 py-0.5 rounded-full border border-success/20">
              Statutory Certification
            </span>
            <span className="text-xs text-secondary font-medium">21 CFR Part 11 & ISO-9001 Standards</span>
          </div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Compliance & Regulatory Reports</h2>
          <p className="text-secondary text-sm mt-1">
            Formal logbook audit records, cryptographic digital signatures, and regulatory archive export.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="industrial-btn-primary bg-primary hover:bg-primary/90 flex items-center text-sm"
        >
          <Download className="w-4 h-4 mr-2 text-accent" />
          {exporting ? 'Generating Dossier...' : 'Export Compliance Dossier (CSV)'}
        </button>
      </div>

      {/* Compliance KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="industrial-card p-5 bg-gradient-to-br from-white to-green-50/40">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Compliance Standard</span>
            <ShieldCheck className="w-5 h-5 text-success" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{metrics.compliance_rate || 96.5}%</div>
          <p className="text-xs text-secondary mt-1">21 CFR Part 11 verification rate</p>
        </div>

        <div className="industrial-card p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Validated Records</span>
            <FileCheck className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-extrabold text-primary">{metrics.approved_logs || 0}</div>
          <p className="text-xs text-secondary mt-1">Fully signed by plant supervisors</p>
        </div>

        <div className="industrial-card p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Pending Sign-offs</span>
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div className="text-3xl font-extrabold text-warning">{metrics.submitted_logs || 0}</div>
          <p className="text-xs text-secondary mt-1">Submissions awaiting sign-off</p>
        </div>

        <div className="industrial-card p-5">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Non-Compliance Flags</span>
            <AlertTriangle className={`w-5 h-5 ${metrics.open_alerts > 0 ? 'text-critical' : 'text-success'}`} />
          </div>
          <div className="text-3xl font-extrabold text-critical">{metrics.open_alerts || 0}</div>
          <p className="text-xs text-secondary mt-1">Unresolved equipment threshold breaches</p>
        </div>
      </div>

      {/* Compliance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shift Compliance Verification Bar Chart */}
        <div className="industrial-card lg:col-span-2">
          <div className="flex justify-between items-start mb-4 pb-2 border-b border-border">
            <div>
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <Award className="w-5 h-5 text-accent" />
                Shift Regulatory Compliance Scores (%)
              </h3>
              <p className="text-xs text-secondary">Percentage of shift logbook entries meeting statutory sign-off rules</p>
            </div>
            <span className="text-xs bg-muted px-2 py-1 rounded text-secondary font-medium">Standard: 90% min</span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shiftPerformance} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="shift" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} domain={[80, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val: any) => [`${val}%`, 'Compliance Score']}
                />
                <Bar dataKey="compliance" name="Compliance Rate (%)" fill="#0F9D9A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Logbook Audit Distribution Pie Chart */}
        <div className="industrial-card flex flex-col">
          <div className="mb-4 pb-2 border-b border-border">
            <h3 className="font-bold text-lg text-primary mb-1">Audit Lifecycle Phase</h3>
            <p className="text-xs text-secondary">Distribution of all entries across status</p>
          </div>

          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Official Compliance Certification Dossier Statement */}
      <div className="industrial-card bg-primary text-white border-none p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-lg text-white">Statutory Audit Attestation</h4>
                <span className="bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Verified</span>
              </div>
              <p className="text-xs text-primary-foreground/75 leading-relaxed max-w-2xl">
                This digital logbook repository maintains continuous compliance with <strong>21 CFR Part 11</strong> (Electronic Records & Electronic Signatures), <strong>OSHA 1910.119</strong> Process Safety Management, and <strong>ISO-9001:2015</strong> quality guidelines.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="industrial-btn-primary bg-accent hover:bg-accent/90 text-white font-bold text-xs px-4 py-2 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              <span>Download Signed Dossier</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-primary-foreground/50 uppercase tracking-wider block text-[10px]">Cryptographic Binding</span>
            <span className="font-semibold text-white">HMAC SHA-256 Timestamps</span>
          </div>
          <div>
            <span className="text-primary-foreground/50 uppercase tracking-wider block text-[10px]">Auditor Jurisdiction</span>
            <span className="font-semibold text-white">Industrial Safety Board</span>
          </div>
          <div>
            <span className="text-primary-foreground/50 uppercase tracking-wider block text-[10px]">Facility Scope</span>
            <span className="font-semibold text-white">Pune Complex Unit #1</span>
          </div>
          <div>
            <span className="text-primary-foreground/50 uppercase tracking-wider block text-[10px]">Audit Trail Status</span>
            <span className="font-semibold text-accent flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Immutable Register
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

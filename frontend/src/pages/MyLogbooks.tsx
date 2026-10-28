import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  ArrowRight, 
  Clock, 
  Search, 
  Filter, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  QrCode,
  Camera
} from 'lucide-react';
import apiClient from '../api/client';
import QrScannerModal from '../components/QrScannerModal';

export default function MyLogbooks() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || 'operator').toLowerCase();
  const isOperator = userRole === 'operator';

  const [activeTab, setActiveTab] = useState<'create' | 'history'>(isOperator ? 'create' : 'history');
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [logbooks, setLogbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showQrModal, setShowQrModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eqRes, logRes] = await Promise.all([
        apiClient.get('/equipment'),
        apiClient.get(`/logbooks${statusFilter !== 'All' ? `?status=${statusFilter}` : ''}`)
      ]);
      setEquipmentList(eqRes.data);
      setLogbooks(logRes.data);
    } catch (err) {
      console.error('Failed to fetch logbooks data', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogbooks = logbooks.filter((log) => {
    const matchesSearch =
      (log.equipment?.name && log.equipment.name.toLowerCase().includes(search.toLowerCase())) ||
      (log.equipment?.equipment_id && log.equipment.equipment_id.toLowerCase().includes(search.toLowerCase())) ||
      (log.shift && log.shift.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isOperator 
                ? 'bg-accent/10 text-accent border-accent/20' 
                : userRole === 'supervisor' 
                ? 'bg-warning/10 text-warning border-warning/20' 
                : 'bg-primary/10 text-primary border-primary/20'
            }`}>
              {isOperator ? 'Field Operator Mode' : userRole === 'supervisor' ? 'Supervisor Verification Mode' : 'Executive Audit Mode'}
            </span>
            {!isOperator && (
              <span className="text-xs text-secondary italic">Form filling restricted to Field Operators</span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">
            {isOperator ? 'Operator Shift Logbooks' : userRole === 'supervisor' ? 'Verified Logbook Register' : 'Plant Logbook Repository'}
          </h2>
          <p className="text-secondary mt-1">
            {isOperator 
              ? 'Record parameters, save shift drafts, or submit logs for supervisor sign-off.' 
              : userRole === 'supervisor'
              ? 'Read-only inspection of operator parameter submissions and historical shift records.'
              : 'Plant-wide historical logbook records for compliance verification and audit trail.'}
          </p>
        </div>

        {/* Tab Switcher - Only for Field Operators */}
        {isOperator ? (
          <div className="bg-muted p-1 rounded-lg flex space-x-1 border border-border">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Start New Log
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Log Entries & Drafts ({logbooks.length})
            </button>
          </div>
        ) : (
          <div className="text-xs text-secondary bg-white px-3.5 py-2 rounded-lg font-semibold border border-border shadow-sm">
            Total Plant Records: <span className="text-primary font-bold">{logbooks.length}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-secondary">Loading logbook data...</div>
      ) : activeTab === 'create' ? (
        /* Create New Logbook Tab (Equipment Fleet Grid) */
        <div className="space-y-6">
          {/* Quick QR Telemetry Scan Hero Card */}
          <div className="bg-gradient-to-r from-emerald-950 via-primary to-primary text-white p-5 rounded-xl shadow-md border border-emerald-600/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-white">Direct Machine QR Telemetry Scan</h4>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                    Auto-Fill Enabled
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-1 max-w-xl">
                  Scan the physical QR code mounted on the machinery chassis to automatically identify the machine and pre-populate calibrated sensor readings.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowQrModal(true)}
              className="industrial-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 shadow-md flex items-center gap-2 shrink-0 transition-transform active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Machine QR</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {equipmentList.map((eq: any) => (
            <div
              key={eq.id}
              className="industrial-card hover:border-accent hover:shadow-lg transition-all flex flex-col h-full cursor-pointer group"
              onClick={() => navigate(`/logbooks/${eq.id}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/5 p-3 rounded-lg group-hover:bg-accent/10 transition-colors">
                  <ClipboardList className="w-6 h-6 text-primary group-hover:text-accent transition-colors" />
                </div>
                <span
                  className={`status-badge ${
                    eq.status === 'Operational'
                      ? 'bg-success/10 text-success'
                      : eq.status === 'Warning'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-critical/10 text-critical'
                  }`}
                >
                  {eq.status}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg text-primary">{eq.name}</h3>
                <p className="text-sm font-medium text-secondary mb-3">{eq.equipment_id} • {eq.section}</p>

                <div className="text-xs text-secondary/80 flex items-center mb-1">
                  <Clock className="w-3.5 h-3.5 mr-1.5" /> Shift Equipment Routine
                </div>
                <div className="text-xs text-secondary/80">
                  {eq.parameters?.length || 0} parameter checkpoints
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-sm font-medium text-accent">
                <span>Begin Entry</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
      ) : (
        /* History & Drafts Tab */
        <div className="industrial-card space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="Search equipment or shift..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="industrial-input pl-9 w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-secondary" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="industrial-input py-1.5 text-sm"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Drafts (In Progress)</option>
                <option value="Submitted">Submitted (Under Review)</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Asset</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Shift / Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Logged By</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Supervisor Feedback</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogbooks.map((item) => (
                  <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-sm text-primary">{item.equipment?.equipment_id}</div>
                      <div className="text-xs text-secondary">{item.equipment?.name}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-secondary">
                      <div className="font-medium text-primary">{item.shift} Shift</div>
                      <div>{new Date(item.recorded_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-secondary">
                      {item.operator?.name || `Operator #${item.operator_id}`}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`status-badge ${
                          item.status === 'Draft'
                            ? 'bg-slate-200 text-slate-700'
                            : item.status === 'Submitted'
                            ? 'bg-warning/10 text-warning'
                            : item.status === 'Approved'
                            ? 'bg-success/10 text-success'
                            : 'bg-critical/10 text-critical'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-secondary max-w-xs truncate">
                      {item.supervisor_comments ? (
                        <span className="text-primary italic">"{item.supervisor_comments}"</span>
                      ) : (
                        <span className="text-secondary/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {isOperator && item.status === 'Draft' ? (
                        <button
                          onClick={() => navigate(`/logbooks/${item.equipment_id}?draftId=${item.id}`)}
                          className="text-xs font-bold text-accent hover:underline flex items-center justify-end ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" /> Resume Draft
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/logbooks/${item.equipment_id}?viewId=${item.id}`)}
                          className="text-xs text-secondary hover:text-primary font-medium"
                        >
                          View Readings
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredLogbooks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-secondary text-sm">
                      No logbook records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QR Scanner Modal for Operators */}
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

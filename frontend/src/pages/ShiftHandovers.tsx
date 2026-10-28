import { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  UserCheck
} from 'lucide-react';
import apiClient from '../api/client';
import SignatureModal from '../components/SignatureModal';

export default function ShiftHandovers() {
  const [handovers, setHandovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [section, setSection] = useState('Utilities');
  const [notes, setNotes] = useState('');
  const [entriesCount, setEntriesCount] = useState(12);
  const [anomalyCount, setAnomalyCount] = useState(0);

  // Signature state
  const [showSignature, setShowSignature] = useState(false);
  const [signatureTarget, setSignatureTarget] = useState<{ id: number; type: 'outgoing' | 'incoming' } | null>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || 'operator').toLowerCase();

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      const res = await apiClient.get(`/handovers?${params.toString()}`);
      setHandovers(res.data);
    } catch (err) {
      console.error('Failed to fetch handovers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, [statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/handovers', {
        section,
        outgoing_user_id: user.id || 1,
        entries_count: Number(entriesCount),
        anomaly_count: Number(anomalyCount),
        notes: notes || 'All operations running nominally. Section handover complete.',
        status: 'pending'
      });
      setShowCreateModal(false);
      setNotes('');
      // Open signature to formalize outgoing signoff
      setSignatureTarget({ id: res.data.id, type: 'outgoing' });
      setShowSignature(true);
    } catch (err) {
      alert('Failed to initiate shift handover');
    }
  };

  const handleAcknowledgeClick = (id: number) => {
    setSignatureTarget({ id, type: 'incoming' });
    setShowSignature(true);
  };

  const handleSignatureSuccess = async () => {
    if (!signatureTarget) return;

    if (signatureTarget.type === 'incoming') {
      try {
        await apiClient.patch(`/handovers/${signatureTarget.id}/acknowledge`, {
          incoming_user_id: user.id || 1,
          status: 'acknowledged'
        });
      } catch (err) {
        alert('Failed to record incoming handover acknowledgment');
      }
    }

    setShowSignature(false);
    setSignatureTarget(null);
    fetchHandovers();
  };

  const filteredHandovers = handovers.filter((h) => {
    const matchesSearch = 
      h.section.toLowerCase().includes(search.toLowerCase()) ||
      (h.notes && h.notes.toLowerCase().includes(search.toLowerCase())) ||
      (h.outgoing_user?.name && h.outgoing_user.name.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Shift Handovers</h2>
          <p className="text-secondary mt-1">
            Structured inter-shift turnover logs with mutual operator compliance signatures.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="industrial-btn-primary bg-accent hover:bg-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Initiate Handover
        </button>
      </div>

      <div className="industrial-card">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              placeholder="Search section, operator, or notes..."
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
              className="industrial-input py-2 text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="pending">Pending Acknowledgment</option>
              <option value="acknowledged">Acknowledged & Closed</option>
            </select>
          </div>
        </div>

        {/* Handover List */}
        {loading ? (
          <div className="p-8 text-center text-secondary">Loading handover records...</div>
        ) : filteredHandovers.length === 0 ? (
          <div className="text-center py-12">
            <ShieldCheck className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
            <p className="text-primary font-medium">No shift handovers found</p>
            <p className="text-xs text-secondary mt-1">Initiate a turnover when completing your shift.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHandovers.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-lg border transition-all ${
                  item.status === 'pending'
                    ? 'border-warning/40 bg-warning/5 shadow-sm'
                    : 'border-border bg-white'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-primary">{item.section} Section</span>
                      <span
                        className={`status-badge ${
                          item.status === 'pending'
                            ? 'bg-warning/15 text-warning font-semibold'
                            : 'bg-success/15 text-success'
                        }`}
                      >
                        {item.status === 'pending' ? 'Pending Acceptance' : 'Acknowledged'}
                      </span>
                      <span className="text-xs text-secondary">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-secondary">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>Entries Logged: <strong className="text-primary">{item.entries_count}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className={`w-3.5 h-3.5 ${item.anomaly_count > 0 ? 'text-critical' : 'text-success'}`} />
                        <span>Anomalies: <strong className={item.anomaly_count > 0 ? 'text-critical' : 'text-primary'}>{item.anomaly_count}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Outgoing Operator: <strong className="text-primary">{item.outgoing_user?.name || `User #${item.outgoing_user_id}`}</strong></span>
                      </div>
                      {item.incoming_user && (
                        <div className="flex items-center gap-1">
                          <span>Incoming Operator: <strong className="text-primary">{item.incoming_user.name}</strong></span>
                        </div>
                      )}
                    </div>

                    {item.notes && (
                      <div className="bg-white/80 p-3 rounded border border-border/80 text-sm text-primary">
                        <span className="font-semibold text-xs text-secondary uppercase block mb-1">Handoff Instructions / Notes:</span>
                        {item.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {item.status === 'pending' ? (
                      <button
                        onClick={() => handleAcknowledgeClick(item.id)}
                        className="industrial-btn-primary bg-warning hover:bg-warning/90 text-white border-none w-full sm:w-auto"
                      >
                        <UserCheck className="w-4 h-4 mr-2" /> Acknowledge & Take Over
                      </button>
                    ) : (
                      <div className="flex items-center text-xs font-semibold text-success bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Handover Complete
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Handover Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-border">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/40">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent" />
                Initiate Shift Handover
              </h3>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Plant Section
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="industrial-input w-full"
                >
                  <option value="Utilities">Utilities (Pumps & Cooling)</option>
                  <option value="Production">Production (Boilers & Steam)</option>
                  <option value="Packaging">Packaging (Compressors)</option>
                  <option value="Electrical">Electrical (Generators)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                    Logged Entries
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={entriesCount}
                    onChange={(e) => setEntriesCount(Number(e.target.value))}
                    className="industrial-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                    Open Anomalies
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={anomalyCount}
                    onChange={(e) => setAnomalyCount(Number(e.target.value))}
                    className="industrial-input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Shift Notes & Critical Handover Information
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify equipment status, unusual vibration/temp observations, maintenance in progress..."
                  rows={4}
                  className="industrial-input w-full text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="industrial-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="industrial-btn-primary bg-accent hover:bg-accent/90"
                >
                  Proceed to Sign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {signatureTarget && (
        <SignatureModal
          isOpen={showSignature}
          onClose={() => {
            setShowSignature(false);
            setSignatureTarget(null);
          }}
          onSuccess={handleSignatureSuccess}
          title={
            signatureTarget.type === 'outgoing'
              ? 'Sign Shift Handover (Outgoing)'
              : 'Acknowledge Shift Handover (Incoming)'
          }
          description={
            signatureTarget.type === 'outgoing'
              ? 'You are certifying that the shift records and equipment status notes provided are true and complete.'
              : 'You are acknowledging this handover and formally assuming operating responsibility for this plant section.'
          }
          entityType="handover"
          entityId={signatureTarget.id}
          meaning={
            signatureTarget.type === 'outgoing'
              ? 'handover_outgoing'
              : 'handover_incoming'
          }
        />
      )}
    </div>
  );
}

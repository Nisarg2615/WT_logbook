import { useEffect, useState } from 'react';
import { Search, Filter, CheckCircle2, XCircle, PenTool, MessageSquare } from 'lucide-react';
import apiClient from '../api/client';
import SignatureModal from '../components/SignatureModal';

export default function ReviewQueue() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [supervisorComments, setSupervisorComments] = useState('');

  const [showSignature, setShowSignature] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedReview) {
      fetchSignatures(selectedReview.id);
      setSupervisorComments(selectedReview.supervisor_comments || '');
    } else {
      setSignatures([]);
      setSupervisorComments('');
    }
  }, [selectedReview]);

  const fetchSignatures = async (id: number) => {
    try {
      const res = await apiClient.get(`/signatures?entity_type=log_entry&entity_id=${id}`);
      setSignatures(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.append('status', statusFilter);
      const res = await apiClient.get(`/reviews?${params.toString()}`);
      setReviews(res.data);
      if (selectedReview) {
        const updated = res.data.find((r: any) => r.id === selectedReview.id);
        if (updated) setSelectedReview(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initiateAction = (action: 'approve' | 'reject') => {
    setPendingAction(action);
    setShowSignature(true);
  };

  const executeAction = async () => {
    if (!pendingAction || !selectedReview) return;
    try {
      await apiClient.post(`/reviews/${selectedReview.id}/${pendingAction}`, {
        comments: supervisorComments
      });
      setShowSignature(false);
      setPendingAction(null);
      fetchReviews();
    } catch (err) {
      alert(`Failed to ${pendingAction} review`);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      (r.equipment?.equipment_id && r.equipment.equipment_id.toLowerCase().includes(search.toLowerCase())) ||
      (r.equipment?.name && r.equipment.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.operator?.name && r.operator.name.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  if (loading && reviews.length === 0) return <div className="p-8 text-secondary">Loading review queue...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Review & Approval Queue</h2>
          <p className="text-secondary mt-1">Supervisor sign-off dashboard and quality verification</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* List Panel */}
        <div className="lg:w-1/2 xl:w-2/3 industrial-card flex flex-col h-[750px]">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="Search equipment or operator..."
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
                <option value="All">All Reviews</option>
                <option value="Submitted">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar border rounded-md">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Equipment</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Operator</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Shift / Date</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReviews.map((r: any) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-primary/5 cursor-pointer transition-colors ${
                      selectedReview?.id === r.id ? 'bg-primary/5 border-l-4 border-l-accent' : ''
                    }`}
                    onClick={() => setSelectedReview(r)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-primary">
                      {r.equipment?.equipment_id}
                      <div className="text-xs text-secondary font-normal">{r.equipment?.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-secondary">{r.operator?.name || 'Operator'}</td>
                    <td className="px-4 py-3 text-sm text-secondary">
                      <div>{r.shift} Shift</div>
                      <div className="text-xs text-secondary/70">{new Date(r.recorded_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`status-badge ${
                          r.status === 'Submitted'
                            ? 'bg-warning/10 text-warning'
                            : r.status === 'Approved'
                            ? 'bg-success/10 text-success'
                            : 'bg-critical/10 text-critical'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredReviews.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-secondary text-sm">
                      No entries found matching filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:w-1/2 xl:w-1/3">
          {selectedReview ? (
            <div className="industrial-card sticky top-6 max-h-[750px] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg text-primary">{selectedReview.equipment?.equipment_id} Logbook</h3>
                  <p className="text-sm text-secondary">{selectedReview.equipment?.name}</p>
                </div>
                <span
                  className={`status-badge ${
                    selectedReview.status === 'Submitted'
                      ? 'bg-warning/10 text-warning'
                      : selectedReview.status === 'Approved'
                      ? 'bg-success/10 text-success'
                      : 'bg-critical/10 text-critical'
                  }`}
                >
                  {selectedReview.status}
                </span>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-secondary">Operator</span>
                  <span className="font-medium text-primary">{selectedReview.operator?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-secondary">Shift</span>
                  <span className="font-medium text-primary">{selectedReview.shift}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-secondary">Timestamp</span>
                  <span className="font-medium text-primary">{new Date(selectedReview.recorded_at).toLocaleString()}</span>
                </div>
              </div>

              <h4 className="font-semibold text-primary mb-2 text-sm uppercase tracking-wider">Recorded Parameters</h4>
              <div className="bg-muted p-3 rounded-md space-y-2 mb-6">
                {Object.entries(selectedReview.data || {}).map(([key, val]: any) => {
                  if (key === 'remarks') return null;
                  return (
                    <div key={key} className="flex justify-between items-center bg-white p-2 rounded shadow-sm text-sm">
                      <span className="font-medium text-primary">{key}</span>
                      <span className="font-bold text-accent">{val}</span>
                    </div>
                  );
                })}
                {selectedReview.data?.remarks && (
                  <div className="bg-white p-2.5 rounded shadow-sm mt-3">
                    <span className="block text-xs font-semibold text-secondary mb-1">Operator Remarks:</span>
                    <span className="text-sm text-primary">{selectedReview.data.remarks}</span>
                  </div>
                )}
              </div>

              {/* Signatures & Audit */}
              {signatures.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-primary mb-2 text-xs uppercase tracking-wider">E-Signature Audit Trail</h4>
                  <div className="space-y-2">
                    {signatures.map((sig: any) => (
                      <div key={sig.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border border-border">
                        <div className="flex items-center">
                          <PenTool className="w-3 h-3 text-secondary mr-2" />
                          <span className="font-medium text-primary mr-1">{sig.user_role}</span>
                          <span className="text-secondary">({sig.meaning})</span>
                        </div>
                        <span className="text-secondary">{new Date(sig.signed_at).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supervisor Comments Input */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-accent" />
                  Supervisor Comments / Feedback
                </label>
                <textarea
                  value={supervisorComments}
                  onChange={(e) => setSupervisorComments(e.target.value)}
                  disabled={selectedReview.status !== 'Submitted'}
                  placeholder="Provide approval sign-off note or rejection reason..."
                  rows={2}
                  className="industrial-input w-full text-xs"
                />
              </div>

              {selectedReview.status === 'Submitted' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => initiateAction('reject')}
                    className="industrial-btn-outline flex-1 text-critical hover:bg-critical/5 hover:text-critical border-critical/30"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject Entry
                  </button>
                  <button
                    onClick={() => initiateAction('approve')}
                    className="industrial-btn-primary flex-1 bg-success hover:bg-success/90"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Sign
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="industrial-card flex flex-col items-center justify-center h-[400px] text-center">
              <CheckCircle2 className="w-12 h-12 text-border mb-4" />
              <h3 className="text-lg font-medium text-primary mb-1">No Review Selected</h3>
              <p className="text-sm text-secondary">Select an entry from the queue to inspect readings and sign off.</p>
            </div>
          )}
        </div>
      </div>

      {pendingAction && selectedReview && (
        <SignatureModal
          isOpen={showSignature}
          onClose={() => setShowSignature(false)}
          onSuccess={executeAction}
          title={`${pendingAction === 'approve' ? 'Approve' : 'Reject'} Logbook Entry`}
          description={`You are officially ${pendingAction === 'approve' ? 'approving' : 'rejecting'} the logbook entry for ${selectedReview.equipment?.equipment_id}.`}
          entityType="log_entry"
          entityId={selectedReview.id}
          meaning={pendingAction === 'approve' ? 'approver' : 'reviewer'}
        />
      )}
    </div>
  );
}

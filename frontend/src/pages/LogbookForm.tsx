import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Send, AlertCircle, CheckCircle2, AlertTriangle, ArrowLeft, ShieldAlert, Lock, Shield, QrCode, Sparkles } from 'lucide-react';
import apiClient from '../api/client';
import SignatureModal from '../components/SignatureModal';
import QrScannerModal from '../components/QrScannerModal';

export default function LogbookForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const draftIdParam = searchParams.get('draftId');
  const viewIdParam = searchParams.get('viewId');
  const autoFillParam = searchParams.get('autoFill');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || 'operator').toLowerCase();
  const isOperator = userRole === 'operator';

  const [equipment, setEquipment] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [shift, setShift] = useState('Morning');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(draftIdParam ? Number(draftIdParam) : null);
  const [isReadOnly, setIsReadOnly] = useState(!isOperator);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);

  // QR Auto-fill states
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrAutoFilled, setQrAutoFilled] = useState(false);
  const [qrTimestamp, setQrTimestamp] = useState<string | null>(null);

  const [showSignature, setShowSignature] = useState(false);
  const [pendingEntryId, setPendingEntryId] = useState<number | null>(null);

  const todayFormatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch equipment
        const eqRes = await apiClient.get(`/equipment/${id}`);
        setEquipment(eqRes.data);

        // If not operator, enforce read-only
        if (!isOperator) {
          setIsReadOnly(true);
        }

        // If draftId or viewId is passed, load existing logbook entry
        const entryIdToLoad = draftIdParam || viewIdParam;
        if (entryIdToLoad) {
          const entryRes = await apiClient.get(`/logbook-entries/${entryIdToLoad}`);
          setFormData(entryRes.data.data || {});
          setShift(entryRes.data.shift || 'Morning');
          setExistingStatus(entryRes.data.status);
          if (!isOperator || viewIdParam || (entryRes.data.status !== 'Draft' && !draftIdParam)) {
            setIsReadOnly(true);
          }
        }

        // If autoFillParam is true and no existing entry, fetch live calibrated telemetry
        if (autoFillParam === 'true' && !entryIdToLoad && isOperator) {
          try {
            const scanRes = await apiClient.get(`/equipment/scan/${eqRes.data.equipment_id}`);
            if (scanRes.data.telemetry) {
              setFormData({
                ...scanRes.data.telemetry,
                remarks: `Auto-filled via machine physical QR scan tag (${eqRes.data.equipment_id}).`
              });
              setQrAutoFilled(true);
              setQrTimestamp(new Date().toLocaleTimeString());
            }
          } catch (scanErr) {
            console.warn('QR auto-fill notice', scanErr);
          }
        }
      } catch (err) {
        console.error('Failed to load logbook form', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, draftIdParam, viewIdParam, isOperator, autoFillParam]);

  const handleQrScanSuccess = (data: any) => {
    if (data.telemetry) {
      setFormData((prev: any) => ({
        ...prev,
        ...data.telemetry,
        remarks: `Auto-filled via machine physical QR scan tag (${data.equipment?.equipment_id || equipment?.equipment_id}).`
      }));
      setQrAutoFilled(true);
      setQrTimestamp(new Date(data.scanned_at || Date.now()).toLocaleTimeString());
    }
  };

  if (loading) return <div className="p-8 text-secondary">Loading equipment logbook...</div>;
  if (!equipment) return <div className="p-8 text-critical">Equipment not found</div>;

  // STRICT OPERATIONAL HIERARCHY GUARD:
  // If non-operator accesses new logbook URL without an existing entry ID to inspect
  if (!isOperator && !viewIdParam && !draftIdParam) {
    return (
      <div className="max-w-2xl mx-auto my-12 industrial-card p-8 border-l-4 border-warning shadow-md">
        <div className="w-14 h-14 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-primary text-center mb-2">
          Restricted Action: Field Operator Entry Only
        </h3>
        <p className="text-sm text-secondary text-center mb-6 leading-relaxed max-w-lg mx-auto">
          In accordance with the <strong>Plant Operational Hierarchy</strong>, logbook parameter entries must be filled and submitted directly by <strong>Field Operators</strong> on shift.
          Supervisors and Managers are not authorized to create or fill new logbooks.
        </p>

        <div className="bg-muted/40 p-5 rounded-lg border border-border mb-6 text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="bg-accent/20 text-accent font-bold px-2 py-0.5 rounded text-[11px] shrink-0">Level 1</span>
            <div>
              <strong className="text-primary">Field Operator:</strong> Takes physical readings on the plant floor, records parameters, and submits entries for sign-off.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="bg-warning/20 text-warning font-bold px-2 py-0.5 rounded text-[11px] shrink-0">Level 2</span>
            <div>
              <strong className="text-primary">Shift Supervisor:</strong> Validates submitted readings, audits telemetry, and signs approvals/rejections in the Review Queue.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="bg-primary/20 text-primary font-bold px-2 py-0.5 rounded text-[11px] shrink-0">Level 3</span>
            <div>
              <strong className="text-primary">Plant Manager:</strong> Governs plant reliability, compliance metrics, and statutory audit integrity.
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          {userRole === 'supervisor' ? (
            <button 
              onClick={() => navigate('/reviews')} 
              className="industrial-btn-primary bg-accent hover:bg-accent/90 text-xs px-5"
            >
              Go to Supervisor Review Queue
            </button>
          ) : (
            <button 
              onClick={() => navigate('/dashboard')} 
              className="industrial-btn-primary bg-primary text-xs px-5"
            >
              Go to Executive Dashboard
            </button>
          )}
          <button 
            onClick={() => navigate('/logbooks')} 
            className="industrial-btn-outline text-xs px-5"
          >
            View Verified Records
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (paramName: string, value: string) => {
    if (isReadOnly) return;
    setFormData((prev: any) => ({ ...prev, [paramName]: value }));
  };

  const getValidationState = (param: any, value: string) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;

    if (param.critical_threshold && num >= param.critical_threshold) {
      return { state: 'critical', message: `Critical Reading: Exceeds threshold (${param.critical_threshold})` };
    }
    if (param.max_warning && num >= param.max_warning) {
      return { state: 'warning', message: `Warning: Value above normal operating range` };
    }
    if (param.min_warning && num <= param.min_warning) {
      return { state: 'warning', message: `Warning: Value below normal operating range` };
    }
    return { state: 'normal', message: 'Within acceptable nominal range' };
  };

  const handleSaveDraft = async () => {
    try {
      if (draftId) {
        await apiClient.put(`/logbook-entries/${draftId}`, { status: 'Draft', data: formData });
      } else {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const res = await apiClient.post('/logbook-entries', {
          equipment_id: equipment.id,
          operator_id: user.id || 1,
          shift,
          status: 'Draft',
          data: formData
        });
        setDraftId(res.data.id);
      }
      alert('Draft saved successfully! You can resume it anytime from My Logbooks.');
    } catch (e) {
      alert('Failed to save draft');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let entryId = draftId;
      if (!entryId) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const res = await apiClient.post('/logbook-entries', {
          equipment_id: equipment.id,
          operator_id: user.id || 1,
          shift,
          status: 'Draft',
          data: formData
        });
        entryId = res.data.id;
        setDraftId(entryId);
      } else {
        // Ensure latest form values are saved to entry before signature
        await apiClient.put(`/logbook-entries/${entryId}`, { status: 'Draft', data: formData });
      }
      setPendingEntryId(entryId);
      setShowSignature(true);
    } catch (e) {
      alert('Failed to prepare logbook for submission');
    } finally {
      setSubmitting(false);
    }
  };

  const executeSubmit = async () => {
    if (!pendingEntryId) return;
    try {
      await apiClient.post(`/logbook-entries/${pendingEntryId}/submit`);
      navigate('/dashboard');
    } catch (e) {
      alert('Failed to submit logbook after signature');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Back button */}
      <div
        className="flex items-center text-sm font-medium text-secondary cursor-pointer hover:text-primary transition-colors"
        onClick={() => navigate('/logbooks')}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Logbooks
      </div>

      {/* Non-Operator Inspection Mode Banner */}
      {!isOperator && (
        <div className="bg-blue-50 border-l-4 border-info p-4 rounded-r-lg flex items-center gap-3 shadow-sm">
          <Lock className="w-5 h-5 text-info shrink-0" />
          <div className="text-xs text-primary">
            <span className="font-bold capitalize">{userRole} Audit Mode:</span> In compliance with plant operational hierarchy, form editing is restricted to Field Operators. You are inspecting recorded telemetry in read-only mode.
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="industrial-card border-l-4 border-l-accent">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-primary">Daily Equipment Log</h2>
              {existingStatus && (
                <span className="status-badge bg-primary/10 text-primary">
                  {existingStatus}
                </span>
              )}
            </div>
            <p className="text-secondary font-medium">
              {equipment.equipment_id} — {equipment.name} ({equipment.section})
            </p>
          </div>

          <div className="text-left sm:text-right space-y-2">
            <div className="flex items-center sm:justify-end gap-2">
              <span className="text-xs font-bold text-secondary uppercase">Shift:</span>
              {isReadOnly ? (
                <span className="font-semibold text-primary text-sm">{shift}</span>
              ) : (
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="industrial-input py-1 text-xs"
                >
                  <option value="Morning">Morning Shift (08:00 - 16:00)</option>
                  <option value="Afternoon">Afternoon Shift (16:00 - 00:00)</option>
                  <option value="Night">Night Shift (00:00 - 08:00)</option>
                </select>
              )}
            </div>
            
            <div className="flex items-center sm:justify-end gap-2">
              <p className="text-xs text-secondary">{todayFormatted}</p>
              {isOperator && !isReadOnly && (
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan Machine QR</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Auto-Filled Telemetry Banner */}
      {qrAutoFilled && (
        <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-lg flex items-center justify-between text-xs text-emerald-950 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-emerald-900">
                  Telemetry Auto-Filled via Machine QR Scan ({equipment.equipment_id})
                </span>
                <span className="bg-emerald-200 text-emerald-900 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                  Verified SCADA Sync
                </span>
              </div>
              <p className="text-emerald-700 text-xs mt-0.5">
                Calibrated sensor readings captured at {qrTimestamp}. You can review and adjust any field before signing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="text-xs font-bold text-emerald-800 hover:underline shrink-0 ml-2"
          >
            Re-scan QR
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="industrial-card">
        <h3 className="font-bold text-lg text-primary border-b border-border pb-4 mb-6">
          Operating Parameters & Field Inspection
        </h3>

        <div className="space-y-8">
          {equipment.parameters.map((param: any) => {
            const val = formData[param.parameter_name] || '';
            const validation = getValidationState(param, val);

            return (
              <div key={param.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-start">
                <div className="md:col-span-1 pt-2">
                  <label className="block text-sm font-bold text-primary">
                    {param.parameter_name}
                  </label>
                  <span className="text-xs text-secondary mt-1 block">
                    Normal: {param.min_normal}-{param.max_normal} {param.unit}
                  </span>
                  {param.critical_threshold && (
                    <span className="text-[11px] text-critical/80 block mt-0.5">
                      Critical Threshold: ≥ {param.critical_threshold} {param.unit}
                    </span>
                  )}
                </div>

                <div className="md:col-span-2">
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      step="0.1"
                      disabled={isReadOnly}
                      className={`industrial-input pr-12 text-lg font-medium w-full ${
                        isReadOnly ? 'bg-muted/40 cursor-not-allowed' : ''
                      } ${
                        validation?.state === 'critical'
                          ? 'border-critical focus:ring-critical'
                          : validation?.state === 'warning'
                          ? 'border-warning focus:ring-warning'
                          : ''
                      }`}
                      value={val}
                      onChange={(e) => handleInputChange(param.parameter_name, e.target.value)}
                      placeholder="0.0"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-secondary font-semibold">
                      {param.unit}
                    </div>
                  </div>

                  {validation && (
                    <div
                      className={`mt-2 flex items-start text-xs p-2 rounded-md ${
                        validation.state === 'critical'
                          ? 'bg-critical/10 text-critical font-semibold'
                          : validation.state === 'warning'
                          ? 'bg-warning/10 text-warning font-semibold'
                          : 'bg-success/10 text-success'
                      }`}
                    >
                      {validation.state === 'critical' && <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" />}
                      {validation.state === 'warning' && <AlertTriangle className="w-4 h-4 mr-1.5 flex-shrink-0" />}
                      {validation.state === 'normal' && <CheckCircle2 className="w-4 h-4 mr-1.5 flex-shrink-0" />}
                      <span>{validation.message}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border pt-6">
            <div className="md:col-span-1 pt-2">
              <label className="block text-sm font-bold text-primary">Operator Remarks</label>
              <span className="text-xs text-secondary mt-1 block">Unusual sounds, leaks, or maintenance notes</span>
            </div>
            <div className="md:col-span-2">
              <textarea
                disabled={isReadOnly}
                className={`w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent min-h-[100px] ${
                  isReadOnly ? 'bg-muted/40 cursor-not-allowed' : ''
                }`}
                placeholder="All bearings running smoothly..."
                value={formData['remarks'] || ''}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Footer */}
      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-border p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 flex justify-between items-center">
          <span className="text-sm text-secondary font-medium hidden sm:inline-block">
            {draftId ? 'Draft Saved' : 'Unsaved Changes'}
          </span>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={handleSaveDraft}
              className="industrial-btn-outline flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="industrial-btn-primary flex-1 sm:flex-none bg-accent hover:bg-accent/90"
            >
              <Send className="w-4 h-4 mr-2" /> {submitting ? 'Preparing...' : 'Submit Logbook'}
            </button>
          </div>
        </div>
      )}

      {/* E-Signature Modal */}
      {pendingEntryId && (
        <SignatureModal
          isOpen={showSignature}
          onClose={() => setShowSignature(false)}
          onSuccess={executeSubmit}
          title="Sign Logbook Entry"
          description={`You are submitting the operational logbook for ${equipment.name}. This will lock your entry and transfer it to the supervisor review queue.`}
          entityType="log_entry"
          entityId={pendingEntryId}
          meaning="author"
        />
      )}

      {/* Machine QR Scanner Modal */}
      <QrScannerModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onScanSuccess={handleQrScanSuccess}
        targetAssetId={equipment?.equipment_id}
      />
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Cpu, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import apiClient from '../api/client';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: {
    equipment: any;
    telemetry: Record<string, string>;
    scanned_at: string;
    source: string;
  }) => void;
  targetAssetId?: string; // Optional: if already on a specific equipment's form
}

export default function QrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  targetAssetId
}: QrScannerModalProps) {
  const [mode, setMode] = useState<'camera' | 'tags'>('tags');
  const [manualCode, setManualCode] = useState(targetAssetId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [equipmentFleet, setEquipmentFleet] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setError(null);
      return;
    }

    // Fetch registered equipment to display machine QR tags
    const fetchEquipment = async () => {
      try {
        const res = await apiClient.get('/equipment');
        setEquipmentFleet(res.data || []);
      } catch (e) {
        console.error('Failed to fetch equipment list for QR scanner', e);
      }
    };
    fetchEquipment();

    if (mode === 'camera') {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // If browser supports BarcodeDetector API, scan frames continuously
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const detectedVal = barcodes[0].rawValue;
                handleCodeScanned(detectedVal);
              }
            } catch (err) {
              // ignore frame read error
            }
          }
        }, 500);
      }
    } catch (err: any) {
      console.warn('Camera initiation notice:', err.message);
      setCameraError(err.message || 'Unable to access video camera. You can select or enter a Machine Tag directly below.');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleCodeScanned = async (code: string) => {
    if (!code || loading) return;
    try {
      setLoading(true);
      setError(null);
      stopCamera();

      // Clean QR payload (could be raw code like "TUR-101" or URL like "https://...?asset=TUR-101")
      let cleanCode = code.trim();
      if (cleanCode.includes('asset=')) {
        cleanCode = cleanCode.split('asset=')[1].split('&')[0];
      }

      const res = await apiClient.get(`/equipment/scan/${encodeURIComponent(cleanCode)}`);
      onScanSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || `Machine tag "${code}" not recognized in plant fleet.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-primary/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-border flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-border bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Machine QR Telemetry Scanner</h3>
              <p className="text-[11px] text-primary-foreground/70">Scan physical asset tag to auto-fill sensor readings</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-primary-foreground/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-border bg-muted/40 p-1.5 gap-1.5">
          <button
            onClick={() => setMode('tags')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'tags'
                ? 'bg-white text-primary shadow-sm border border-border'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span>Select Machine Tag</span>
          </button>
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'camera'
                ? 'bg-white text-primary shadow-sm border border-border'
                : 'text-secondary hover:text-primary'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-info" />
            <span>Live Camera Scanner</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-critical/30 text-critical text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: Camera Scanner */}
          {mode === 'camera' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border-2 border-accent/40 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Targeting HUD Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-accent/80 rounded-lg relative flex items-center justify-center shadow-[0_0_15px_rgba(15,157,154,0.3)]">
                    <div className="w-full h-0.5 bg-accent/90 shadow-[0_0_8px_#0F9D9A] animate-pulse"></div>
                    <span className="absolute bottom-2 text-[10px] uppercase font-mono font-bold tracking-wider text-accent bg-black/60 px-2 py-0.5 rounded">
                      Align QR Inside Frame
                    </span>
                  </div>
                </div>

                {cameraError && (
                  <div className="absolute inset-0 bg-black/80 p-4 text-center flex flex-col items-center justify-center text-white">
                    <Camera className="w-8 h-8 text-secondary mb-2" />
                    <p className="text-xs text-white/80 max-w-xs">{cameraError}</p>
                    <button
                      onClick={() => setMode('tags')}
                      className="mt-3 px-3 py-1.5 bg-accent text-white text-xs font-bold rounded-md hover:bg-accent/90"
                    >
                      Use Machine Tag List
                    </button>
                  </div>
                )}
              </div>
              <p className="text-center text-[11px] text-secondary">
                Point device camera at the physical QR code mounted on the machine chassis.
              </p>
            </div>
          )}

          {/* Mode 2: Quick Machine Tags Simulator & Manual Input */}
          {mode === 'tags' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
                  Plant Floor Machinery QR Tags
                </label>
                <p className="text-xs text-secondary mb-3">
                  Click on any machine's physical tag to simulate an instant floor scan and auto-populate calibrated SCADA telemetry:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {equipmentFleet.map((eq) => (
                    <button
                      key={eq.id}
                      onClick={() => handleCodeScanned(eq.equipment_id)}
                      disabled={loading}
                      className="p-3 text-left rounded-lg border border-border bg-card hover:border-accent hover:bg-accent/5 transition-all flex items-center justify-between group disabled:opacity-50"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-accent group-hover:underline">
                            {eq.equipment_id}
                          </span>
                          <span className="text-[10px] text-secondary bg-muted px-1.5 py-0.2 rounded font-medium">
                            {eq.section}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-primary truncate mt-0.5">
                          {eq.name}
                        </p>
                        <p className="text-[10px] text-secondary">
                          {eq.parameters?.length || 0} telemetry sensors
                        </p>
                      </div>

                      <div className="w-7 h-7 rounded-md bg-muted group-hover:bg-accent text-secondary group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                        <QrCode className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Code Entry */}
              <div className="pt-3 border-t border-border">
                <label className="block text-xs font-bold text-secondary mb-1">
                  Or Scan / Enter Asset Code Manually:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. TUR-101"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="industrial-input flex-1 uppercase font-mono text-xs"
                  />
                  <button
                    onClick={() => handleCodeScanned(manualCode)}
                    disabled={!manualCode.trim() || loading}
                    className="industrial-btn-primary bg-accent hover:bg-accent/90 text-xs px-4 flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{loading ? 'Reading...' : 'Scan Tag'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-secondary">
          <div className="flex items-center gap-1.5 text-accent font-medium">
            <CheckCircle2 className="w-4 h-4 text-accent" />
            <span>Auto-fills all parameters instantly</span>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

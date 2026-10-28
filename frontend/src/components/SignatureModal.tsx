import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import apiClient from '../api/client';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  description: string;
  entityType: string;
  entityId: number;
  meaning: string;
}

export default function SignatureModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title, 
  description,
  entityType,
  entityId,
  meaning
}: SignatureModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Re-authenticate
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.email) throw new Error("No user found");
      
      await apiClient.post('/auth/login', { email: user.email, password });

      // 2. Create Signature Record
      await apiClient.post('/signatures', {
        entity_type: entityType,
        entity_id: entityId,
        user_id: user.id,
        user_role: user.role,
        meaning: meaning
      });

      // 3. Success callback
      onSuccess();
    } catch (err) {
      setError('Invalid password or signature failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-border">
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            E-Signature Required
          </h3>
          <button onClick={onClose} className="text-secondary hover:text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-primary mb-1">{title}</h4>
            <p className="text-sm text-secondary leading-relaxed">{description}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-critical/10 border-l-2 border-critical text-critical text-xs rounded-r">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                Re-enter Password to Sign
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="industrial-input w-full"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="bg-muted p-3 rounded-md border border-border/50 text-xs text-secondary flex flex-col gap-1">
              <span><strong>Meaning:</strong> {meaning}</span>
              <span>By signing, I certify that this action is accurate and complies with operational protocols.</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="industrial-btn-outline px-6">
              Cancel
            </button>
            <button type="submit" disabled={loading || !password} className="industrial-btn-primary px-6 bg-accent hover:bg-accent/90">
              {loading ? 'Signing...' : 'Sign & Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

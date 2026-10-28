import { useEffect, useState } from 'react';
import { Search, History, Download } from 'lucide-react';
import apiClient from '../api/client';

export default function AuditTrail() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    fetchAudits();
  }, [actionFilter, roleFilter, search]);

  const fetchAudits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (search) params.append('search', search);

      const res = await apiClient.get(`/audit?${params.toString()}`);
      setAudits(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAuditCSV = () => {
    const csvRows = [
      ['Timestamp', 'Actor ID', 'Actor Role', 'Action', 'Entity Type', 'Entity ID', 'Description'],
      ...audits.map(a => [
        a.created_at,
        a.actor_user_id || 'System',
        a.actor_role || 'System',
        `"${a.action || ''}"`,
        a.entity_type || '',
        a.entity_id || '',
        `"${(a.description || '').replace(/"/g, '""')}"`
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Compliance Audit Trail</h2>
          <p className="text-secondary mt-1">Immutable, cryptographic log of all system and operational events</p>
        </div>
        <button
          onClick={handleExportAuditCSV}
          className="industrial-btn-outline flex items-center text-xs"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" /> Download Audit CSV
        </button>
      </div>

      <div className="industrial-card flex flex-col h-[750px]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              placeholder="Search actions or descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="industrial-input pl-9 w-full"
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              className="industrial-input py-1.5 text-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="Logbook Submitted">Logbook Submitted</option>
              <option value="Logbook Approved">Logbook Approved</option>
              <option value="Logbook Rejected">Logbook Rejected</option>
              <option value="Alert Acknowledged">Alert Acknowledged</option>
              <option value="Handover Created">Handover Created</option>
              <option value="Handover Acknowledged">Handover Acknowledged</option>
              <option value="Signature Created">Signature Created</option>
              <option value="Equipment Created">Equipment Created</option>
              <option value="Equipment Updated">Equipment Updated</option>
              <option value="Equipment Deleted">Equipment Deleted</option>
            </select>

            <select
              className="industrial-input py-1.5 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="Operator">Operator</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Manager">Manager</option>
              <option value="System">System</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar border rounded-md">
          {loading ? (
            <div className="p-8 text-center text-secondary">Loading audit trail...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Actor</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Action</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Target Entity</th>
                  <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {audits.map((log: any) => (
                  <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-4 py-3 text-xs text-secondary whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-primary text-xs">
                        User #{log.actor_user_id || 'System'}
                      </div>
                      <div className="text-[11px] text-secondary">{log.actor_role || 'System'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-secondary capitalize font-mono">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="px-4 py-3 text-xs text-primary max-w-md">
                      {log.description}
                    </td>
                  </tr>
                ))}
                {audits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-secondary text-sm">
                      No audit records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Server, X, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import apiClient from '../api/client';

export default function EquipmentList() {
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);

  // Add Equipment Form State
  const [newAssetId, setNewAssetId] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Pump');
  const [newSection, setNewSection] = useState('Utilities');
  const [newStatus, setNewStatus] = useState('Operational');
  const [parameters, setParameters] = useState<any[]>([
    { parameter_name: 'Temperature', unit: '°C', min_normal: 40, max_normal: 80, min_warning: 80, max_warning: 90, critical_threshold: 90 },
    { parameter_name: 'Pressure', unit: 'bar', min_normal: 2.0, max_normal: 5.0, min_warning: 5.0, max_warning: 6.0, critical_threshold: 6.0 }
  ]);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || 'operator').toLowerCase();
  const isOperator = userRole === 'operator';

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/equipment');
      setEquipmentList(res.data);
    } catch (err) {
      console.error('Failed to fetch equipment', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParameter = () => {
    setParameters([
      ...parameters,
      { parameter_name: '', unit: '', min_normal: 0, max_normal: 100, min_warning: 100, max_warning: 110, critical_threshold: 110 }
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleParameterChange = (index: number, field: string, value: any) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/equipment', {
        equipment_id: newAssetId.toUpperCase(),
        name: newName,
        type: newType,
        section: newSection,
        status: newStatus,
        parameters: parameters.filter(p => p.parameter_name.trim() !== '')
      });
      setShowAddModal(false);
      setNewAssetId('');
      setNewName('');
      fetchEquipment();
      alert('Equipment registered successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create equipment');
    }
  };

  const handleDeleteEquipment = async (id: number) => {
    if (!confirm('Are you sure you want to decommission this equipment?')) return;
    try {
      await apiClient.delete(`/equipment/${id}`);
      setSelectedEquipment(null);
      fetchEquipment();
    } catch (err) {
      alert('Failed to delete equipment');
    }
  };

  const filteredList = equipmentList.filter((eq) => {
    const matchesSearch =
      eq.equipment_id.toLowerCase().includes(search.toLowerCase()) ||
      eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.section.toLowerCase().includes(search.toLowerCase()) ||
      eq.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || eq.status === statusFilter;
    const matchesSection = sectionFilter === 'All' || eq.section === sectionFilter;
    return matchesSearch && matchesStatus && matchesSection;
  });

  if (loading) return <div className="p-8 text-secondary">Loading equipment fleet...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Equipment Registry</h2>
          <p className="text-secondary mt-1">{equipmentList.length} Monitored Plant Assets</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="industrial-btn-primary bg-accent hover:bg-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Equipment
        </button>
      </div>

      <div className="industrial-card">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              placeholder="Search equipment ID, name, or section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="industrial-input pl-9 w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-secondary" />
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="industrial-input py-1.5 text-sm"
              >
                <option value="All">All Sections</option>
                <option value="Utilities">Utilities</option>
                <option value="Production">Production</option>
                <option value="Packaging">Packaging</option>
                <option value="Electrical">Electrical</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="industrial-input py-1.5 text-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Operational">Operational</option>
              <option value="Warning">Warning</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider rounded-tl-md">Asset ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Equipment Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Type / Section</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Configured Parameters</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-secondary tracking-wider rounded-tr-md">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredList.map((eq: any) => (
                <tr key={eq.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-4 text-sm font-bold text-primary">{eq.equipment_id}</td>
                  <td className="px-4 py-4 text-sm font-medium text-primary">
                    <div className="flex items-center">
                      <div className="bg-primary/5 p-2 rounded mr-3">
                        <Server className="w-4 h-4 text-primary" />
                      </div>
                      {eq.name}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-secondary">
                    {eq.type}
                    <div className="text-xs text-secondary/70 mt-0.5">{eq.section}</div>
                  </td>
                  <td className="px-4 py-4 text-xs text-secondary">
                    {eq.parameters?.length || 0} thresholds monitored
                  </td>
                  <td className="px-4 py-4">
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
                  </td>
                  <td className="px-4 py-4 text-sm font-medium">
                    <button
                      onClick={() => setSelectedEquipment(eq)}
                      className="text-accent hover:underline mr-4"
                    >
                      Details
                    </button>
                    {isOperator && (
                      <button
                        onClick={() => navigate(`/logbooks/${eq.id}`)}
                        className="text-primary hover:text-accent font-medium"
                      >
                        Log Entry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-secondary text-sm">
                    No equipment found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment Details Modal */}
      {selectedEquipment && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-border">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/40">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Server className="w-5 h-5 text-accent" />
                Asset Details: {selectedEquipment.equipment_id}
              </h3>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="text-secondary hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-md">
                <div>
                  <span className="text-xs font-semibold text-secondary uppercase">Asset Name</span>
                  <p className="font-bold text-primary text-sm mt-0.5">{selectedEquipment.name}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-secondary uppercase">Type</span>
                  <p className="font-bold text-primary text-sm mt-0.5">{selectedEquipment.type}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-secondary uppercase">Section</span>
                  <p className="font-bold text-primary text-sm mt-0.5">{selectedEquipment.section}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-secondary uppercase">Status</span>
                  <p className="font-bold text-sm mt-0.5 text-accent">{selectedEquipment.status}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider mb-3">
                  Operating Parameter Thresholds
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-secondary font-semibold">
                      <tr>
                        <th className="p-2.5">Parameter</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Normal Range</th>
                        <th className="p-2.5">Warning Range</th>
                        <th className="p-2.5">Critical Limit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedEquipment.parameters?.map((p: any) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-bold text-primary">{p.parameter_name}</td>
                          <td className="p-2.5 text-secondary">{p.unit}</td>
                          <td className="p-2.5 text-success">{p.min_normal} - {p.max_normal}</td>
                          <td className="p-2.5 text-warning">{p.min_warning} - {p.max_warning}</td>
                          <td className="p-2.5 text-critical font-bold">≥ {p.critical_threshold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <button
                  onClick={() => handleDeleteEquipment(selectedEquipment.id)}
                  className="industrial-btn-outline text-critical hover:bg-critical/5 border-critical/30 flex items-center text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Decommission Equipment
                </button>
                <div className="flex gap-2">
                  {isOperator && (
                    <button
                      onClick={() => {
                        navigate(`/logbooks/${selectedEquipment.id}`);
                        setSelectedEquipment(null);
                      }}
                      className="industrial-btn-primary bg-accent hover:bg-accent/90 text-xs"
                    >
                      Start Logbook Entry
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-border my-8">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/40">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Plus className="w-5 h-5 text-accent" />
                Register New Equipment Asset
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-secondary hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEquipment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase mb-1">
                    Asset ID (e.g. TUR-005)
                  </label>
                  <input
                    type="text"
                    value={newAssetId}
                    onChange={(e) => setNewAssetId(e.target.value)}
                    placeholder="PMP-002"
                    className="industrial-input w-full uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase mb-1">
                    Equipment Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Feedwater Booster Pump"
                    className="industrial-input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase mb-1">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="industrial-input w-full"
                  >
                    <option value="Pump">Pump</option>
                    <option value="Boiler">Boiler</option>
                    <option value="Generator">Generator</option>
                    <option value="Compressor">Compressor</option>
                    <option value="Turbine">Turbine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase mb-1">
                    Plant Section
                  </label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="industrial-input w-full"
                  >
                    <option value="Utilities">Utilities</option>
                    <option value="Production">Production</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Parameter Builder */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider">
                    Operating Parameters & Safety Thresholds
                  </label>
                  <button
                    type="button"
                    onClick={handleAddParameter}
                    className="text-xs text-accent font-semibold hover:underline"
                  >
                    + Add Parameter
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {parameters.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-muted/40 p-2 rounded text-xs">
                      <input
                        type="text"
                        placeholder="Name (e.g. Temp)"
                        value={p.parameter_name}
                        onChange={(e) => handleParameterChange(idx, 'parameter_name', e.target.value)}
                        className="industrial-input py-1 text-xs w-28"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={p.unit}
                        onChange={(e) => handleParameterChange(idx, 'unit', e.target.value)}
                        className="industrial-input py-1 text-xs w-16"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Max Normal"
                        value={p.max_normal}
                        onChange={(e) => handleParameterChange(idx, 'max_normal', Number(e.target.value))}
                        className="industrial-input py-1 text-xs w-20"
                        title="Max Normal"
                      />
                      <input
                        type="number"
                        placeholder="Critical Limit"
                        value={p.critical_threshold}
                        onChange={(e) => handleParameterChange(idx, 'critical_threshold', Number(e.target.value))}
                        className="industrial-input py-1 text-xs w-20 border-critical text-critical"
                        title="Critical Threshold"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveParameter(idx)}
                        className="text-secondary hover:text-critical p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="industrial-btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="industrial-btn-primary bg-accent hover:bg-accent/90"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

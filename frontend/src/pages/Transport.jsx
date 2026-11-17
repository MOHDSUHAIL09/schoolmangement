import React, { useState, useEffect } from 'react';
import { transportAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Modal } from '../components/Modal.jsx';
import { formatCurrency } from '../utils/formatters.js';
import { SECURITY_PATTERNS, sanitizeInputText } from '../utils/securityPatterns.js';
import {
  Bus,
  Plus,
  Phone,
  User,
  MapPin,
  Clock,
  Shield,
  Users
} from 'lucide-react';

export const Transport = () => {
  const { role, activeChild } = useAuth();
  const { showToast } = useSchool();

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    routeName: '',
    vehicleNumber: '',
    vehicleType: 'Bus',
    driverName: '',
    driverPhone: '',
    capacity: 40,
    pickupPoints: [
      { name: 'Station Alpha', time: '07:15 AM', location: 'Main Terminal', fee: 150 },
      { name: 'Central Boulevard', time: '07:35 AM', location: 'Civic Hub', fee: 150 }
    ],
    status: 'Active'
  });

  useEffect(() => {
    fetchRoutes();
  }, [role, activeChild]);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const res = await transportAPI.getAll();
      if (res.success) {
        setRoutes(res.data || []);
      }
    } catch (err) {
      showToast(err.message, 'error', 'Error Loading Transport');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await transportAPI.create(formData);
      if (res.success) {
        showToast('Transport route registered successfully', 'success', 'Saved');
        setIsModalOpen(false);
        setFormData({
          routeName: '',
          vehicleNumber: '',
          vehicleType: 'Bus',
          driverName: '',
          driverPhone: '',
          capacity: 40,
          pickupPoints: [
            { name: 'Station Alpha', time: '07:15 AM', location: 'Main Terminal', fee: 150 },
            { name: 'Central Boulevard', time: '07:35 AM', location: 'Civic Hub', fee: 150 }
          ],
          status: 'Active'
        });
        fetchRoutes();
      }
    } catch (err) {
      showToast(err.message, 'error', 'Creation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Bus className="w-7 h-7 text-gray-900" />
            <span>Campus Transit & Fleet Operations</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage school shuttles, licensed operators, transit waypoints, and assigned pupil rosters.
          </p>
        </div>

        {['super_admin', 'principal'].includes(role) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs transition duration-150 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Route Transit</span>
          </button>
        )}
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map((route) => {
          return (
            <div
              key={route._id}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                    {route.vehicleType} &bull; {route.vehicleNumber}
                  </span>
                  <StatusBadge status={route.status} />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">{route.routeName}</h3>

                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200 mb-4">
                  <div>
                    <span className="text-gray-400 block text-[10px] font-bold uppercase">Assigned Driver</span>
                    <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      {route.driverName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] font-bold uppercase">Driver Phone</span>
                    <span className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      {route.driverPhone}
                    </span>
                  </div>
                </div>

                {/* Pickup Points */}
                <div className="space-y-2 mb-4">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Scheduled Pickup Stops ({route.pickupPoints?.length || 0})
                  </span>
                  <div className="space-y-1.5">
                    {route.pickupPoints?.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span className="font-bold text-gray-900">{p.name}</span>
                          {p.location && <span className="text-gray-500 text-[11px]">({p.location})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 font-mono text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {p.time}
                          </span>
                          <span className="text-emerald-700 font-bold">{formatCurrency(p.fee)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{route.assignedStudents?.length || 0} / {route.capacity} Pupils Assigned</span>
                </span>
                <span className="font-semibold text-gray-700">Daily Service</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Route Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Fleet Transit Route">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Route Name *</label>
              <input
                type="text"
                required
                value={formData.routeName}
                pattern={SECURITY_PATTERNS.titleText.pattern}
                title={SECURITY_PATTERNS.titleText.title}
                maxLength={80}
                onChange={(e) => setFormData({ ...formData, routeName: sanitizeInputText(e.target.value) })}
                placeholder="e.g. North Ridge Express (Route #1)"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Vehicle License / Number *</label>
              <input
                type="text"
                required
                value={formData.vehicleNumber}
                pattern="^[a-zA-Z0-9\s\-_]{2,20}$"
                title="Alphanumeric vehicle license/registration number (2-20 characters)."
                maxLength={20}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: sanitizeInputText(e.target.value) })}
                placeholder="BUS-NR-01"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Vehicle Type</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              >
                <option value="Bus">Bus</option>
                <option value="Van">Van</option>
                <option value="Mini-Bus">Mini-Bus</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Seating Capacity</label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Driver Name *</label>
              <input
                type="text"
                required
                value={formData.driverName}
                pattern={SECURITY_PATTERNS.name.pattern}
                title={SECURITY_PATTERNS.name.title}
                maxLength={80}
                onChange={(e) => setFormData({ ...formData, driverName: sanitizeInputText(e.target.value) })}
                placeholder="Driver full name"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Driver Contact Phone *</label>
              <input
                type="text"
                required
                value={formData.driverPhone}
                pattern={SECURITY_PATTERNS.phone.pattern}
                title={SECURITY_PATTERNS.phone.title}
                maxLength={25}
                onChange={(e) => setFormData({ ...formData, driverPhone: sanitizeInputText(e.target.value) })}
                placeholder="+1 (555) 777-1001"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Save Route'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

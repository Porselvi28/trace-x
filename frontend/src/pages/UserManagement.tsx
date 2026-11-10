import React, { useState, useEffect } from 'react';
import { Users, Edit, Shield, Check, X, RefreshCw, UserCheck } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { useNotification } from '../contexts/NotificationContext';

export const UserManagement: React.FC = () => {
  const { notify } = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Role State
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [newRole, setNewRole] = useState('Investigator');

  const fetchUsers = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to list users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: number) => {
    try {
      await api.updateUserRole(userId, newRole);
      notify('success', 'User Access Level Modified', `Role assigned to ${newRole}.`);
      setEditingUserId(null);
      fetchUsers(true);
    } catch (err: any) {
      notify('error', 'Update Failed', err.response?.data?.detail || 'Could not change role');
    }
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] p-6 lg:p-7 rounded-2xl shadow-[0_1px_3px_rgba(68,49,38,0.05)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-[#604735]" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#796C60]">
              RBAC Clearance & Officer Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#342A23]">
            Investigator Access & RBAC Governance
          </h1>
          <p className="text-[15px] text-[#796C60] mt-1 max-w-2xl leading-relaxed">
            Role-Based Access Control governance for Lead Forensic Administrators, Field Investigators, and Legal Examiners
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="btn-secondary shrink-0"
          title="Refresh officers catalog"
        >
          <RefreshCw className={`w-4 h-4 text-[#796C60] ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-[#FFFCF7] border border-[#D9CBBB] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(68,49,38,0.05)]">
        <div className="overflow-x-auto">
          <table className="forensic-table">
            <thead>
              <tr>
                <th>Officer ID</th>
                <th>Full Legal Name</th>
                <th>Username & Email</th>
                <th>Badge / Agency</th>
                <th>Security Role</th>
                <th className="text-right">Access Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DED0]">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#796C60] text-sm">
                    Querying authorized user directory...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F5F0E8]/70 transition-colors">
                    <td className="font-mono font-bold text-[#443126] text-xs whitespace-nowrap">
                      <span className="bg-[#EFE5D8] px-2.5 py-1 rounded-md border border-[#D9CBBB]">
                        UID-{u.id}
                      </span>
                    </td>
                    <td className="font-bold text-[#342A23] text-sm whitespace-nowrap">
                      {u.full_name}
                    </td>
                    <td className="font-mono text-xs whitespace-nowrap">
                      <div className="font-semibold text-[#342A23]">{u.username}</div>
                      <div className="text-[#796C60]">{u.email}</div>
                    </td>
                    <td className="text-xs whitespace-nowrap">
                      <div className="font-mono font-semibold text-[#342A23]">{u.badge_number || 'N/A'}</div>
                      <div className="text-[#796C60]">{u.agency || 'Digital Forensics Unit'}</div>
                    </td>
                    <td className="whitespace-nowrap">
                      {editingUserId === u.id ? (
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="bg-[#F5F0E8] border border-[#D9CBBB] rounded-lg px-2.5 py-1 text-xs text-[#342A23] focus:outline-none focus:border-[#8B684D] font-medium"
                        >
                          <option value="Administrator">Administrator</option>
                          <option value="Investigator">Investigator</option>
                          <option value="Examiner">Examiner</option>
                          <option value="Viewer">Viewer</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                            u.role === 'Administrator'
                              ? 'bg-[#EFE5D8] text-[#443126] border-[#D9CBBB]'
                              : 'bg-[#EFF4F8] text-[#647D91] border-[#C8D7E2]'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>{u.role}</span>
                        </span>
                      )}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {editingUserId === u.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateRole(u.id)}
                            className="p-1.5 rounded-lg bg-[#EAF2EC] text-[#47765B] hover:bg-[#BCD5C3] transition-colors cursor-pointer"
                            title="Save role change"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="p-1.5 rounded-lg bg-[#F8EBEA] text-[#A64B43] hover:bg-[#E3BFBC] transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingUserId(u.id);
                            setNewRole(u.role);
                          }}
                          className="btn-secondary py-1 px-3 text-xs font-semibold"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Role</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-[#E8DED0] bg-[#FFFCF7] flex items-center justify-between text-xs text-[#796C60]">
          <span>Total Officers Cataloged: {users.length}</span>
          <span className="font-mono font-medium">Bcrypt password hashing (Work Factor 12)</span>
        </div>
      </div>
    </div>
  );
};

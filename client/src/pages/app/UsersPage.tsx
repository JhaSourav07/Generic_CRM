import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Edit2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { usersService } from '@/services/users.service';
import { rolesService } from '@/services/roles.service';
import { UserItem } from '@/types/users.types';
import { RoleItem } from '@/types/roles.types';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filters
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Deactivation confirmation modal state
  const [statusModalUser, setStatusModalUser] = useState<UserItem | null>(null);
  const [statusActionLoading, setStatusActionLoading] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      const data = await rolesService.getRoles();
      setRoles(data);
    } catch (_err) {
      console.error('Failed to load roles');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilterBool = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      const res = await usersService.getUsers({
        page,
        limit: 10,
        search: searchTerm || undefined,
        roleId: selectedRoleId || undefined,
        isActive: activeFilterBool
      });

      setUsers(res.users);
      setTotalCount(res.meta.total || 0);
      setTotalPages(res.meta.totalPages || Math.ceil((res.meta.total || 0) / 10) || 1);
    } catch (_err: any) {
      setError(_err.message || 'Unable to fetch user directory.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedRoleId, statusFilter]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      roleId: roles[0]?.id || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.roleId || user.role?.id || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name.trim() || !formData.email.trim() || !formData.roleId) {
      setFormError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        await usersService.updateUser(editingUser.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          roleId: formData.roleId,
          password: formData.password ? formData.password : undefined
        });
      } else {
        if (!formData.password) {
          setFormError('Password is required for new user creation.');
          setSubmitting(false);
          return;
        }
        await usersService.createUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          roleId: formData.roleId
        });
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (_err: any) {
      setFormError(_err.message || 'Operation failed. Check user attributes.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusModalUser) return;
    setStatusActionLoading(true);
    setStatusError(null);
    try {
      await usersService.toggleUserStatus(statusModalUser.id, !statusModalUser.isActive);
      setStatusModalUser(null);
      fetchUsers();
    } catch (_err: any) {
      setStatusError(_err.message || 'Action rejected server-side.');
    } finally {
      setStatusActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Users"
        description="Manage team members, roles, and account access."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Users' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} isLoading={loading} className="h-8">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="h-8">
              <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              Add user
            </Button>
          </div>
        }
      />

      {/* SEARCH AND FILTERS TOOLBAR */}
      <Card className="bg-vynexa-surface border-vynexa-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-vynexa-muted" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs bg-vynexa-bg border-vynexa-border"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-vynexa-muted hover:text-vynexa-text"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedRoleId}
                onChange={(e) => {
                  setSelectedRoleId(e.target.value);
                  setPage(1);
                }}
                className="h-9 text-xs bg-vynexa-bg border border-vynexa-border rounded-md px-3 text-vynexa-text focus:outline-none focus:border-vynexa-primary"
              >
                <option value="">All roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-9 text-xs bg-vynexa-bg border border-vynexa-border rounded-md px-3 text-vynexa-text focus:outline-none focus:border-vynexa-primary"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ERROR BANNER */}
      {error && (
        <Card className="bg-vynexa-surface border-vynexa-status-danger/40">
          <CardContent className="p-4 flex items-center gap-3 text-vynexa-status-danger">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="text-xs">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* USERS DATA TABLE */}
      <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-vynexa-text">
            <thead className="bg-vynexa-bg/50 border-b border-vynexa-border text-vynexa-muted font-mono uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vynexa-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-36" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-vynexa-muted">
                    <UsersIcon className="h-8 w-8 mx-auto mb-2 text-vynexa-muted/50" />
                    <p className="font-medium text-vynexa-text">No users found</p>
                    <p className="text-xs text-vynexa-muted mt-1">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const initials = u.name
                    ? u.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'U';

                  return (
                    <tr key={u.id} className="hover:bg-vynexa-bg/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-vynexa-bg border border-vynexa-border flex items-center justify-center font-mono font-bold text-xs text-vynexa-primary">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-vynexa-text">{u.name}</p>
                            <p className="text-vynexa-muted font-mono text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-mono text-[11px] gap-1 bg-vynexa-bg/60">
                          <Shield className="h-3 w-3 text-vynexa-primary" />
                          {u.role?.name || 'USER'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <Badge variant="emerald" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="red" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-vynexa-muted text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(u)}
                            className="h-7 px-2"
                            title="Edit user"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant={u.isActive ? 'danger' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setStatusError(null);
                              setStatusModalUser(u);
                            }}
                            className="h-7 text-[11px] px-2"
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {!loading && users.length > 0 && (
          <div className="p-4 border-t border-vynexa-border flex items-center justify-between text-xs text-vynexa-muted font-mono">
            <div>
              Showing {users.length} of {totalCount} members
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 px-2"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-vynexa-elevated border border-vynexa-border rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-vynexa-border flex items-center justify-between">
              <h3 className="font-semibold text-sm text-vynexa-text flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-vynexa-primary" />
                {editingUser ? 'Edit user' : 'Add user'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-vynexa-muted hover:text-vynexa-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="p-4 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-vynexa-status-danger/10 border border-vynexa-status-danger/30 rounded text-vynexa-status-danger flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-vynexa-muted mb-1 font-medium">Name *</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Sarah Connor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-vynexa-bg border-vynexa-border h-9"
                />
              </div>

              <div>
                <label className="block text-vynexa-muted mb-1 font-medium">Email *</label>
                <Input
                  type="email"
                  required
                  placeholder="e.g. sarah@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-vynexa-bg border-vynexa-border h-9"
                />
              </div>

              <div>
                <label className="block text-vynexa-muted mb-1 font-medium">Role *</label>
                <select
                  required
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full h-9 bg-vynexa-bg border border-vynexa-border rounded-md px-3 text-vynexa-text focus:outline-none focus:border-vynexa-primary"
                >
                  <option value="" disabled>Select a role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-vynexa-muted mb-1 font-medium">
                  {editingUser ? 'New password (leave blank to keep current)' : 'Password *'}
                </label>
                <Input
                  type="password"
                  required={!editingUser}
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-vynexa-bg border-vynexa-border h-9"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-vynexa-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submitting}
                >
                  {editingUser ? 'Save changes' : 'Add user'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOGGLE STATUS CONFIRMATION MODAL */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-vynexa-elevated border border-vynexa-border rounded-lg shadow-xl w-full max-w-md overflow-hidden p-5 space-y-4">
            <h3 className="font-semibold text-sm text-vynexa-text flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-vynexa-status-warning" />
              {statusModalUser.isActive ? 'Deactivate user' : 'Activate user'}
            </h3>

            {statusError && (
              <div className="p-3 bg-vynexa-status-danger/10 border border-vynexa-status-danger/30 rounded text-vynexa-status-danger text-xs">
                {statusError}
              </div>
            )}

            <p className="text-xs text-vynexa-muted">
              Are you sure you want to {statusModalUser.isActive ? 'deactivate' : 'activate'}{' '}
              <strong className="text-vynexa-text font-mono">{statusModalUser.name}</strong> ({statusModalUser.email})?{' '}
              {statusModalUser.isActive
                ? 'They will no longer be able to log in.'
                : 'They will be able to log in again.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-vynexa-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusModalUser(null)}
              >
                Cancel
              </Button>
              <Button
                variant={statusModalUser.isActive ? 'danger' : 'primary'}
                size="sm"
                isLoading={statusActionLoading}
                onClick={handleToggleStatus}
              >
                {statusModalUser.isActive ? 'Deactivate user' : 'Activate user'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

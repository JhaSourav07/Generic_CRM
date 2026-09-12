import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  X,
  Lock,
  Users
} from 'lucide-react';
import { rolesService } from '@/services/roles.service';
import { RoleItem, PermissionItem } from '@/types/roles.types';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Role Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleName, setRoleName] = useState<string>('');
  const [roleDesc, setRoleDesc] = useState<string>('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Delete confirmation modal state
  const [deletingRole, setDeletingRole] = useState<RoleItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesData, permsData] = await Promise.all([
        rolesService.getRoles(),
        rolesService.getPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (_err: any) {
      setError(_err.message || 'Failed to load roles and permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Group permissions by resource
  const groupedPermissions: Record<string, PermissionItem[]> = {};
  permissions.forEach((p) => {
    const resKey = p.resource.toLowerCase();
    if (!groupedPermissions[resKey]) {
      groupedPermissions[resKey] = [];
    }
    groupedPermissions[resKey].push(p);
  });

  const availableResources = Object.keys(groupedPermissions).sort();

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDesc('');
    setSelectedPermissionIds([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (role: RoleItem) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setFormError(null);

    if (role.permissions && role.permissions.length > 0) {
      setSelectedPermissionIds(role.permissions.map((p) => p.id));
      setIsModalOpen(true);
    } else {
      try {
        const fullRole = await rolesService.getRoleById(role.id);
        setSelectedPermissionIds((fullRole.permissions || []).map((p) => p.id));
      } catch (_err) {
        setSelectedPermissionIds([]);
      } finally {
        setIsModalOpen(true);
      }
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleAllForResource = (resource: string) => {
    const resourcePermIds = (groupedPermissions[resource] || []).map((p) => p.id);
    const allSelected = resourcePermIds.every((id) => selectedPermissionIds.includes(id));

    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !resourcePermIds.includes(id)));
    } else {
      const combined = new Set([...selectedPermissionIds, ...resourcePermIds]);
      setSelectedPermissionIds(Array.from(combined));
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!roleName.trim()) {
      setFormError('Role name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingRole) {
        await rolesService.updateRole(editingRole.id, {
          name: roleName.trim(),
          description: roleDesc.trim() || undefined,
          permissionIds: selectedPermissionIds
        });
      } else {
        await rolesService.createRole({
          name: roleName.trim(),
          description: roleDesc.trim() || undefined,
          permissionIds: selectedPermissionIds
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (_err: any) {
      setFormError(_err.message || 'Failed to save role configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await rolesService.deleteRole(deletingRole.id);
      setDeletingRole(null);
      fetchData();
    } catch (_err: any) {
      setDeleteError(_err.message || 'Cannot delete role.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Roles & Access Control (RBAC)"
        description="Configure tenant role definitions and fine-grained resource permission matrix."
        breadcrumbs={[
          { label: 'Workspace', href: '/app/dashboard' },
          { label: 'Roles & Permissions' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} isLoading={loading} className="h-8">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Custom Role
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="bg-vynexa-surface border-vynexa-status-danger/40">
          <CardContent className="p-4 flex items-center gap-3 text-vynexa-status-danger">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="text-xs">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* ROLES CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="bg-vynexa-surface border-vynexa-border p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))
        ) : (
          roles.map((r) => {
            const isSystemRole = r.isSystemRole ?? (!r.organizationId);
            const permCount = r.permissionCount ?? (r.permissions?.length || 0);
            const userCount = r.userCount ?? (r._count?.users ?? 0);

            return (
              <Card
                key={r.id}
                className="bg-vynexa-surface border-vynexa-border hover:border-vynexa-border/80 transition-colors flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-md bg-vynexa-bg border border-vynexa-border text-vynexa-primary">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-vynexa-text flex items-center gap-1.5">
                          {r.name}
                        </CardTitle>
                        <CardDescription className="text-[11px] text-vynexa-muted mt-0.5 line-clamp-2">
                          {r.description || 'No description provided.'}
                        </CardDescription>
                      </div>
                    </div>
                    {isSystemRole ? (
                      <Badge variant="outline" className="text-[10px] font-mono gap-1 shrink-0 bg-vynexa-bg/80">
                        <Lock className="h-2.5 w-2.5 text-vynexa-muted" />
                        System
                      </Badge>
                    ) : (
                      <Badge variant="blue" className="text-[10px] font-mono shrink-0">
                        Custom
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center justify-between text-xs border-t border-b border-vynexa-border py-2 text-vynexa-muted font-mono">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-vynexa-muted" />
                      <span>{userCount} {userCount === 1 ? 'user' : 'users'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-vynexa-primary" />
                      <span>{permCount} permissions</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(r)}
                      disabled={isSystemRole}
                      className="h-7 text-xs px-2.5"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      {isSystemRole ? 'Protected' : 'Edit Matrix'}
                    </Button>
                    {!isSystemRole && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingRole(r);
                        }}
                        className="h-7 text-xs px-2"
                        title="Delete Role"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT ROLE & PERMISSION MATRIX MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-vynexa-elevated border border-vynexa-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-vynexa-border flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-sm text-vynexa-text flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-vynexa-primary" />
                {editingRole ? `Edit Role: ${editingRole.name}` : 'Create Custom Tenant Role'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-vynexa-muted hover:text-vynexa-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {formError && (
                <div className="p-3 bg-vynexa-status-danger/10 border border-vynexa-status-danger/30 rounded text-vynexa-status-danger flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-vynexa-muted mb-1 font-medium">Role Name *</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Senior Account Executive"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="bg-vynexa-bg border-vynexa-border h-9"
                  />
                </div>
                <div>
                  <label className="block text-vynexa-muted mb-1 font-medium">Description</label>
                  <Input
                    type="text"
                    placeholder="Brief scope summary..."
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    className="bg-vynexa-bg border-vynexa-border h-9"
                  />
                </div>
              </div>

              {/* PERMISSION MATRIX TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-vynexa-text">Resource Permission Matrix</h4>
                  <span className="font-mono text-vynexa-muted text-[11px]">
                    {selectedPermissionIds.length} permissions selected
                  </span>
                </div>

                <div className="border border-vynexa-border rounded-md overflow-hidden bg-vynexa-surface">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-vynexa-bg border-b border-vynexa-border text-vynexa-muted font-mono uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Resource Domain</th>
                          <th className="py-2.5 px-4">Available Actions</th>
                          <th className="py-2.5 px-4 text-right">Toggle All</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-vynexa-border">
                        {availableResources.map((resKey) => {
                          const resPerms = groupedPermissions[resKey] || [];
                          const allSelected = resPerms.every((p) => selectedPermissionIds.includes(p.id));

                          return (
                            <tr key={resKey} className="hover:bg-vynexa-bg/30 transition-colors">
                              <td className="py-3 px-4 font-mono font-medium text-vynexa-text capitalize">
                                {resKey}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-3">
                                  {resPerms.map((p) => {
                                    const isChecked = selectedPermissionIds.includes(p.id);
                                    return (
                                      <label
                                        key={p.id}
                                        className={`flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                                          isChecked
                                            ? 'bg-vynexa-primary/10 border-vynexa-primary/40 text-vynexa-text font-semibold'
                                            : 'bg-vynexa-bg border-vynexa-border text-vynexa-muted hover:text-vynexa-text'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => togglePermission(p.id)}
                                          className="rounded border-vynexa-border text-vynexa-primary focus:ring-0 accent-vynexa-primary"
                                        />
                                        {p.action}
                                      </label>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => toggleAllForResource(resKey)}
                                  className="text-[11px] text-vynexa-muted hover:text-vynexa-primary font-mono underline"
                                >
                                  {allSelected ? 'Deselect Resource' : 'Select All'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </form>

            <div className="p-4 border-t border-vynexa-border flex items-center justify-end gap-2 bg-vynexa-surface shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={submitting}
                onClick={handleSubmitModal}
              >
                {editingRole ? 'Save Role Matrix' : 'Create Role'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-vynexa-elevated border border-vynexa-border rounded-lg shadow-xl w-full max-w-md p-5 space-y-4">
            <h3 className="font-semibold text-sm text-vynexa-text flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-vynexa-status-danger" />
              Delete Custom Role
            </h3>

            {deleteError && (
              <div className="p-3 bg-vynexa-status-danger/10 border border-vynexa-status-danger/30 rounded text-vynexa-status-danger text-xs">
                {deleteError}
              </div>
            )}

            <p className="text-xs text-vynexa-muted">
              Are you sure you want to delete custom role{' '}
              <strong className="text-vynexa-text font-mono">{deletingRole.name}</strong>?
              This action is permanent and will fail if active users are assigned to this role.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-vynexa-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingRole(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteLoading}
                onClick={handleDeleteRole}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

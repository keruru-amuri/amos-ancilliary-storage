import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Shield, X, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';
import api, { type WorkingGroup, type UserGroupAssignment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'groups' | 'users'>('groups');
  const [groups, setGroups] = useState<WorkingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<WorkingGroup | null>(null);
  const [groupUsers, setGroupUsers] = useState<UserGroupAssignment[]>([]);
  
  // Form states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [editingGroup, setEditingGroup] = useState<WorkingGroup | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // User assignment states
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadGroups();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupUsers(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await api.workingGroups.list();
      setGroups(response.groups);
    } catch (error: any) {
      toast.error('Failed to load working groups: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const loadGroupUsers = async (groupId: string) => {
    try {
      const response = await api.userGroupAssignments.getGroupUsers(groupId);
      setGroupUsers(response.users);
    } catch (error: any) {
      toast.error('Failed to load group users: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const response = await api.workingGroups.create(newGroupName, newGroupDescription);
      toast.success('Working group created successfully');
      setGroups([...groups, response.group]);
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDescription('');
    } catch (error: any) {
      toast.error('Failed to create group: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !editName.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      const response = await api.workingGroups.update(editingGroup.id, editName, editDescription);
      toast.success('Working group updated successfully');
      setGroups(groups.map(g => g.id === editingGroup.id ? response.group : g));
      if (selectedGroup?.id === editingGroup.id) {
        setSelectedGroup(response.group);
      }
      setEditingGroup(null);
      setEditName('');
      setEditDescription('');
    } catch (error: any) {
      toast.error('Failed to update group: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this working group?')) {
      return;
    }

    try {
      await api.workingGroups.delete(groupId);
      toast.success('Working group deleted successfully');
      setGroups(groups.filter(g => g.id !== groupId));
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    } catch (error: any) {
      toast.error('Failed to delete group: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddUser = async () => {
    if (!selectedGroup || !newUserEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    try {
      await api.userGroupAssignments.assign(newUserEmail, selectedGroup.id);
      toast.success('User assigned to group successfully');
      loadGroupUsers(selectedGroup.id);
      setShowAddUser(false);
      setNewUserEmail('');
    } catch (error: any) {
      toast.error('Failed to assign user: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRemoveUser = async (userEmail: string) => {
    if (!selectedGroup) return;

    if (!confirm(`Remove ${userEmail} from this group?`)) {
      return;
    }

    try {
      await api.userGroupAssignments.remove(userEmail, selectedGroup.id);
      toast.success('User removed from group successfully');
      loadGroupUsers(selectedGroup.id);
    } catch (error: any) {
      toast.error('Failed to remove user: ' + (error.message || 'Unknown error'));
    }
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg shadow-lg p-6 max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Access Denied
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-muted-foreground">
            You need administrator privileges to access settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          <button
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'groups'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('groups')}
          >
            Working Groups
          </button>
          <button
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('users')}
          >
            User Assignments
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'groups' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-muted-foreground">
                  Manage working groups for organizing user permissions.
                </p>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Create Group
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No working groups yet. Create one to get started.
                </div>
              ) : (
                <div className="grid gap-4">
                  {groups.map(group => (
                    <div
                      key={group.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      {editingGroup?.id === group.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            placeholder="Group name"
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none"
                            rows={2}
                            placeholder="Description (optional)"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateGroup}
                              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingGroup(null);
                                setEditName('');
                                setEditDescription('');
                              }}
                              className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{group.name}</h3>
                              {group.description && (
                                <p className="text-muted-foreground text-sm mt-1">{group.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                Created by {group.createdBy} on {new Date(group.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingGroup(group);
                                  setEditName(group.name);
                                  setEditDescription(group.description);
                                }}
                                className="p-2 hover:bg-muted rounded transition-colors"
                                title="Edit group"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors"
                                title="Delete group"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Create Group Modal */}
              {showCreateGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full">
                    <h3 className="text-xl font-semibold mb-4">Create Working Group</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Group Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                          placeholder="e.g., Engineering Team"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={newGroupDescription}
                          onChange={(e) => setNewGroupDescription(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none"
                          rows={3}
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={handleCreateGroup}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateGroup(false);
                          setNewGroupName('');
                          setNewGroupDescription('');
                        }}
                        className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Groups List */}
              <div>
                <h3 className="font-semibold mb-3">Select a Group</h3>
                {groups.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No groups available.</p>
                ) : (
                  <div className="space-y-2">
                    {groups.map(group => (
                      <button
                        key={group.id}
                        onClick={() => setSelectedGroup(group)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedGroup?.id === group.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted'
                        }`}
                      >
                        <div className="font-medium">{group.name}</div>
                        {group.description && (
                          <div className="text-sm text-muted-foreground mt-1">{group.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Users in Selected Group */}
              <div>
                {selectedGroup ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Users in {selectedGroup.name}</h3>
                      <button
                        onClick={() => setShowAddUser(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Add User
                      </button>
                    </div>
                    {groupUsers.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No users in this group yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {groupUsers.map(user => (
                          <div
                            key={user.userEmail}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div>
                              <div className="font-medium">{user.userEmail}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Added by {user.assignedBy}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveUser(user.userEmail)}
                              className="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors"
                              title="Remove user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add User Modal */}
                    {showAddUser && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full">
                          <h3 className="text-xl font-semibold mb-4">Add User to {selectedGroup.name}</h3>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              User Email <span className="text-destructive">*</span>
                            </label>
                            <input
                              type="email"
                              value={newUserEmail}
                              onChange={(e) => setNewUserEmail(e.target.value)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                              placeholder="user@example.com"
                            />
                          </div>
                          <div className="flex gap-2 mt-6">
                            <button
                              onClick={handleAddUser}
                              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                            >
                              Add User
                            </button>
                            <button
                              onClick={() => {
                                setShowAddUser(false);
                                setNewUserEmail('');
                              }}
                              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Select a group to manage users.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

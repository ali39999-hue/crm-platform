'use client';

import React, { useState, useEffect } from 'react';
import type {
  CreateTeamRequest,
  OrganizationMemberDto,
  TeamDto,
} from '@crm/contracts';
import { apiClient } from '../lib/api-client';

interface TeamsManagerViewProps {
  onNotify?: ((msg: string, type?: 'success' | 'error') => void) | undefined;
}

export function TeamsManagerView({ onNotify }: TeamsManagerViewProps) {
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [loading, setLoading] = useState(true);

  // New Team Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [leadMemberId, setLeadMemberId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Add Member to specific team state
  const [activeTeamForAdd, setActiveTeamForAdd] = useState<TeamDto | null>(null);
  const [memberToAddId, setMemberToAddId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsRes, membersRes] = await Promise.all([
        apiClient.getTeams(),
        apiClient.getOrganizationMembers(),
      ]);
      setTeams(teamsRes);
      setMembers(membersRes.filter((m) => m.active));
      if (membersRes.length > 0 && !leadMemberId) {
        setLeadMemberId(membersRes[0]!.id);
      }
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در بارگذاری تیم‌ها', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    try {
      setSubmitting(true);
      const req: CreateTeamRequest = {
        name: teamName.trim(),
        description: description.trim() || undefined,
        leadMemberId: leadMemberId || undefined,
        memberIds: selectedMemberIds,
      };

      const created = await apiClient.createTeam(req);
      setTeams((prev) => [...prev, created]);
      setIsModalOpen(false);
      setTeamName('');
      setDescription('');
      setSelectedMemberIds([]);
      onNotify?.(`تیم «${created.name}» با موفقیت تشکیل شد`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در ایجاد تیم', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMemberToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamForAdd || !memberToAddId) return;

    try {
      const updated = await apiClient.addTeamMember(activeTeamForAdd.id, memberToAddId);
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setActiveTeamForAdd(null);
      setMemberToAddId('');
      onNotify?.('عضو جدید به تیم اضافه شد', 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در افزودن عضو به تیم', 'error');
    }
  };

  const handleRemoveMemberFromTeam = async (teamId: string, memberId: string) => {
    try {
      const updated = await apiClient.removeTeamMember(teamId, memberId);
      setTeams((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      onNotify?.('عضو از تیم حذف شد', 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در حذف عضو', 'error');
    }
  };

  const handleDeleteTeam = async (team: TeamDto) => {
    if (!window.confirm(`آیا از انحلال و حذف تیم «${team.name}» مطمئن هستید؟`)) return;

    try {
      await apiClient.deleteTeam(team.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      onNotify?.(`تیم «${team.name}» حذف گردید`, 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'خطا در حذف تیم', 'error');
    }
  };

  const getMemberName = (id: string) => {
    return members.find((m) => m.id === id)?.displayName || 'عضو سازمان';
  };

  return (
    <div className="space-y-4" data-testid="teams-manager-view">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>👥</span>
            <span>مدیریت دپارتمان‌ها و تیم‌های سازمانی (Teams & Routing)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            تعیین ساختار تیم‌ها، سرپرست دپارتمان، ارجاع خودکار تیکت‌ها و تخصیص گروهی وظایف
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          data-testid="create-team-btn"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow"
        >
          <span>+</span>
          <span>تشکیل تیم جدید</span>
        </button>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">در حال بارگذاری تیم‌ها...</div>
      ) : teams.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          هنوز تیمی برای این سازمان تعریف نشده است.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="teams-grid">
          {teams.map((team) => (
            <div
              key={team.id}
              data-testid={`team-card-${team.id}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{team.name}</h4>
                    <span className="font-mono text-[11px] text-indigo-400">{team.slug}</span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {team.membersCount} عضو
                  </span>
                </div>

                {team.description && (
                  <p className="text-xs text-slate-400 leading-relaxed">{team.description}</p>
                )}

                <div className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="text-[11px] text-slate-500">
                    سرپرست / Lead تیم:{' '}
                    <strong className="text-indigo-300">{team.leadMemberName || 'تعیین‌نشده'}</strong>
                  </div>

                  {/* Members Chips */}
                  <div className="pt-1.5">
                    <span className="text-[11px] text-slate-500 block mb-1">اعضای تیم:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {team.memberIds.map((memId) => (
                        <span
                          key={memId}
                          data-testid={`team-member-chip-${memId}`}
                          className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px] border border-slate-700/60 flex items-center gap-1.5"
                        >
                          <span>{getMemberName(memId)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMemberFromTeam(team.id, memId)}
                            className="text-slate-400 hover:text-rose-400 text-xs"
                            title="حذف از تیم"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTeamForAdd(team);
                    setMemberToAddId(members[0]?.id || '');
                  }}
                  data-testid={`add-member-to-team-btn-${team.id}`}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-xs transition-colors flex items-center gap-1"
                >
                  <span>+</span>
                  <span>افزودن عضو</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTeam(team)}
                  data-testid={`delete-team-btn-${team.id}`}
                  className="px-2.5 py-1 text-rose-400 hover:text-rose-300 text-xs transition-colors"
                >
                  انحلال تیم
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="create-team-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base">تشکیل تیم / دپارتمان جدید</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">نام تیم *</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="مثال: تیم بازاریابی و رشد (Growth)"
                  data-testid="team-name-input"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">شرح وظایف و اهداف</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات پیرامون دامنه کاری تیم..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">سرپرست تیم (Lead)</label>
                <select
                  value={leadMemberId}
                  onChange={(e) => setLeadMemberId(e.target.value)}
                  data-testid="team-lead-select"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">بدون سرپرست</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.displayName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-team-btn"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                >
                  {submitting ? 'در حال ثبت...' : 'تشکیل تیم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {activeTeamForAdd && (
        <div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          data-testid="add-member-modal"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm">افزودن عضو به تیم «{activeTeamForAdd.name}»</h3>
              <button
                type="button"
                onClick={() => setActiveTeamForAdd(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemberToTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  انتخاب عضو سازمان
                </label>
                <select
                  value={memberToAddId}
                  onChange={(e) => setMemberToAddId(e.target.value)}
                  data-testid="select-member-to-add"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  {members
                    .filter((m) => !activeTeamForAdd.memberIds.includes(m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} ({m.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTeamForAdd(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  data-testid="confirm-add-member-btn"
                  className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
                >
                  افزودن به تیم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamsManagerView;

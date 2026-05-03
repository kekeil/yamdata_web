'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedAuth } from '@/lib/hooks/useOptimizedAuth';
import Modal from '@/components/ui/Modal';

const SYSTEM_SEGMENT_CODES = ['all', 'new_7j', 'active_30j', 'no_pot', 'no_auto_pot'] as const;

type SegmentType = 'dynamic' | 'manual' | string;

interface UserSegmentRow {
  id: string;
  name: string;
  description: string | null;
  type: SegmentType;
  code: string | null;
}

interface ProfilePick {
  id: string;
  email: string | null;
  full_name: string | null;
}

function sanitizeIlikeInput(q: string): string {
  return q
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/"/g, '')
    .replace(/,/g, '')
    .slice(0, 80);
}

function isSystemSegment(row: UserSegmentRow): boolean {
  return row.code != null && SYSTEM_SEGMENT_CODES.includes(row.code as (typeof SYSTEM_SEGMENT_CODES)[number]);
}

function typeLabel(t: string): string {
  if (t === 'dynamic') return 'Dynamique';
  if (t === 'manual') return 'Manuel';
  return t;
}

function typeBadgeClass(t: string): string {
  if (t === 'dynamic') return 'bg-blue-100 text-blue-800';
  if (t === 'manual') return 'bg-gray-100 text-gray-800';
  return 'bg-gray-100 text-gray-600';
}

async function countManualMembers(segmentId: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_segment_members')
    .select('*', { count: 'exact', head: true })
    .eq('segment_id', segmentId);
  if (error) return 0;
  return count ?? 0;
}

/** Comptages dynamiques pour les segments système (codes connus). */
async function countDynamicMembers(code: string | null): Promise<number | null> {
  if (!code) return null;

  const now = new Date();
  const iso7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = now.toISOString().slice(0, 10);

  try {
    switch (code) {
      case 'all': {
        const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (error) return null;
        return count ?? 0;
      }
      case 'new_7j': {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', iso7);
        if (error) return null;
        return count ?? 0;
      }
      case 'active_30j': {
        const { data, error } = await supabase.from('subscriptions').select('user_id').gte('expiration_date', today);
        if (error) return null;
        const unique = new Set((data ?? []).map((r: { user_id: string }) => r.user_id));
        return unique.size;
      }
      case 'no_pot':
      case 'no_auto_pot': {
        const { count: total, error: eTotal } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        if (eTotal || total == null) return null;
        if (total > 5000) return null;

        const { data: profiles, error: eProf } = await supabase.from('profiles').select('id');
        if (eProf || !profiles) return null;

        const { data: savings, error: eSav } = await supabase.from('user_savings').select('user_id, balance');
        if (eSav) return null;

        if (code === 'no_pot') {
          const withAnySaving = new Set((savings ?? []).map((s: { user_id: string }) => s.user_id));
          return profiles.filter((p: { id: string }) => !withAnySaving.has(p.id)).length;
        }

        const withPositiveBalance = new Set(
          (savings ?? [])
            .filter((s: { balance: number }) => s.balance > 0)
            .map((s: { user_id: string }) => s.user_id),
        );
        return profiles.filter((p: { id: string }) => !withPositiveBalance.has(p.id)).length;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export default function NotificationSegmentsPage() {
  const { isAdmin, isLoading: authLoading, isAuthenticated } = useOptimizedAuth({
    requireAuth: true,
    requireAdmin: true,
  });

  const [segments, setSegments] = useState<UserSegmentRow[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number | null>>({});
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<ProfilePick[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<ProfilePick[]>([]);

  const selectedIds = useMemo(() => new Set(selectedUsers.map((u) => u.id)), [selectedUsers]);

  const loadSegments = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_segments')
        .select('id, name, description, type, code')
        .order('name');

      if (error) throw error;
      const rows = (data as UserSegmentRow[]) ?? [];
      setSegments(rows);

      const counts: Record<string, number | null> = {};
      await Promise.all(
        rows.map(async (row) => {
          if (row.type === 'manual') {
            counts[row.id] = await countManualMembers(row.id);
          } else if (row.type === 'dynamic') {
            counts[row.id] = await countDynamicMembers(row.code);
          } else {
            counts[row.id] = null;
          }
        }),
      );
      setMemberCounts(counts);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de charger les segments.';
      setListError(msg);
      setSegments([]);
      setMemberCounts({});
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      void loadSegments();
    }
  }, [authLoading, isAuthenticated, isAdmin, loadSegments]);

  useEffect(() => {
    if (!showModal) return;
    const q = userSearchQuery.trim();
    if (q.length < 1) {
      setUserSearchResults([]);
      return;
    }

    const handle = window.setTimeout(() => {
      void (async () => {
        setUserSearchLoading(true);
        try {
          const safe = sanitizeIlikeInput(q);
          const pattern = `%${safe}%`;
          const quoted = `"${pattern.replace(/"/g, ' ')}"`;
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .or(`email.ilike.${quoted},full_name.ilike.${quoted}`)
            .limit(20);

          if (error) throw error;
          const rows = (data as ProfilePick[]) ?? [];
          setUserSearchResults(rows.filter((r) => !selectedIds.has(r.id)));
        } catch {
          setUserSearchResults([]);
        } finally {
          setUserSearchLoading(false);
        }
      })();
    }, 300);

    return () => window.clearTimeout(handle);
  }, [userSearchQuery, showModal, selectedIds]);

  function openCreateModal() {
    setCreateError(null);
    setFormName('');
    setFormDescription('');
    setUserSearchQuery('');
    setUserSearchResults([]);
    setSelectedUsers([]);
    setShowModal(true);
  }

  function closeModal() {
    if (createLoading) return;
    setShowModal(false);
  }

  function addSelectedUser(u: ProfilePick) {
    if (selectedUsers.length >= 500) return;
    if (selectedIds.has(u.id)) return;
    setSelectedUsers((prev) => [...prev, u]);
    setUserSearchResults((prev) => prev.filter((r) => r.id !== u.id));
  }

  function removeSelectedUser(id: string) {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleCreateSegment() {
    setCreateError(null);
    const name = formName.trim();
    if (!name) {
      setCreateError('Le nom est requis.');
      return;
    }
    if (selectedUsers.length < 1) {
      setCreateError('Ajoutez au moins un membre.');
      return;
    }

    setCreateLoading(true);
    try {
      const { data: existing, error: exErr } = await supabase
        .from('user_segments')
        .select('id')
        .eq('name', name)
        .maybeSingle();
      if (exErr) throw exErr;
      if (existing) {
        setCreateError('Un segment avec ce nom existe déjà.');
        setCreateLoading(false);
        return;
      }

      const { data: inserted, error: insErr } = await supabase
        .from('user_segments')
        .insert({
          name,
          description: formDescription.trim() || null,
          type: 'manual',
          code: null,
        })
        .select('id')
        .single();

      if (insErr) throw insErr;
      const segmentId = (inserted as { id: string } | null)?.id;
      if (!segmentId) throw new Error('Segment créé sans identifiant.');

      const rows = selectedUsers.map((u) => ({ segment_id: segmentId, user_id: u.id }));
      const chunk = 500;
      for (let i = 0; i < rows.length; i += chunk) {
        const { error: memErr } = await supabase.from('user_segment_members').insert(rows.slice(i, i + chunk));
        if (memErr) throw memErr;
      }

      setShowModal(false);
      await loadSegments();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la création.';
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete(row: UserSegmentRow) {
    if (isSystemSegment(row)) return;
    if (!window.confirm(`Supprimer le segment « ${row.name} » ?`)) return;
    try {
      const { error: mErr } = await supabase.from('user_segment_members').delete().eq('segment_id', row.id);
      if (mErr) throw mErr;
      const { error: sErr } = await supabase.from('user_segments').delete().eq('id', row.id);
      if (sErr) throw sErr;
      await loadSegments();
    } catch (e: unknown) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : 'Suppression impossible.');
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Accès refusé</h1>
          <p className="text-gray-500">Vous n&apos;avez pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/dashboard/notifications"
          className="text-sm font-medium text-green-700 hover:text-green-800"
        >
          ← Notifications
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Segments de ciblage</h1>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Segment manuel
        </button>
      </div>

      {listError && <div className="text-sm text-red-600">{listError}</div>}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Liste des segments</h2>
        </div>

        {listLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mx-auto" />
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nom
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Membres
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {segments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Aucun segment
                  </td>
                </tr>
              ) : (
                segments.map((row) => {
                  const n = memberCounts[row.id];
                  const countDisplay = n === null || n === undefined ? '—' : String(n);
                  const canDelete = !isSystemSegment(row);

                  return (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                        {row.description?.trim() ? row.description : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeBadgeClass(
                            String(row.type),
                          )}`}
                        >
                          {typeLabel(String(row.type))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{countDisplay}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => void handleDelete(row)}
                            className="text-red-600 hover:text-red-900"
                            aria-label={`Supprimer ${row.name}`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Système</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title="Créer un segment manuel" size="xl">
        <form
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
          onSubmit={(e) => {
            e.preventDefault();
            void handleCreateSegment();
          }}
        >
          <div>
            <label htmlFor="seg-name" className="block text-sm font-medium text-gray-700">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="seg-name"
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={createLoading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="seg-desc" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="seg-desc"
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              disabled={createLoading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>

          <div className="space-y-3 rounded-md border border-gray-200 p-3 bg-gray-50">
            <p className="text-sm font-medium text-gray-800">Membres du segment</p>
            <p className="text-xs text-gray-500">
              Recherche sur profils (email, nom). Maximum 500 membres ({selectedUsers.length}/500).
            </p>
            <input
              type="search"
              placeholder="Rechercher par email ou nom..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              disabled={createLoading}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm bg-white"
            />
            {userSearchLoading && <p className="text-xs text-gray-500">Recherche...</p>}
            {!userSearchLoading && userSearchQuery.trim().length >= 1 && userSearchResults.length > 0 && (
              <ul className="max-h-40 overflow-y-auto rounded border border-gray-200 bg-white divide-y divide-gray-100">
                {userSearchResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => addSelectedUser(p)}
                      disabled={createLoading || selectedUsers.length >= 500}
                    >
                      <span className="font-medium text-gray-900">{p.full_name || 'Sans nom'}</span>
                      <span className="block text-xs text-gray-500">{p.email || '—'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!userSearchLoading && userSearchQuery.trim().length >= 1 && userSearchResults.length === 0 && (
              <p className="text-xs text-gray-500">Aucun résultat.</p>
            )}

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-900 pl-2 pr-1 py-0.5 text-xs font-medium"
                  >
                    {u.full_name || u.email || u.id.slice(0, 8)}
                    <button
                      type="button"
                      className="rounded-full p-0.5 hover:bg-green-200 focus:outline-none"
                      onClick={() => removeSelectedUser(u.id)}
                      disabled={createLoading}
                      aria-label={`Retirer ${u.email ?? u.id}`}
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {createError && <div className="text-sm text-red-600">{createError}</div>}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
              onClick={closeModal}
              disabled={createLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
              disabled={createLoading}
            >
              {createLoading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

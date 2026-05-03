'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedAuth } from '@/lib/hooks/useOptimizedAuth';
import Modal from '@/components/ui/Modal';

type CampaignStatus = 'draft' | 'sending' | 'sent' | 'failed' | string;
type TargetType = 'all' | 'segment' | 'user_list';

interface NotificationCampaign {
  id: string;
  title: string;
  target_type: TargetType | string;
  sent_count: number | null;
  status: CampaignStatus;
  sent_at: string | null;
  created_at: string;
}

interface UserSegmentRow {
  id: string;
  name: string;
}

interface ProfilePick {
  id: string;
  email: string | null;
  full_name: string | null;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'sending':
      return 'bg-yellow-100 text-yellow-800';
    case 'sent':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function targetTypeLabel(targetType: string): string {
  switch (targetType) {
    case 'all':
      return 'Tous les utilisateurs';
    case 'segment':
      return 'Segment';
    case 'user_list':
      return 'Utilisateurs spécifiques';
    default:
      return targetType;
  }
}

function formatCampaignDate(sentAt: string | null, createdAt: string): string {
  const raw = sentAt ?? createdAt;
  try {
    return new Date(raw).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return raw;
  }
}

function sanitizeIlikeInput(q: string): string {
  return q
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/"/g, '')
    .replace(/,/g, '')
    .slice(0, 80);
}

export default function AdminNotificationsPage() {
  const { user, isAdmin, isLoading: authLoading, isAuthenticated } = useOptimizedAuth({
    requireAuth: true,
    requireAdmin: true,
  });

  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [segmentId, setSegmentId] = useState<string>('');
  const [segments, setSegments] = useState<UserSegmentRow[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<ProfilePick[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<ProfilePick[]>([]);

  const selectedIds = useMemo(() => new Set(selectedUsers.map((u) => u.id)), [selectedUsers]);

  const loadCampaigns = useCallback(async () => {
    setCampaignsError(null);
    setCampaignsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_campaigns')
        .select('id, title, target_type, sent_count, status, sent_at, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCampaigns((data as NotificationCampaign[]) ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de charger les campagnes.';
      setCampaignsError(msg);
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  const loadSegments = useCallback(async () => {
    setSegmentsLoading(true);
    try {
      const { data, error } = await supabase.from('user_segments').select('id, name').order('name');
      if (error) throw error;
      setSegments((data as UserSegmentRow[]) ?? []);
    } catch {
      setSegments([]);
    } finally {
      setSegmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      void loadCampaigns();
    }
  }, [authLoading, isAuthenticated, isAdmin, loadCampaigns]);

  useEffect(() => {
    if (!showModal || targetType !== 'user_list') {
      return;
    }
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
  }, [userSearchQuery, showModal, targetType, selectedIds]);

  function openModal() {
    setSendError(null);
    setTitle('');
    setMessage('');
    setTargetType('all');
    setSegmentId('');
    setUserSearchQuery('');
    setUserSearchResults([]);
    setSelectedUsers([]);
    setShowModal(true);
    void loadSegments();
  }

  function closeModal() {
    if (sendLoading) return;
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

  async function handleSend() {
    setSendError(null);

    const t = title.trim();
    const m = message.trim();
    if (!t || t.length > 100) {
      setSendError('Le titre est requis (100 caractères max).');
      return;
    }
    if (!m || m.length > 500) {
      setSendError('Le message est requis (500 caractères max).');
      return;
    }
    if (targetType === 'segment' && !segmentId) {
      setSendError('Veuillez choisir un segment.');
      return;
    }
    if (targetType === 'user_list') {
      if (selectedUsers.length === 0) {
        setSendError('Sélectionnez au moins un utilisateur.');
        return;
      }
    }

    if (!user?.id) {
      setSendError('Session invalide.');
      return;
    }

    setSendLoading(true);
    try {
      const target_users =
        targetType === 'user_list' ? selectedUsers.map((u) => u.id) : null;
      const segId = targetType === 'segment' ? segmentId : null;

      const insertRow = {
        title: t,
        body: m,
        target_type: targetType,
        segment_id: segId,
        target_users,
        status: 'draft' as const,
        created_by: user.id,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('notification_campaigns')
        .insert(insertRow)
        .select('id')
        .single();

      if (insertError) throw insertError;
      const campaign_id = (inserted as { id: string } | null)?.id;
      if (!campaign_id) throw new Error('Campagne créée sans identifiant.');

      const fnRes = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'campaign',
          campaign_id,
          title: t,
          body: m,
          target_type: targetType,
          segment_id: segId ?? undefined,
          target_users: target_users ?? undefined,
          created_by: user.id,
        }),
      });
      if (!fnRes.ok) {
        const errData = await fnRes.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de l'envoi.");
      }

      setShowModal(false);
      await loadCampaigns();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur lors de l'envoi.";
      setSendError(msg);
    } finally {
      setSendLoading(false);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouvelle notification
        </button>
      </div>

      {campaignsError && <div className="text-sm text-red-600">{campaignsError}</div>}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Campagnes récentes</h2>
        </div>

        {campaignsLoading ? (
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
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Titre
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cible
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Envoyées
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Statut
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
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucune campagne pour le moment
                  </td>
                </tr>
              ) : (
                campaigns.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCampaignDate(row.sent_at, row.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">
                      {row.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {targetTypeLabel(String(row.target_type))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.sent_count ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadgeClass(
                          String(row.status),
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title="Nouvelle notification" size="xl">
        <form
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <div>
            <label htmlFor="notif-title" className="block text-sm font-medium text-gray-700">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              id="notif-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={sendLoading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
            <p className="mt-0.5 text-xs text-gray-400">{title.length}/100</p>
          </div>

          <div>
            <label htmlFor="notif-message" className="block text-sm font-medium text-gray-700">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="notif-message"
              required
              maxLength={500}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sendLoading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
            <p className="mt-0.5 text-xs text-gray-400">{message.length}/500</p>
          </div>

          <div>
            <label htmlFor="notif-target" className="block text-sm font-medium text-gray-700">
              Cible
            </label>
            <select
              id="notif-target"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as TargetType)}
              disabled={sendLoading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="segment">Segment</option>
              <option value="user_list">Utilisateurs spécifiques</option>
            </select>
          </div>

          {targetType === 'segment' && (
            <div>
              <label htmlFor="notif-segment" className="block text-sm font-medium text-gray-700">
                Segment
              </label>
              <select
                id="notif-segment"
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                disabled={sendLoading || segmentsLoading}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">Choisir un segment</option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'user_list' && (
            <div className="space-y-3 rounded-md border border-gray-200 p-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-800">Ciblage par utilisateur spécifique</p>
              <p className="text-xs text-gray-500">
                Recherche sur profils (email, nom). Maximum 500 utilisateurs sélectionnables (
                {selectedUsers.length}/500).
              </p>
              <input
                type="search"
                placeholder="Rechercher par email ou nom..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                disabled={sendLoading}
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
                        disabled={sendLoading || selectedUsers.length >= 500}
                      >
                        <span className="font-medium text-gray-900">{p.full_name || 'Sans nom'}</span>
                        <span className="block text-xs text-gray-500">{p.email || '—'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!userSearchLoading &&
                userSearchQuery.trim().length >= 1 &&
                userSearchResults.length === 0 && (
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
                        disabled={sendLoading}
                        aria-label={`Retirer ${u.email ?? u.id}`}
                      >
                        <XMarkIcon className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-gray-100 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Prévisualisation</p>
            <div className="rounded-md bg-white/80 border border-gray-200 p-3 shadow-inner">
              <p className="font-semibold text-gray-900">{title.trim() || 'Titre de la notification'}</p>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                {message.trim() || 'Le texte du message apparaîtra ici.'}
              </p>
            </div>
          </div>

          {sendError && <div className="text-sm text-red-600">{sendError}</div>}

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
              onClick={closeModal}
              disabled={sendLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
              disabled={sendLoading}
            >
              {sendLoading ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedAuth } from '@/lib/hooks/useOptimizedAuth';
import Modal from '@/components/ui/Modal';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function formatRecurrence(days: number[] | null): string {
  if (!days || days.length === 0 || days.length === 7) return 'Tous les jours';
  return days
    .sort((a, b) => a - b)
    .map((d) => DAYS_FR[d - 1])
    .join(' · ');
}

function formatWindow(starts: string, ends: string | null): string {
  const s = new Date(starts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  if (!ends) return `Depuis le ${s}`;
  const e = new Date(ends).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  return `${s} → ${e}`;
}

function formatTimeRange(start: string | null, end: string | null): string {
  if (!start || !end) return 'Toute la journée';
  const fmt = (t: string) => t.slice(0, 5);
  return `${fmt(start)} – ${fmt(end)}`;
}

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseTimeForInput(t: string | null): string {
  if (!t) return '';
  return t.slice(0, 5);
}

function timeInputToDb(t: string): string | null {
  const v = t.trim();
  if (!v) return null;
  return v.length === 5 ? `${v}:00` : v;
}

function normalizeRecurrenceFromDb(days: unknown): number[] {
  if (!days || !Array.isArray(days)) return [];
  return (days as unknown[])
    .filter((x): x is number => typeof x === 'number' && x >= 1 && x <= 7)
    .sort((a, b) => a - b);
}

function normalizeRecurrenceArray(days: unknown): number[] | null {
  if (!days || !Array.isArray(days)) return null;
  const nums = (days as unknown[])
    .filter((x): x is number => typeof x === 'number' && x >= 1 && x <= 7)
    .sort((a, b) => a - b);
  return nums.length === 0 ? null : nums;
}

interface TelecomOperatorRow {
  id: number;
  name: string;
}

interface PromotionRow {
  id: string;
  title: string;
  description: string | null;
  emoji: string;
  accent_color: string;
  starts_at: string;
  ends_at: string | null;
  operator_id: number | null;
  recurrence_days: number[] | null;
  daily_start_time: string | null;
  daily_end_time: string | null;
  active: boolean;
  created_at: string;
}

type PromotionFormState = {
  title: string;
  description: string;
  emoji: string;
  accent_color: string;
  starts_at_local: string;
  ends_at_local: string;
  operator_id: number | null;
  recurrence_days: number[];
  daily_start_time: string;
  daily_end_time: string;
  active: boolean;
};

const WEEK_CHECKBOXES: { value: number; label: string }[] = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 7, label: 'Dimanche' },
];

function defaultForm(): PromotionFormState {
  return {
    title: '',
    description: '',
    emoji: '🎁',
    accent_color: '#16a34a',
    starts_at_local: toDatetimeLocalValue(new Date()),
    ends_at_local: '',
    operator_id: null,
    recurrence_days: [],
    daily_start_time: '',
    daily_end_time: '',
    active: true,
  };
}

function rowToForm(row: PromotionRow): PromotionFormState {
  return {
    title: row.title,
    description: row.description ?? '',
    emoji: row.emoji || '🎁',
    accent_color: row.accent_color || '#16a34a',
    starts_at_local: toDatetimeLocalValue(new Date(row.starts_at)),
    ends_at_local: row.ends_at ? toDatetimeLocalValue(new Date(row.ends_at)) : '',
    operator_id: row.operator_id,
    recurrence_days: normalizeRecurrenceFromDb(row.recurrence_days),
    daily_start_time: parseTimeForInput(row.daily_start_time),
    daily_end_time: parseTimeForInput(row.daily_end_time),
    active: row.active,
  };
}

export default function AdminPromotionsPage() {
  const { isAdmin, isLoading: authLoading, isAuthenticated } = useOptimizedAuth({
    requireAuth: true,
    requireAdmin: true,
  });

  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [operators, setOperators] = useState<TelecomOperatorRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromotionFormState>(defaultForm);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const operatorNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const o of operators) m.set(o.id, o.name);
    return m;
  }, [operators]);

  const loadAll = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    try {
      const [promRes, activeRes, opRes] = await Promise.all([
        supabase
          .from('promotions')
          .select(
            'id, title, description, emoji, accent_color, starts_at, ends_at, operator_id, recurrence_days, daily_start_time, daily_end_time, active, created_at',
          )
          .order('created_at', { ascending: false }),
        supabase.from('active_promotions').select('id'),
        supabase.from('telecom_operators').select('id, name').order('name'),
      ]);

      if (promRes.error) throw promRes.error;
      if (activeRes.error) throw activeRes.error;
      if (opRes.error) throw opRes.error;

      const rows = (promRes.data as PromotionRow[] | null) ?? [];
      setPromotions(
        rows.map((r) => ({
          ...r,
          recurrence_days: normalizeRecurrenceArray(r.recurrence_days),
        })),
      );
      const ids = new Set<string>();
      for (const r of (activeRes.data as { id: string }[] | null) ?? []) {
        if (r?.id != null) ids.add(String(r.id));
      }
      setActiveIds(ids);
      setOperators((opRes.data as TelecomOperatorRow[]) ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Impossible de charger les promotions.';
      setListError(msg);
      setPromotions([]);
      setActiveIds(new Set());
      setOperators([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      void loadAll();
    }
  }, [authLoading, isAuthenticated, isAdmin, loadAll]);

  function openNewModal() {
    setEditingId(null);
    setForm(defaultForm());
    setSaveError(null);
    setShowModal(true);
  }

  function openEditModal(row: PromotionRow) {
    setEditingId(row.id);
    setForm(rowToForm(row));
    setSaveError(null);
    setShowModal(true);
  }

  function closeModal() {
    if (saveLoading) return;
    setShowModal(false);
  }

  function toggleDay(day: number) {
    setForm((prev) => {
      const has = prev.recurrence_days.includes(day);
      const next = has
        ? prev.recurrence_days.filter((d) => d !== day)
        : [...prev.recurrence_days, day].sort((a, b) => a - b);
      return { ...prev, recurrence_days: next };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    const titleTrim = form.title.trim();
    if (!titleTrim || titleTrim.length > 80) {
      setSaveError('Le titre est obligatoire (80 caractères max).');
      return;
    }
    const descTrim = form.description.trim();
    if (descTrim.length > 300) {
      setSaveError('La description ne peut pas dépasser 300 caractères.');
      return;
    }

    let emoji = form.emoji.trim();
    if (!emoji) emoji = '🎁';
    const emojiChars = [...emoji];
    emoji = emojiChars.slice(0, 2).join('');

    const recurrence_days =
      form.recurrence_days.length === 0 || form.recurrence_days.length === 7
        ? null
        : [...form.recurrence_days].sort((a, b) => a - b);

    const payload = {
      title: titleTrim,
      description: descTrim || null,
      emoji,
      accent_color: form.accent_color,
      starts_at: new Date(form.starts_at_local).toISOString(),
      ends_at: form.ends_at_local.trim() ? new Date(form.ends_at_local).toISOString() : null,
      operator_id: form.operator_id,
      recurrence_days,
      daily_start_time: timeInputToDb(form.daily_start_time),
      daily_end_time: timeInputToDb(form.daily_end_time),
      active: form.active,
    };

    setSaveLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('promotions').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('promotions').insert(payload);
        if (error) throw error;
      }
      setShowModal(false);
      await loadAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Enregistrement impossible.';
      setSaveError(msg);
    } finally {
      setSaveLoading(false);
    }
  }

  async function toggleActive(row: PromotionRow) {
    try {
      const { error } = await supabase.from('promotions').update({ active: !row.active }).eq('id', row.id);
      if (error) throw error;
      await loadAll();
    } catch {
      setListError('Impossible de mettre à jour le statut.');
    }
  }

  async function deletePromotion(row: PromotionRow) {
    if (!window.confirm(`Supprimer la promotion « ${row.title} » ?`)) return;
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', row.id);
      if (error) throw error;
      await loadAll();
    } catch {
      setListError('Suppression impossible.');
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
        <h1 className="text-2xl font-semibold text-gray-900">Promotions</h1>
        <button
          type="button"
          onClick={openNewModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nouvelle promotion
        </button>
      </div>

      {listError && <div className="text-sm text-red-600">{listError}</div>}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Liste des promotions</h2>
        </div>

        {listLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500 mx-auto" />
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Titre
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Statut
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Cible
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Fenêtre
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Récurrence
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Aucune promotion
                    </td>
                  </tr>
                ) : (
                  promotions.map((row) => {
                    const activeNow = row.active && activeIds.has(row.id);
                    const targetLabel =
                      row.operator_id != null ? operatorNameById.get(row.operator_id) ?? '—' : 'Tous';

                    return (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-lg shrink-0"
                              style={{ color: row.accent_color || '#16a34a' }}
                              aria-hidden
                            >
                              {row.emoji || '🎁'}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{row.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                row.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {row.active ? 'Active' : 'Inactive'}
                            </span>
                            {activeNow && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                                🟢 En cours
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{targetLabel}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatWindow(row.starts_at, row.ends_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <div>{formatRecurrence(row.recurrence_days)}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatTimeRange(row.daily_start_time, row.daily_end_time)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => void toggleActive(row)}
                            className="text-green-600 hover:text-green-800 font-medium mr-3"
                          >
                            {row.active ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900 mr-2"
                            title="Éditer"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void deletePromotion(row)}
                            className="inline-flex items-center text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingId ? 'Modifier la promotion' : 'Nouvelle promotion'}
        size="xl"
      >
        <form className="space-y-4 max-h-[75vh] overflow-y-auto pr-1" onSubmit={(e) => void handleSave(e)}>
          <div>
            <label htmlFor="promo-title" className="block text-sm font-medium text-gray-700">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              id="promo-title"
              type="text"
              required
              maxLength={80}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              disabled={saveLoading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
            <p className="mt-0.5 text-xs text-gray-400">{form.title.length}/80</p>
          </div>

          <div>
            <label htmlFor="promo-desc" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="promo-desc"
              maxLength={300}
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={saveLoading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
            <p className="mt-0.5 text-xs text-gray-400">{form.description.length}/300</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="promo-emoji" className="block text-sm font-medium text-gray-700">
                Emoji (1–2 caractères)
              </label>
              <input
                id="promo-emoji"
                type="text"
                maxLength={8}
                value={form.emoji}
                onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                disabled={saveLoading}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="promo-color" className="block text-sm font-medium text-gray-700">
                Couleur accent
              </label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  id="promo-color"
                  type="color"
                  value={form.accent_color}
                  onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))}
                  disabled={saveLoading}
                  className="h-10 w-14 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={form.accent_color}
                  onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))}
                  disabled={saveLoading}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="promo-start" className="block text-sm font-medium text-gray-700">
                Date début
              </label>
              <input
                id="promo-start"
                type="datetime-local"
                required
                value={form.starts_at_local}
                onChange={(e) => setForm((f) => ({ ...f, starts_at_local: e.target.value }))}
                disabled={saveLoading}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="promo-end" className="block text-sm font-medium text-gray-700">
                Date fin (optionnel)
              </label>
              <input
                id="promo-end"
                type="datetime-local"
                value={form.ends_at_local}
                onChange={(e) => setForm((f) => ({ ...f, ends_at_local: e.target.value }))}
                disabled={saveLoading}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
              <p className="mt-0.5 text-xs text-gray-400">Vide = pas de date de fin</p>
            </div>
          </div>

          <div>
            <label htmlFor="promo-operator" className="block text-sm font-medium text-gray-700">
              Opérateur ciblé
            </label>
            <select
              id="promo-operator"
              value={form.operator_id === null ? '' : String(form.operator_id)}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  operator_id: e.target.value === '' ? null : Number(e.target.value),
                }))
              }
              disabled={saveLoading}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              <option value="">Tous les opérateurs</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">Récurrence (vide = tous les jours)</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {WEEK_CHECKBOXES.map(({ value, label }) => (
                <label key={value} className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.recurrence_days.includes(value)}
                    onChange={() => toggleDay(value)}
                    disabled={saveLoading}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="promo-time-start" className="block text-sm font-medium text-gray-700">
                Heure début (plage)
              </label>
              <input
                id="promo-time-start"
                type="time"
                value={form.daily_start_time}
                onChange={(e) => setForm((f) => ({ ...f, daily_start_time: e.target.value }))}
                disabled={saveLoading}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="promo-time-end" className="block text-sm font-medium text-gray-700">
                Heure fin (plage)
              </label>
              <input
                id="promo-time-end"
                type="time"
                value={form.daily_end_time}
                onChange={(e) => setForm((f) => ({ ...f, daily_end_time: e.target.value }))}
                disabled={saveLoading}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
              <p className="mt-0.5 text-xs text-gray-400">Les deux vides = toute la journée</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-800">Promotion active</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.active}
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              disabled={saveLoading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                form.active ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  form.active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {saveError && <div className="text-sm text-red-600">{saveError}</div>}

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={closeModal}
              disabled={saveLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              disabled={saveLoading}
            >
              {saveLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

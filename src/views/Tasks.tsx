import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Plus, Pencil, Trash2, Check, ChevronUp, ChevronDown, Power, GripVertical } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import type { MainTask } from '../store/types';

const EMOJI_CHOICES = ['💪', '🏃', '📚', '🧘', '💧', '🥗', '😴', '💼', '🕌', '📖', '🎯', '⚡', '🔥', '⭐', '🌟', '🦵', '🧠', '❤️', '☀️', '🛏️', '🥤', '🍎', '🧹', '✍️', '🎨', '🎵', '🤝', '🌱', '⏰', '🏆'];
const CATEGORIES: { id: MainTask['category']; label: string; color: string }[] = [
  { id: 'body', label: 'Body', color: '#ff7a18' },
  { id: 'mind', label: 'Mind', color: '#3b82f6' },
  { id: 'spirit', label: 'Spirit', color: '#a855f7' },
  { id: 'work', label: 'Work', color: '#10b981' },
];

interface EditFormData {
  label: string;
  emoji: string;
  points: number;
  description: string;
  category: MainTask['category'];
}

export function Tasks() {
  const {
    state,
    toggleCoreTask,
    toggleCustomTask,
    addCustomTask,
    updateCustomTask,
    deleteCustomTask,
    addMainTask,
    updateMainTask,
    deleteMainTask,
    reorderMainTask,
  } = useStore();

  const [mainAddOpen, setMainAddOpen] = useState(false);
  const [mainEditId, setMainEditId] = useState<string | null>(null);
  const [mainDeleteId, setMainDeleteId] = useState<string | null>(null);
  const [customAddOpen, setCustomAddOpen] = useState(false);
  const [customEditId, setCustomEditId] = useState<string | null>(null);
  const [customDeleteId, setCustomDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<EditFormData>({
    label: '',
    emoji: '🎯',
    points: 50,
    description: '',
    category: 'body',
  });

  const resetForm = () => {
    setFormData({ label: '', emoji: '🎯', points: 50, description: '', category: 'body' });
  };

  const openMainAdd = () => {
    resetForm();
    setMainAddOpen(true);
  };

  const openMainEdit = (task: MainTask) => {
    setFormData({
      label: task.label,
      emoji: task.emoji,
      points: task.points,
      description: task.description ?? '',
      category: task.category,
    });
    setMainEditId(task.id);
  };

  const openCustomAdd = () => {
    resetForm();
    setCustomAddOpen(true);
  };

  const openCustomEdit = (id: string) => {
    const t = state.customTasks.find((x) => x.id === id);
    if (!t) return;
    setFormData({ label: t.label, emoji: t.emoji, points: t.points, description: '', category: 'body' });
    setCustomEditId(id);
  };

  const saveMain = () => {
    if (!formData.label.trim()) {
      toast({ title: 'Label required', type: 'error' });
      return;
    }
    if (mainEditId) {
      updateMainTask(mainEditId, {
        label: formData.label,
        emoji: formData.emoji,
        points: formData.points,
        description: formData.description,
        category: formData.category,
      });
      toast({ title: 'Main task updated', type: 'success' });
      setMainEditId(null);
    } else {
      addMainTask({
        label: formData.label,
        emoji: formData.emoji,
        points: formData.points,
        description: formData.description,
        category: formData.category,
      });
      toast({ title: 'Main task added', type: 'success' });
      setMainAddOpen(false);
    }
    resetForm();
  };

  const saveCustom = () => {
    if (!formData.label.trim()) {
      toast({ title: 'Label required', type: 'error' });
      return;
    }
    if (customEditId) {
      updateCustomTask(customEditId, { label: formData.label, emoji: formData.emoji, points: formData.points });
      toast({ title: 'Task updated', type: 'success' });
      setCustomEditId(null);
    } else {
      addCustomTask(formData.label, formData.emoji, formData.points);
      toast({ title: 'Task added', type: 'success' });
      setCustomAddOpen(false);
    }
    resetForm();
  };

  const sortedMainTasks = [...state.mainTasks].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Tasks</h1>
          <p className="text-sm text-ink-300">Core progression + custom tasks</p>
        </div>
      </div>

      {/* Main tasks */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">Main Tasks</h2>
            <p className="text-xs text-ink-300 mb-4 sm:mb-4">These drive your main progression. Complete them all for a perfect day.</p>
          </div>
          <button onClick={openMainAdd} className="btn-primary w-full sm:w-auto flex-shrink-0">
            <Plus size={16} /> Add Main Task
          </button>
        </div>
        <div className="space-y-2">
          {sortedMainTasks.map((task, idx) => {
            const done = state.coreCompleted[task.id];
            const cat = CATEGORIES.find((c) => c.id === task.category);
            return (
              <div
                key={task.id}
                className={`w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                  done
                    ? 'bg-emerald2-500/10 border-emerald2-500/40'
                    : task.enabled
                    ? 'bg-ink-950/40 border-white/5 hover:border-ember-500/30'
                    : 'bg-ink-950/20 border-white/5 opacity-50'
                }`}
              >
                {/* Reorder controls */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => reorderMainTask(task.id, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronUp size={12} className="text-ink-300" />
                  </button>
                  <GripVertical size={12} className="text-ink-500 mx-auto" />
                  <button
                    onClick={() => reorderMainTask(task.id, 'down')}
                    disabled={idx === sortedMainTasks.length - 1}
                    className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronDown size={12} className="text-ink-300" />
                  </button>
                </div>

                {/* Toggle complete */}
                <button
                  onClick={() => task.enabled && toggleCoreTask(task.id)}
                  disabled={!task.enabled}
                  className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left disabled:cursor-not-allowed"
                >
                  <span className={`text-xl sm:text-2xl flex-shrink-0 transition-transform ${done ? 'scale-110' : 'opacity-70'}`}>{task.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`font-medium text-sm truncate ${done ? 'text-emerald2-400 line-through' : ''} ${!task.enabled ? 'text-ink-400' : ''}`}>
                        {task.label}
                      </p>
                      {cat && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                      )}
                      {!task.enabled && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ink-800 text-ink-400 font-medium flex-shrink-0">Disabled</span>
                      )}
                    </div>
                    <p className="text-xs text-ink-400 truncate">
                      +{task.points} XP · Main
                      {task.description ? ` · ${task.description}` : ''}
                    </p>
                  </div>
                </button>

                {/* Checkbox */}
                <button
                  onClick={() => task.enabled && toggleCoreTask(task.id)}
                  disabled={!task.enabled}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald2-500 border-emerald2-500' : 'border-ink-500'} ${!task.enabled ? 'opacity-30' : ''}`}
                >
                  {done && <Check size={14} className="text-white" />}
                </button>

                {/* Edit / Enable-Disable / Delete */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => openMainEdit(task)} className="p-1.5 rounded-lg hover:bg-white/10" title="Edit">
                    <Pencil size={14} className="text-ink-300" />
                  </button>
                  <button
                    onClick={() => updateMainTask(task.id, { enabled: !task.enabled })}
                    className="p-1.5 rounded-lg hover:bg-white/10"
                    title={task.enabled ? 'Disable' : 'Enable'}
                  >
                    <Power size={14} className={task.enabled ? 'text-emerald2-400' : 'text-ink-400'} />
                  </button>
                  <button
                    onClick={() => setMainDeleteId(task.id)}
                    className="p-1.5 rounded-lg hover:bg-danger-500/20 text-danger-400"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {sortedMainTasks.length === 0 && (
            <div className="text-center py-8 text-ink-400">
              <p className="text-sm">No main tasks yet.</p>
              <button onClick={openMainAdd} className="btn-ghost mt-3 text-sm">
                <Plus size={16} /> Add your first
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom tasks */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">Extra Tasks</h2>
            <p className="text-xs text-ink-300">Add unlimited extra tasks for bonus points.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="chip bg-white/5 text-ink-300 flex-shrink-0">{state.customTasks.length} tasks</span>
            <button onClick={openCustomAdd} className="btn-primary flex-shrink-0">
              <Plus size={16} /> Add Task
            </button>
          </div>
        </div>
        {state.customTasks.length === 0 ? (
          <div className="text-center py-8 text-ink-400">
            <p className="text-sm">No extra tasks yet.</p>
            <button onClick={openCustomAdd} className="btn-ghost mt-3 text-sm">
              <Plus size={16} /> Add your first
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {state.customTasks.map((task) => {
              const done = state.customCompleted[task.id];
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                    done
                      ? 'bg-emerald2-500/10 border-emerald2-500/40'
                      : 'bg-ink-950/40 border-white/5'
                  }`}
                >
                  <button onClick={() => toggleCustomTask(task.id)} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left">
                    <span className={`text-xl sm:text-2xl flex-shrink-0 transition-transform ${done ? 'scale-110' : 'opacity-70'}`}>{task.emoji}</span>
                    <div className="min-w-0">
                      <p className={`font-medium text-sm truncate ${done ? 'text-emerald2-400 line-through' : ''}`}>{task.label}</p>
                      <p className="text-xs text-ink-400">+{task.points} XP · Bonus</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={() => openCustomEdit(task.id)} className="p-1.5 rounded-lg hover:bg-white/10">
                      <Pencil size={14} className="text-ink-300" />
                    </button>
                    <button onClick={() => setCustomDeleteId(task.id)} className="p-1.5 rounded-lg hover:bg-danger-500/20 text-danger-400">
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => toggleCustomTask(task.id)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ml-0.5 ${done ? 'bg-emerald2-500 border-emerald2-500' : 'border-ink-500'}`}
                    >
                      {done && <Check size={14} className="text-white" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main task add/edit modal */}
      <Modal open={mainAddOpen || mainEditId !== null} onClose={() => { setMainAddOpen(false); setMainEditId(null); }} title={mainEditId ? 'Edit Main Task' : 'Add Main Task'}>
        <TaskForm
          formData={formData}
          setFormData={setFormData}
          showCategory
          showDescription
          onSave={saveMain}
          onCancel={() => { setMainAddOpen(false); setMainEditId(null); }}
          saveLabel={mainEditId ? 'Save' : 'Add Task'}
        />
      </Modal>

      {/* Custom task add/edit modal */}
      <Modal open={customAddOpen || customEditId !== null} onClose={() => { setCustomAddOpen(false); setCustomEditId(null); }} title={customEditId ? 'Edit Task' : 'Add Extra Task'}>
        <TaskForm
          formData={formData}
          setFormData={setFormData}
          onSave={saveCustom}
          onCancel={() => { setCustomAddOpen(false); setCustomEditId(null); }}
          saveLabel={customEditId ? 'Save' : 'Add Task'}
        />
      </Modal>

      {/* Delete confirmations */}
      <ConfirmModal
        open={mainDeleteId !== null}
        onClose={() => setMainDeleteId(null)}
        onConfirm={() => {
          if (mainDeleteId) {
            deleteMainTask(mainDeleteId);
            toast({ title: 'Main task deleted', type: 'success' });
          }
        }}
        title="Delete Main Task"
        message="This will permanently remove the task and all its completion data."
        confirmLabel="Delete"
        danger
      />
      <ConfirmModal
        open={customDeleteId !== null}
        onClose={() => setCustomDeleteId(null)}
        onConfirm={() => {
          if (customDeleteId) {
            deleteCustomTask(customDeleteId);
            toast({ title: 'Task deleted', type: 'success' });
          }
        }}
        title="Delete Task"
        message="This will remove the task permanently."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function TaskForm({
  formData,
  setFormData,
  onSave,
  onCancel,
  saveLabel,
  showCategory,
  showDescription,
}: {
  formData: EditFormData;
  setFormData: (fn: (d: EditFormData) => EditFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
  showCategory?: boolean;
  showDescription?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Task Label</label>
        <input
          className="input mt-1"
          value={formData.label}
          onChange={(e) => setFormData((d) => ({ ...d, label: e.target.value }))}
          placeholder="e.g. Meditate 10 minutes"
          autoFocus
        />
      </div>
      <div>
        <label className="label">Emoji</label>
        <div className="flex flex-wrap gap-1.5 mt-2 max-h-32 overflow-y-auto">
          {EMOJI_CHOICES.map((e) => (
            <button
              key={e}
              onClick={() => setFormData((d) => ({ ...d, emoji: e }))}
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition ${
                formData.emoji === e ? 'bg-ember-500/30 border-2 border-ember-500' : 'bg-ink-950/60 border border-white/5 hover:bg-white/5'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Points (XP)</label>
        <input
          type="number"
          className="input mt-1"
          value={formData.points}
          onChange={(e) => setFormData((d) => ({ ...d, points: Math.max(1, Number(e.target.value)) }))}
          min={1}
          max={500}
        />
      </div>
      {showCategory && (
        <div>
          <label className="label">Category</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setFormData((d) => ({ ...d, category: c.id }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  formData.category === c.id ? 'border-2' : 'border border-white/5 bg-ink-950/60 hover:bg-white/5'
                }`}
                style={formData.category === c.id ? { backgroundColor: `${c.color}20`, borderColor: c.color, color: c.color } : {}}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {showDescription && (
        <div>
          <label className="label">Description (optional)</label>
          <input
            className="input mt-1"
            value={formData.description}
            onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
            placeholder="e.g. 10 minutes of mindfulness"
          />
        </div>
      )}
      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
        <button onClick={onSave} className="btn-primary">{saveLabel}</button>
      </div>
    </div>
  );
}

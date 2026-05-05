"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Camera,
  Settings,
  CheckCircle,
  BarChart3,
  Timer,
  LayoutGrid,
  List,
  Play,
  Pause,
  RotateCcw,
  Palette,
  RefreshCw,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Save,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import useUpload from "@/utils/useUpload";
import useTheme from "@/utils/useTheme";
import { format, differenceInDays } from "date-fns";
import { Toaster, toast } from "sonner";

// ─── Theme Panel ─────────────────────────────────────────────────────────────
const ThemePanel = ({ onClose, theme, setTheme, resetTheme }) => {
  const presets = [
    {
      label: "ブルー",
      primaryColor: "#4A90E2",
      bgColor: "#F9FAFB",
      headerBgColor: "#FFFFFF",
    },
    {
      label: "グリーン",
      primaryColor: "#48BB78",
      bgColor: "#F0FFF4",
      headerBgColor: "#FFFFFF",
    },
    {
      label: "パープル",
      primaryColor: "#9F7AEA",
      bgColor: "#FAF5FF",
      headerBgColor: "#FFFFFF",
    },
    {
      label: "ローズ",
      primaryColor: "#ED64A6",
      bgColor: "#FFF5F7",
      headerBgColor: "#FFFFFF",
    },
    {
      label: "ダーク",
      primaryColor: "#4A90E2",
      bgColor: "#1A202C",
      headerBgColor: "#2D3748",
    },
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-80 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Palette size={18} style={{ color: theme.primaryColor }} />
            <h3 className="font-bold text-[#2D3748]">テーマ設定</h3>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-[#A0AEC0]" />
          </button>
        </div>
        <div className="space-y-3">
          {[
            { key: "primaryColor", label: "アクセントカラー" },
            { key: "bgColor", label: "背景色" },
            { key: "headerBgColor", label: "ヘッダー色" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#4A5568]">{label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(e) => setTheme({ [key]: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-[#E2E8F0] cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-[#718096]">
                  {theme[key]}
                </span>
              </div>
            </div>
          ))}
          <div className="flex gap-2 flex-wrap pt-1">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setTheme(p)}
                className="px-3 py-1 rounded-full text-xs font-bold text-white hover:opacity-80"
                style={{ backgroundColor: p.primaryColor }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={resetTheme}
            className="w-full flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold text-[#718096] bg-[#F7FAFC] border border-[#E2E8F0]"
          >
            <RefreshCw size={13} /> デフォルトに戻す
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Pomodoro ─────────────────────────────────────────────────────────────────
const DEFAULT_POMO = { workMinutes: 25, shortBreak: 5, longBreak: 15 };

const PomodoroTimer = ({ projectId, theme }) => {
  const [settings, setSettings] = useState(DEFAULT_POMO);
  const [currentSet, setCurrentSet] = useState(1);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_POMO.workMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("work");
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState(DEFAULT_POMO);
  const queryClient = useQueryClient();
  const endHandled = useRef(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("pomodoro-settings") || "{}");
      const merged = { ...DEFAULT_POMO, ...s };
      setSettings(merged);
      setTempSettings(merged);
      setTimeLeft(merged.workMinutes * 60);
    } catch {}
  }, []);

  const logWork = useMutation({
    mutationFn: async (sec) => {
      const r = await fetch("/api/work-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, duration_seconds: sec }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-logs"] });
      toast.success("作業時間を記録しました！");
    },
  });

  useEffect(() => {
    let t = null;
    if (isActive && timeLeft > 0)
      t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    else if (isActive && timeLeft === 0 && !endHandled.current) {
      endHandled.current = true;
      setIsActive(false);
      try {
        new Audio(
          "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
        ).play();
      } catch {}
      if (mode === "work") {
        logWork.mutate(settings.workMinutes * 60);
        if (currentSet < 4) {
          toast.success(`第${currentSet}セット完了！休憩しましょう☕`);
          setMode("shortBreak");
          setTimeLeft(settings.shortBreak * 60);
        } else {
          toast.success("4セット完了！長期休憩🎉");
          setMode("longBreak");
          setTimeLeft(settings.longBreak * 60);
        }
      } else if (mode === "shortBreak") {
        toast("休憩終了！次のセットへ");
        setCurrentSet((p) => p + 1);
        setMode("work");
        setTimeLeft(settings.workMinutes * 60);
      } else {
        toast("長期休憩終了！");
        setCurrentSet(1);
        setMode("work");
        setTimeLeft(settings.workMinutes * 60);
      }
    }
    return () => clearInterval(t);
  }, [isActive, timeLeft, mode, currentSet, settings]);

  const toggle = () => {
    endHandled.current = false;
    setIsActive((p) => !p);
  };
  const reset = () => {
    setIsActive(false);
    endHandled.current = false;
    setCurrentSet(1);
    setMode("work");
    setTimeLeft(settings.workMinutes * 60);
  };
  const saveSettings = () => {
    const s = {
      workMinutes: Math.max(1, +tempSettings.workMinutes || 25),
      shortBreak: Math.max(1, +tempSettings.shortBreak || 5),
      longBreak: Math.max(1, +tempSettings.longBreak || 15),
    };
    setSettings(s);
    try {
      localStorage.setItem("pomodoro-settings", JSON.stringify(s));
    } catch {}
    setIsActive(false);
    endHandled.current = false;
    setCurrentSet(1);
    setMode("work");
    setTimeLeft(s.workMinutes * 60);
    setShowSettings(false);
  };

  const mins = Math.floor(timeLeft / 60),
    secs = timeLeft % 60;
  const modeLabel = {
    work: "作業中",
    shortBreak: "短い休憩",
    longBreak: "長期休憩",
  }[mode];
  const modeColor = {
    work: theme.primaryColor,
    shortBreak: "#48BB78",
    longBreak: "#9F7AEA",
  }[mode];
  const totalTime =
    mode === "work"
      ? settings.workMinutes * 60
      : mode === "shortBreak"
        ? settings.shortBreak * 60
        : settings.longBreak * 60;
  const pct = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const r = 42,
    circ = 2 * Math.PI * r;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#EEE]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer size={17} style={{ color: theme.primaryColor }} />
          <h3 className="font-bold text-[#2D3748] text-sm">ポモドーロ</h3>
        </div>
        <button
          onClick={() => {
            setShowSettings(!showSettings);
            setTempSettings(settings);
          }}
          className="p-1 rounded-lg hover:bg-[#F7FAFC] text-[#A0AEC0]"
        >
          <Settings size={14} />
        </button>
      </div>
      {showSettings ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { k: "workMinutes", l: "作業(分)" },
              { k: "shortBreak", l: "短休(分)" },
              { k: "longBreak", l: "長休(分)" },
            ].map(({ k, l }) => (
              <div key={k}>
                <label className="block text-[10px] font-bold text-[#718096] mb-1">
                  {l}
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={tempSettings[k]}
                  onChange={(e) =>
                    setTempSettings((p) => ({ ...p, [k]: e.target.value }))
                  }
                  className="w-full border border-[#E2E8F0] rounded-lg px-2 py-1 text-sm font-mono focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={saveSettings}
              className="flex-1 py-1.5 rounded-lg text-white text-xs font-bold"
              style={{ backgroundColor: theme.primaryColor }}
            >
              保存
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold text-[#718096] bg-[#F7FAFC] border border-[#E2E8F0]"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    i < currentSet
                      ? theme.primaryColor
                      : i === currentSet
                        ? modeColor
                        : "#E2E8F0",
                }}
              />
            ))}
            <span className="text-[10px] text-[#A0AEC0] ml-1">
              {currentSet}/4
            </span>
          </div>
          <div
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mb-2"
            style={{ backgroundColor: `${modeColor}20`, color: modeColor }}
          >
            {modeLabel}
          </div>
          <div className="relative inline-flex items-center justify-center mb-3">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={r}
                fill="none"
                stroke="#F0F4F8"
                strokeWidth="5"
              />
              <circle
                cx="48"
                cy="48"
                r={r}
                fill="none"
                stroke={modeColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct / 100)}
                transform="rotate(-90 48 48)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute text-xl font-mono font-bold text-[#2D3748]">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={toggle}
              className="flex items-center justify-center w-10 h-10 rounded-full text-white"
              style={{ backgroundColor: isActive ? "#CBD5E0" : modeColor }}
            >
              {isActive ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={reset}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-[#EDF2F7] text-[#4A5568]"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="mt-2 text-[10px] text-[#A0AEC0]">
            作業{settings.workMinutes}分/短{settings.shortBreak}分/長
            {settings.longBreak}分
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Step Progress Modal ──────────────────────────────────────────────────────
const StepProgressModal = ({ projectId, pageNumber, theme, onClose }) => {
  const queryClient = useQueryClient();

  const { data: stepProgress = [], isLoading } = useQuery({
    queryKey: ["step-progress", projectId, pageNumber],
    queryFn: async () => {
      const r = await fetch(
        `/api/step-progress/${projectId}?page=${pageNumber}`,
      );
      if (!r.ok) throw new Error();
      return r.json();
    },
  });

  const updateStep = useMutation({
    mutationFn: async ({ step_id, progress }) => {
      const r = await fetch(`/api/step-progress/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_number: pageNumber, step_id, progress }),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["step-progress", projectId, pageNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ["project", String(projectId)],
      });
    },
  });

  const avgProgress =
    stepProgress.length > 0
      ? Math.round(
          stepProgress.reduce((a, s) => a + +s.progress, 0) /
            stepProgress.length,
        )
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-[#2D3748] text-lg">
              {pageNumber} ページ — 工程別進捗
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="h-1.5 rounded-full overflow-hidden w-32"
                style={{ backgroundColor: `${theme.primaryColor}20` }}
              >
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${avgProgress}%`,
                    backgroundColor: theme.primaryColor,
                  }}
                />
              </div>
              <span
                className="text-xs font-bold"
                style={{ color: theme.primaryColor }}
              >
                総合 {avgProgress}%
              </span>
            </div>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-[#A0AEC0]" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2"
              style={{ borderColor: theme.primaryColor }}
            />
          </div>
        ) : (
          <div className="space-y-5">
            {stepProgress.map((step) => (
              <div key={step.step_id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#2D3748]">
                    {step.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {[0, 25, 50, 75, 100].map((val) => (
                      <button
                        key={val}
                        onClick={() =>
                          updateStep.mutate({
                            step_id: step.step_id,
                            progress: val,
                          })
                        }
                        className="w-7 h-7 rounded-lg text-[10px] font-bold transition-all"
                        style={
                          +step.progress === val
                            ? {
                                backgroundColor: theme.primaryColor,
                                color: "#fff",
                              }
                            : {
                                backgroundColor: "#F7FAFC",
                                color: "#A0AEC0",
                                border: "1px solid #E2E8F0",
                              }
                        }
                      >
                        {val === 0 ? "✗" : val === 100 ? "✓" : `${val}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={step.progress}
                    onChange={(e) =>
                      updateStep.mutate({
                        step_id: step.step_id,
                        progress: +e.target.value,
                      })
                    }
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: theme.primaryColor }}
                  />
                  <span
                    className="text-xs font-mono font-bold w-8 text-right"
                    style={{ color: theme.primaryColor }}
                  >
                    {step.progress}%
                  </span>
                </div>
                {/* mini progress bar */}
                <div
                  className="mt-1 h-1 rounded-full overflow-hidden"
                  style={{ backgroundColor: `${theme.primaryColor}15` }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${step.progress}%`,
                      backgroundColor: theme.primaryColor,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ─── Step Editor Modal ────────────────────────────────────────────────────────
const StepEditorModal = ({ projectId, theme, onClose }) => {
  const queryClient = useQueryClient();
  const [localSteps, setLocalSteps] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/steps/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        setLocalSteps(data.map((s) => ({ ...s })));
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [projectId]);

  const saveSteps = async () => {
    if (localSteps.some((s) => !s.name.trim())) {
      toast.error("工程名を入力してください");
      return;
    }
    setIsSaving(true);
    try {
      const r = await fetch(`/api/steps/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: localSteps }),
      });
      if (!r.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["steps", projectId] });
      queryClient.invalidateQueries({ queryKey: ["step-progress", projectId] });
      toast.success("工程を保存しました");
      onClose();
    } catch {
      toast.error("保存に失敗しました");
    }
    setIsSaving(false);
  };

  const addStep = () =>
    setLocalSteps((p) => [...p, { name: "", position: p.length }]);
  const removeStep = (idx) =>
    setLocalSteps((p) => p.filter((_, i) => i !== idx));
  const moveUp = (idx) => {
    if (idx === 0) return;
    setLocalSteps((p) => {
      const a = [...p];
      [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]];
      return a;
    });
  };
  const moveDown = (idx) => {
    setLocalSteps((p) => {
      if (idx >= p.length - 1) return p;
      const a = [...p];
      [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]];
      return a;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-[#2D3748]">工程カスタマイズ</h3>
          <button onClick={onClose}>
            <X size={18} className="text-[#A0AEC0]" />
          </button>
        </div>
        <p className="text-xs text-[#A0AEC0] mb-3">
          名前変更・並び替え・追加・削除が可能です
        </p>
        <div className="overflow-y-auto flex-1 space-y-2 mb-3">
          {isLoading ? (
            <div className="text-center py-6 text-[#A0AEC0] text-sm">
              読み込み中...
            </div>
          ) : (
            localSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-[#F7FAFC] p-2 rounded-xl border border-[#E2E8F0]"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="text-[#CBD5E0] hover:text-[#718096] disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === localSteps.length - 1}
                    className="text-[#CBD5E0] hover:text-[#718096] disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
                <span className="text-xs text-[#A0AEC0] w-4 font-mono">
                  {idx + 1}
                </span>
                <input
                  value={step.name}
                  onChange={(e) =>
                    setLocalSteps((p) =>
                      p.map((s, i) =>
                        i === idx ? { ...s, name: e.target.value } : s,
                      ),
                    )
                  }
                  className="flex-1 bg-white border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-300"
                  placeholder="工程名"
                />
                <button
                  onClick={() => removeStep(idx)}
                  className="text-[#FC8181] hover:text-[#E53E3E]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <button
          onClick={addStep}
          className="w-full py-2 rounded-xl text-sm font-bold border-2 border-dashed border-[#E2E8F0] text-[#A0AEC0] hover:border-[#CBD5E0] mb-3 flex items-center justify-center gap-1"
        >
          <Plus size={15} /> 工程を追加
        </button>
        <button
          onClick={saveSteps}
          disabled={isSaving}
          className="w-full py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: theme.primaryColor }}
        >
          <Save size={15} /> {isSaving ? "保存中..." : "保存する"}
        </button>
      </motion.div>
    </div>
  );
};

// ─── Project Detail Page ──────────────────────────────────────────────────────
export default function ProjectDetailPage({ params }) {
  const { id } = params;
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [upload] = useUpload();
  const [viewMode, setViewMode] = useState("grid");
  const { theme, setTheme, resetTheme } = useTheme();
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [showStepEditor, setShowStepEditor] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const r = await fetch(`/api/projects/${id}`);
      if (!r.ok) throw new Error();
      return r.json();
    },
    enabled: !!id,
  });

  const updateHeader = useMutation({
    mutationFn: async (url) => {
      const r = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header_image_url: url }),
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("ヘッダーを更新しました");
    },
  });

  const handleHeaderUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("アップロード中...");
      const reader = new FileReader();
      const dataUrl = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const { url, error } = await upload({ url: dataUrl });
      toast.dismiss();
      if (error) throw new Error(error);
      updateHeader.mutate(url);
    } catch {
      toast.dismiss();
      toast.error("アップロードに失敗しました");
    }
  };

  if (isLoading || userLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.bgColor }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2"
          style={{ borderColor: theme.primaryColor }}
        />
      </div>
    );
  }
  if (!data?.project)
    return (
      <div className="min-h-screen flex items-center justify-center text-[#718096]">
        プロジェクトが見つかりません
      </div>
    );

  const { project, progress } = data;
  const completedPages = progress.filter((p) => p.progress === 100).length;
  const overallProgress = Math.round(
    (completedPages / project.total_pages) * 100,
  );

  const getProgressBg = (val) => {
    const v = +val;
    if (v === 0) return "#EDF2F7";
    if (v === 100) return theme.primaryColor;
    const opacity = Math.round(20 + (v / 100) * 60);
    return `${theme.primaryColor}${opacity.toString(16).padStart(2, "0")}`;
  };

  return (
    <div
      className="min-h-screen font-sans pb-20"
      style={{ backgroundColor: theme.bgColor }}
    >
      <Toaster position="top-center" />

      {/* Header */}
      <div
        className="relative h-52 md:h-64 w-full overflow-hidden"
        style={{ backgroundColor: "#EDF2F7" }}
      >
        {project.header_image_url ? (
          <img
            src={project.header_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}30, ${theme.primaryColor}10)`,
            }}
          >
            <BarChart3 size={80} style={{ color: `${theme.primaryColor}40` }} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="text-white">
            <button
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-1 text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full mb-2 hover:bg-white/30"
            >
              <ChevronLeft size={13} /> 戻る
            </button>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {project.title}
            </h1>
            <div className="flex gap-2 text-xs font-bold flex-wrap">
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
                計 {project.total_pages} P
              </span>
              <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full">
                締切:{" "}
                {project.deadline
                  ? format(new Date(project.deadline), "yyyy/MM/dd")
                  : "なし"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowThemePanel(true)}
              className="bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/30 text-white border border-white/20"
            >
              <Palette size={16} />
            </button>
            <label className="cursor-pointer bg-white/20 backdrop-blur-md p-2.5 rounded-full hover:bg-white/30 text-white border border-white/20">
              <Camera size={16} />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleHeaderUpload}
              />
            </label>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto -mt-6 px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Left */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#EEE]">
              <h3 className="font-bold text-[#2D3748] mb-3 flex items-center gap-2 text-sm">
                <BarChart3 size={16} style={{ color: theme.primaryColor }} />{" "}
                全体進捗
              </h3>
              <div className="flex justify-between items-center mb-2 text-xs font-bold">
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    color: theme.primaryColor,
                    backgroundColor: `${theme.primaryColor}15`,
                  }}
                >
                  {overallProgress}% 完了
                </span>
                <span style={{ color: theme.primaryColor }}>
                  {completedPages}/{project.total_pages}
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: `${theme.primaryColor}20` }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              </div>
              {project.deadline && (
                <p className="mt-2 text-xs text-[#A0AEC0]">
                  締切まで{" "}
                  <span className="font-bold text-[#4A5568]">
                    {differenceInDays(new Date(project.deadline), new Date())}
                  </span>{" "}
                  日
                </p>
              )}
            </div>
            <PomodoroTimer projectId={id} theme={theme} />
          </div>

          {/* Right: grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#EEE] min-h-[380px]">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-bold text-[#2D3748]">ページごとの進捗</h3>
                  <p className="text-xs text-[#A0AEC0] mt-0.5">
                    タップ/クリックで工程別進捗を入力できます
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowStepEditor(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-[#E2E8F0] text-[#718096] hover:bg-[#F7FAFC]"
                  >
                    <Settings size={13} /> 工程設定
                  </button>
                  <div className="flex bg-[#F7FAFC] p-0.5 rounded-lg border border-[#E2E8F0]">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-white shadow-sm" : "text-[#A0AEC0]"}`}
                      style={
                        viewMode === "grid" ? { color: theme.primaryColor } : {}
                      }
                    >
                      <LayoutGrid size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-white shadow-sm" : "text-[#A0AEC0]"}`}
                      style={
                        viewMode === "list" ? { color: theme.primaryColor } : {}
                      }
                    >
                      <List size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                {[0, 25, 50, 75, 100].map((v) => (
                  <div key={v} className="flex items-center gap-1">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getProgressBg(v) }}
                    />
                    <span className="text-[10px] text-[#A0AEC0] font-bold">
                      {v}%
                    </span>
                  </div>
                ))}
              </div>

              {viewMode === "grid" ? (
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {progress.map((p) => {
                    const pval = +p.progress;
                    return (
                      <motion.button
                        key={p.page_number}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setSelectedPage(p.page_number)}
                        className="aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold border-2 transition-all"
                        style={{
                          backgroundColor: getProgressBg(pval),
                          borderColor:
                            pval === 100 ? theme.primaryColor : "transparent",
                          color: pval >= 50 ? "#fff" : "#718096",
                        }}
                      >
                        <span>{p.page_number}</span>
                        {pval === 100 && (
                          <CheckCircle size={10} className="mt-0.5" />
                        )}
                        {pval > 0 && pval < 100 && (
                          <span style={{ fontSize: "8px" }}>{pval}%</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {progress.map((p) => {
                    const pval = +p.progress;
                    return (
                      <div
                        key={p.page_number}
                        className="flex items-center gap-3 p-3 bg-[#F7FAFC] rounded-xl border border-[#EDF2F7] cursor-pointer hover:bg-[#EDF2F7] transition-all"
                        onClick={() => setSelectedPage(p.page_number)}
                      >
                        <span className="font-bold text-[#4A5568] w-16 text-sm">
                          {p.page_number} P
                        </span>
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden"
                          style={{ backgroundColor: `${theme.primaryColor}20` }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pval}%`,
                              backgroundColor: theme.primaryColor,
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-bold w-8 text-right"
                          style={{ color: theme.primaryColor }}
                        >
                          {pval}%
                        </span>
                        {pval === 100 && (
                          <CheckCircle
                            size={14}
                            style={{ color: theme.primaryColor }}
                          />
                        )}
                        <ChevronRight size={14} className="text-[#CBD5E0]" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedPage !== null && (
          <StepProgressModal
            projectId={id}
            pageNumber={selectedPage}
            theme={theme}
            onClose={() => setSelectedPage(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showStepEditor && (
          <StepEditorModal
            projectId={id}
            theme={theme}
            onClose={() => setShowStepEditor(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showThemePanel && (
          <ThemePanel
            onClose={() => setShowThemePanel(false)}
            theme={theme}
            setTheme={setTheme}
            resetTheme={resetTheme}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

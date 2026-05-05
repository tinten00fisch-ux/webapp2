"use client";
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle,
  ChevronRight,
  Plus,
  LogOut,
  Image as ImageIcon,
  Palette,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  CalendarDays,
  LayoutGrid,
  Flame,
  Star,
  Trash2,
  ChevronLeft,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import useAuth from "@/utils/useAuth";
import useTheme from "@/utils/useTheme";
import {
  format,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { ja } from "date-fns/locale";
import { Toaster, toast } from "sonner";

// ─── Auth Modal ───────────────────────────────────────────────────────────────
const AuthModal = ({ isOpen, onClose, defaultTab }) => {
  const [tab, setTab] = useState(defaultTab || "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signInWithCredentials, signUpWithCredentials } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab || "signin");
      setEmail("");
      setPassword("");
      setError("");
    }
  }, [isOpen, defaultTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (tab === "signin")
        await signInWithCredentials({ email, password, callbackUrl: "/" });
      else await signUpWithCredentials({ email, password, callbackUrl: "/" });
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[#4A90E2] rounded-lg flex items-center justify-center">
            <CheckCircle className="text-white" size={18} />
          </div>
          <span className="font-bold text-lg text-[#2D3748]">原稿進捗管理</span>
        </div>
        <div className="flex bg-[#F7FAFC] rounded-xl p-1 mb-6 border border-[#E2E8F0]">
          <button
            onClick={() => {
              setTab("signin");
              setError("");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === "signin" ? "bg-white shadow text-[#2D3748]" : "text-[#A0AEC0]"}`}
          >
            ログイン
          </button>
          <button
            onClick={() => {
              setTab("signup");
              setError("");
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === "signup" ? "bg-white shadow text-[#2D3748]" : "text-[#A0AEC0]"}`}
          >
            新規登録
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4A5568] mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#4A5568] mb-1">
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0AEC0] hover:text-[#4A5568]"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all mt-2 disabled:opacity-60"
            style={{ backgroundColor: "#4A90E2" }}
          >
            {loading
              ? "処理中..."
              : tab === "signin"
                ? "ログイン"
                : "アカウント作成"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Theme Panel ──────────────────────────────────────────────────────────────
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

// ─── Add Event Modal ──────────────────────────────────────────────────────────
const AddEventModal = ({ date, projects, theme, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [color, setColor] = useState(theme.primaryColor);
  const [loading, setLoading] = useState(false);
  const quickColors = [
    "#4A90E2",
    "#48BB78",
    "#9F7AEA",
    "#ED64A6",
    "#F6AD55",
    "#E53E3E",
  ];

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("タイトルを入力してください");
      return;
    }
    setLoading(true);
    await onSave({
      title: title.trim(),
      event_date: format(date, "yyyy-MM-dd"),
      color,
      project_id: projectId || null,
    });
    setLoading(false);
    onClose();
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
        className="bg-white rounded-2xl p-6 w-80 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[#2D3748]">
            {format(date, "M月d日")} に予定を追加
          </h3>
          <button onClick={onClose}>
            <X size={18} className="text-[#A0AEC0]" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-[#4A5568] block mb-1">
              タイトル
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="予定のタイトル"
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#4A5568] block mb-1">
              関連プロジェクト（任意）
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">なし</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#4A5568] block mb-1">
              カラー
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-[#E2E8F0] cursor-pointer p-0.5"
              />
              <div className="flex gap-1.5">
                {quickColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "#2D3748" : "transparent",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-60"
            style={{ backgroundColor: theme.primaryColor }}
          >
            {loading ? "保存中..." : "追加する"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Calendar View ────────────────────────────────────────────────────────────
const CalendarView = ({ theme, projects, calendarData }) => {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { events = [], deadlines = [], stamps = [] } = calendarData || {};

  const addEvent = useMutation({
    mutationFn: async (data) => {
      const r = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("予定を追加しました");
    },
    onError: () => toast.error("追加に失敗しました"),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id) => {
      const r = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast.success("削除しました");
    },
  });

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });
  const firstDayOfWeek = getDay(startOfMonth(currentMonth));
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  const stampSet = new Set(
    stamps.map((s) => {
      const d = typeof s === "string" ? s : String(s);
      return d.slice(0, 10);
    }),
  );

  const getEventsForDay = (day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayEvents = events.filter(
      (e) =>
        (typeof e.event_date === "string"
          ? e.event_date
          : String(e.event_date)
        ).slice(0, 10) === dateStr,
    );
    const dayDeadlines = deadlines.filter(
      (d) =>
        (typeof d.event_date === "string"
          ? d.event_date
          : String(d.event_date)
        ).slice(0, 10) === dateStr,
    );
    return { events: dayEvents, deadlines: dayDeadlines };
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Calendar grid */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-[#EEE]">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-[#F7FAFC] text-[#718096]"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-bold text-[#2D3748] text-lg">
            {format(currentMonth, "yyyy年M月", { locale: ja })}
          </h3>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-lg hover:bg-[#F7FAFC] text-[#718096]"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {dayNames.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-bold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-[#A0AEC0]"}`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {daysInMonth.map((day) => {
            const { events: dayEvts, deadlines: dayDls } = getEventsForDay(day);
            const stamped = stampSet.has(format(day, "yyyy-MM-dd"));
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const todayDay = isToday(day);
            const isSun = getDay(day) === 0;
            const isSat = getDay(day) === 6;
            const hasAny = dayEvts.length > 0 || dayDls.length > 0 || stamped;

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative flex flex-col items-center py-1.5 rounded-xl min-h-[52px] transition-all ${isSelected ? "outline outline-2" : "hover:bg-[#F7FAFC]"}`}
                style={isSelected ? { outlineColor: theme.primaryColor } : {}}
              >
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${todayDay ? "text-white" : isSun ? "text-red-400" : isSat ? "text-blue-400" : "text-[#2D3748]"}`}
                  style={
                    todayDay ? { backgroundColor: theme.primaryColor } : {}
                  }
                >
                  {format(day, "d")}
                </span>
                {stamped && (
                  <span style={{ fontSize: "11px", lineHeight: 1 }}>⭐</span>
                )}
                <div className="flex gap-0.5 flex-wrap justify-center max-w-[32px] mt-0.5">
                  {dayDls.slice(0, 2).map((_, i) => (
                    <div
                      key={`d${i}`}
                      className="w-1.5 h-1.5 rounded-full bg-red-400"
                    />
                  ))}
                  {dayEvts.slice(0, 2).map((e, i) => (
                    <div
                      key={`e${i}`}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: e.color || theme.primaryColor }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mt-4 pt-3 border-t border-[#F0F0F0] flex-wrap">
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: "11px" }}>⭐</span>
            <span className="text-xs text-[#A0AEC0]">ログイン</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-xs text-[#A0AEC0]">締め切り</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <span className="text-xs text-[#A0AEC0]">予定</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Selected day detail */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#EEE]">
          {selectedDay ? (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-[#2D3748]">
                  {format(selectedDay, "M月d日(E)", { locale: ja })}
                </h4>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Plus size={13} /> 追加
                </button>
              </div>
              {selectedDayEvents.deadlines.map((d) => (
                <div
                  key={`dl-${d.id}`}
                  className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-100 mb-2"
                >
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-xs font-bold text-red-600 truncate flex-1">
                    締め切り: {d.title}
                  </p>
                </div>
              ))}
              {selectedDayEvents.events.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-2 p-2.5 bg-[#F7FAFC] rounded-xl border border-[#EDF2F7] mb-2"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: e.color || theme.primaryColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#2D3748] truncate">
                      {e.title}
                    </p>
                    {e.project_title && (
                      <p className="text-[10px] text-[#A0AEC0]">
                        {e.project_title}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteEvent.mutate(e.id)}
                    className="text-[#CBD5E0] hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {selectedDayEvents.deadlines.length === 0 &&
                selectedDayEvents.events.length === 0 && (
                  <p className="text-xs text-[#A0AEC0] text-center py-4">
                    予定はありません
                  </p>
                )}
            </div>
          ) : (
            <div className="text-center py-6">
              <CalendarDays
                size={30}
                className="mx-auto mb-2"
                style={{ color: `${theme.primaryColor}50` }}
              />
              <p className="text-xs text-[#A0AEC0]">
                日付をタップして
                <br />
                予定を確認・追加できます
              </p>
            </div>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#EEE]">
          <h4 className="font-bold text-[#2D3748] mb-3 text-sm flex items-center gap-2">
            <CalendarDays size={15} style={{ color: theme.primaryColor }} />{" "}
            近い締め切り
          </h4>
          {deadlines
            .filter((d) => {
              const diff = differenceInDays(new Date(d.event_date), new Date());
              return diff >= -1 && diff <= 60;
            })
            .slice(0, 5)
            .map((d) => {
              const diff = differenceInDays(new Date(d.event_date), new Date());
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-2 border-b border-[#F0F0F0] last:border-0"
                >
                  <div>
                    <p className="text-xs font-bold text-[#2D3748]">
                      {d.title}
                    </p>
                    <p className="text-[10px] text-[#A0AEC0]">
                      {format(new Date(d.event_date), "yyyy/MM/dd")}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff < 0 ? "bg-red-50 text-red-500" : diff <= 3 ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500"}`}
                  >
                    {diff < 0
                      ? `超過${Math.abs(diff)}日`
                      : diff === 0
                        ? "今日"
                        : `残り${diff}日`}
                  </span>
                </div>
              );
            })}
          {deadlines.length === 0 && (
            <p className="text-xs text-[#A0AEC0] text-center py-3">
              締め切りはありません
            </p>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && selectedDay && (
          <AddEventModal
            date={selectedDay}
            projects={projects}
            theme={theme}
            onClose={() => setShowAddModal(false)}
            onSave={(data) => addEvent.mutateAsync(data)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Work Summary ──────────────────────────────────────────────────────────────
const WorkSummary = ({ logs, streak, theme }) => {
  const totalSeconds = logs.reduce(
    (acc, l) => acc + parseInt(l.total_seconds),
    0,
  );
  const totalHours = (totalSeconds / 3600).toFixed(1);
  return (
    <div
      className="rounded-2xl p-5 text-white mb-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4"
      style={{ backgroundColor: theme.primaryColor }}
    >
      <div>
        <h3 className="text-white/70 font-bold text-xs mb-1 uppercase tracking-wider">
          累計作業時間（過去30日）
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black">{totalHours}</span>
          <span className="text-white/70 font-bold">時間</span>
        </div>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-center min-w-[80px]">
          <span className="text-white/60 text-[10px] font-bold">ログ件数</span>
          <span className="text-xl font-bold">{logs.length}件</span>
        </div>
        {streak && streak.current_streak > 0 && (
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-center min-w-[80px]">
            <span className="text-white/60 text-[10px] font-bold flex items-center gap-1">
              <Flame size={10} /> 連続
            </span>
            <span className="text-xl font-bold">{streak.current_streak}日</span>
          </div>
        )}
        {streak && streak.longest_streak > 0 && (
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col items-center min-w-[80px]">
            <span className="text-white/60 text-[10px] font-bold flex items-center gap-1">
              <Star size={10} /> 最長
            </span>
            <span className="text-xl font-bold">{streak.longest_streak}日</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const { theme, setTheme, resetTheme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState("signin");
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");

  const openModal = (tab) => {
    setModalTab(tab);
    setShowModal(true);
  };

  // Record daily login + stamp
  useEffect(() => {
    if (user) {
      fetch("/api/login-streak", { method: "POST" })
        .then(() => queryClient.invalidateQueries({ queryKey: ["calendar"] }))
        .catch(() => {});
    }
  }, [user]);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const r = await fetch("/api/projects");
      if (!r.ok) throw new Error();
      return r.json();
    },
    enabled: !!user,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["work-logs"],
    queryFn: async () => {
      const r = await fetch("/api/work-logs");
      if (!r.ok) throw new Error();
      return r.json();
    },
    enabled: !!user,
  });

  const { data: calendarData } = useQuery({
    queryKey: ["calendar"],
    queryFn: async () => {
      const r = await fetch("/api/calendar");
      if (!r.ok) throw new Error();
      return r.json();
    },
    enabled: !!user,
  });

  if (userLoading || (user && projectsLoading)) {
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

  return (
    <div
      className="min-h-screen font-sans"
      style={{ backgroundColor: theme.bgColor }}
    >
      <Toaster position="top-center" />

      {!user ? (
        /* ─ Landing ─ */
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <CheckCircle className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-[#2D3748] mb-2">
              原稿進捗管理
            </h1>
            <p className="text-[#718096] mb-10 text-sm">
              作業の進捗を管理し、集中力を維持しましょう
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => openModal("signin")}
                className="px-8 py-3 rounded-xl font-bold text-white shadow-lg hover:opacity-90"
                style={{ backgroundColor: theme.primaryColor }}
              >
                ログイン
              </button>
              <button
                onClick={() => openModal("signup")}
                className="px-8 py-3 rounded-xl font-bold text-[#4A5568] bg-white border border-[#E2E8F0] hover:bg-gray-50 shadow-sm"
              >
                新規登録
              </button>
            </div>
          </motion.div>
          <AnimatePresence>
            {showModal && (
              <AuthModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                defaultTab={modalTab}
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ─ Dashboard ─ */
        <>
          <header
            className="border-b border-[#EEE] py-4 px-6 flex justify-between items-center sticky top-0 z-40"
            style={{ backgroundColor: theme.headerBgColor }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <CheckCircle className="text-white" size={20} />
              </div>
              <span className="font-bold text-xl text-[#2D3748]">
                原稿進捗管理
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Streak badge */}
              {calendarData?.streak?.current_streak > 0 && (
                <div
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `${theme.primaryColor}15`,
                    color: theme.primaryColor,
                  }}
                >
                  <Flame size={12} /> {calendarData.streak.current_streak}日連続
                </div>
              )}
              <span className="text-sm text-[#718096] hidden md:block">
                {user.email}
              </span>
              <button
                onClick={() => setShowThemePanel(true)}
                className="p-2 rounded-lg hover:bg-[#F7FAFC] text-[#718096]"
              >
                <Palette size={18} />
              </button>
              <button
                onClick={() => (window.location.href = "/account/logout")}
                className="flex items-center gap-1 text-sm text-[#E53E3E] hover:bg-red-50 px-3 py-1.5 rounded-lg"
              >
                <LogOut size={16} />
                <span className="hidden md:block">ログアウト</span>
              </button>
            </div>
          </header>

          <main className="max-w-6xl mx-auto py-6 px-4 md:px-6">
            {/* Tab nav */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-[#EEE] mb-6 w-fit shadow-sm">
              <button
                onClick={() => setActiveTab("projects")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "projects" ? "text-white shadow" : "text-[#A0AEC0] hover:text-[#718096]"}`}
                style={
                  activeTab === "projects"
                    ? { backgroundColor: theme.primaryColor }
                    : {}
                }
              >
                <LayoutGrid size={15} /> プロジェクト
              </button>
              <button
                onClick={() => setActiveTab("calendar")}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "calendar" ? "text-white shadow" : "text-[#A0AEC0] hover:text-[#718096]"}`}
                style={
                  activeTab === "calendar"
                    ? { backgroundColor: theme.primaryColor }
                    : {}
                }
              >
                <CalendarDays size={15} /> カレンダー
              </button>
            </div>

            {activeTab === "projects" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#2D3748]">
                    マイプロジェクト
                  </h2>
                  <a
                    href="/projects/new"
                    className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Plus size={18} /> 新規プロジェクト
                  </a>
                </div>

                {logs.length > 0 && (
                  <WorkSummary
                    logs={logs}
                    streak={calendarData?.streak}
                    theme={theme}
                  />
                )}

                {projects.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle
                        size={40}
                        style={{ color: theme.primaryColor }}
                      />
                    </div>
                    <h2 className="text-2xl font-bold text-[#2D3748] mb-3">
                      進捗管理を始めましょう
                    </h2>
                    <p className="text-[#718096] max-w-md mx-auto mb-8">
                      プロジェクトを作成して、ページごとの進捗を記録しましょう。
                    </p>
                    <a
                      href="/projects/new"
                      className="inline-flex items-center gap-2 text-white px-8 py-3 rounded-full font-bold hover:opacity-90"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      <Plus size={20} /> プロジェクトを作成する
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {projects.map((project) => {
                      const daysLeft = project.deadline
                        ? differenceInDays(
                            new Date(project.deadline),
                            new Date(),
                          )
                        : null;
                      return (
                        <motion.div
                          key={project.id}
                          whileHover={{ y: -4 }}
                          className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EEE] group cursor-pointer"
                          onClick={() =>
                            (window.location.href = `/projects/${project.id}`)
                          }
                        >
                          <div
                            className="h-28 relative overflow-hidden"
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
                                <ImageIcon
                                  size={36}
                                  style={{ color: `${theme.primaryColor}50` }}
                                />
                              </div>
                            )}
                          </div>
                          <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-[#2D3748] line-clamp-1">
                                {project.title || "無題"}
                              </h3>
                              <ChevronRight
                                className="text-[#CBD5E0] group-hover:text-[#4A90E2] flex-shrink-0"
                                size={18}
                              />
                            </div>
                            <div className="flex gap-2 flex-wrap text-xs font-bold mb-3">
                              <span
                                className="px-2 py-0.5 rounded-full"
                                style={{
                                  color: theme.primaryColor,
                                  backgroundColor: `${theme.primaryColor}15`,
                                }}
                              >
                                計 {project.total_pages} P
                              </span>
                              {daysLeft !== null && (
                                <span
                                  className={
                                    daysLeft < 0
                                      ? "text-red-500 bg-red-50 px-2 py-0.5 rounded-full"
                                      : "text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full"
                                  }
                                >
                                  {daysLeft < 0
                                    ? `超過${Math.abs(daysLeft)}日`
                                    : `残り${daysLeft}日`}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between text-xs text-[#A0AEC0]">
                              <span>
                                開始:{" "}
                                {project.start_date
                                  ? format(
                                      new Date(project.start_date),
                                      "yyyy/MM/dd",
                                    )
                                  : "-"}
                              </span>
                              <span>
                                締切:{" "}
                                {project.deadline
                                  ? format(
                                      new Date(project.deadline),
                                      "yyyy/MM/dd",
                                    )
                                  : "-"}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "calendar" && (
              <CalendarView
                theme={theme}
                projects={projects}
                calendarData={
                  calendarData || { events: [], deadlines: [], stamps: [] }
                }
              />
            )}
          </main>

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
        </>
      )}
    </div>
  );
}

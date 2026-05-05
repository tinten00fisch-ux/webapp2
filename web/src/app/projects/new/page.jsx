import React, { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, CheckCircle, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import useUser from "@/utils/useUser";
import { Toaster, toast } from "sonner";

export default function NewProjectPage() {
  const { data: user, loading: userLoading } = useUser();
  const [title, setTitle] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [deadline, setDeadline] = useState("");

  const createProjectMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("プロジェクトを作成しました！");
      setTimeout(() => {
        window.location.href = `/projects/${data.id}`;
      }, 1000);
    },
    onError: () => {
      toast.error("作成に失敗しました。");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) {
      toast.error("タイトルを入力してください");
      return;
    }
    createProjectMutation.mutate({
      title,
      total_pages: totalPages,
      start_date: startDate,
      deadline: deadline || null,
    });
  };

  if (userLoading) return null;
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/account/signin";
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans pb-12">
      <Toaster position="top-center" />
      <header className="bg-white border-b border-[#EEE] py-4 px-6 flex items-center sticky top-0 z-50">
        <button
          onClick={() => (window.location.href = "/")}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors mr-4"
        >
          <ChevronLeft size={20} className="text-[#4A5568]" />
        </button>
        <h1 className="font-bold text-lg text-[#2D3748]">
          新規プロジェクト作成
        </h1>
      </header>

      <main className="max-w-2xl mx-auto py-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-sm border border-[#EEE]"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#4A90E2] rounded-xl flex items-center justify-center">
              <CheckCircle className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2D3748]">
                基本情報の設定
              </h2>
              <p className="text-sm text-[#718096]">
                プロジェクトの詳細を入力してください
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#4A5568]">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 夏のコミック原稿"
                className="w-full bg-[#F7FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 outline-none focus:border-[#4A90E2] focus:ring-1 focus:ring-[#4A90E2] transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#4A5568]">
                  総ページ数
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={totalPages}
                  onChange={(e) => setTotalPages(parseInt(e.target.value))}
                  className="w-full bg-[#F7FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 outline-none focus:border-[#4A90E2] focus:ring-1 focus:ring-[#4A90E2] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#4A5568]">
                  開始日
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#F7FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 outline-none focus:border-[#4A90E2] focus:ring-1 focus:ring-[#4A90E2] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#4A5568]">
                締め切り日
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-[#F7FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 outline-none focus:border-[#4A90E2] focus:ring-1 focus:ring-[#4A90E2] transition-all"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={createProjectMutation.isPending}
                className="w-full bg-[#4A90E2] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#357ABD] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {createProjectMutation.isPending
                  ? "作成中..."
                  : "進捗管理を始める"}
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}

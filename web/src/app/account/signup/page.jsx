import { useState } from "react";
import useAuth from "@/utils/useAuth";

function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signUpWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("すべての項目を入力してください");
      setLoading(false);
      return;
    }

    try {
      await signUpWithCredentials({
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      setError(
        "アカウント登録に失敗しました。このメールアドレスは既に登録されている可能性があります。",
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F9FAFB] p-4 font-sans text-[#333]">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-[#EEE]"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#2D3748] mb-2">新規登録</h1>
          <p className="text-sm text-[#718096]">
            アカウントを作成して進捗管理を開始
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4A5568]">
              メールアドレス
            </label>
            <input
              required
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3 outline-none focus:border-[#4A90E2] focus:ring-1 focus:ring-[#4A90E2] transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4A5568]">
              パスワード
            </label>
            <input
              required
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-3 outline-none focus:border-[#4A90E2] focus:ring-1 focus:ring-[#4A90E2] transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#4A90E2] px-4 py-3 text-base font-bold text-white transition-colors hover:bg-[#357ABD] focus:outline-none disabled:opacity-50"
          >
            {loading ? "読み込み中..." : "登録する"}
          </button>

          <p className="text-center text-sm text-[#718096]">
            既にアカウントをお持ちの場合は{" "}
            <a
              href="/account/signin"
              className="text-[#4A90E2] hover:underline font-bold"
            >
              ログイン
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default MainComponent;

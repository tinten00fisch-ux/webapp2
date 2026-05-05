import { useState } from "react";
import useAuth from "@/utils/useAuth";

function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signInWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      setLoading(false);
      return;
    }

    try {
      await signInWithCredentials({
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      setError(
        "ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。",
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
          <h1 className="text-2xl font-bold text-[#2D3748] mb-2">ログイン</h1>
          <p className="text-sm text-[#718096]">進捗管理アプリにログイン</p>
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
            {loading ? "読み込み中..." : "ログイン"}
          </button>

          <p className="text-center text-sm text-[#718096]">
            アカウントをお持ちでない場合は{" "}
            <a
              href="/account/signup"
              className="text-[#4A90E2] hover:underline font-bold"
            >
              新規登録
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default MainComponent;

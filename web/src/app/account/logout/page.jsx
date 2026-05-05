import useAuth from "@/utils/useAuth";

function MainComponent() {
  const { signOut } = useAuth();
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F9FAFB] p-4 font-sans text-[#333]">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm border border-[#EEE]">
        <h1 className="mb-8 text-center text-2xl font-bold text-[#2D3748]">
          ログアウト
        </h1>
        <p className="text-center text-[#718096] mb-8">
          ログアウトしてもよろしいですか？
        </p>

        <button
          onClick={handleSignOut}
          className="w-full rounded-lg bg-[#4A90E2] px-4 py-3 text-base font-bold text-white transition-colors hover:bg-[#357ABD] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:ring-offset-2 disabled:opacity-50"
        >
          ログアウトする
        </button>
        <button
          onClick={() => window.history.back()}
          className="w-full mt-4 rounded-lg bg-[#EDF2F7] px-4 py-3 text-base font-bold text-[#4A5568] transition-colors hover:bg-[#E2E8F0] focus:outline-none"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

export default MainComponent;

import { logout } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md border border-white/30 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
      >
        Sair
      </button>
    </form>
  );
}

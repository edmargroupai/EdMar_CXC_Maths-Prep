export default function AdminSignInPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">EdMar Admin</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sign in with a staff account that has content review permissions. Use the same Supabase
        project as the student app.
      </p>
      <p className="mt-6 text-sm text-slate-500">
        Wire the shared auth UI in the next pass — middleware already enforces `is_staff()`.
      </p>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {children}
    </main>
  );
}

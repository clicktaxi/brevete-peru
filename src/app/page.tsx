import categories from "@content/categories.json";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Brevete Perú</h1>
      <ul className="mt-4 space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="rounded-lg bg-surface p-4 shadow-sm">
            <span className="font-semibold">{c.code}</span> — {c.title.es}
          </li>
        ))}
      </ul>
    </main>
  );
}

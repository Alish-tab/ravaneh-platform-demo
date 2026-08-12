import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold text-slate-900">صفحه پیدا نشد</h1>
      <p className="text-sm text-slate-600">مسیر درخواستی وجود ندارد.</p>
      <Link
        to="/"
        className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
      >
        بازگشت به خانه
      </Link>
    </section>
  );
}

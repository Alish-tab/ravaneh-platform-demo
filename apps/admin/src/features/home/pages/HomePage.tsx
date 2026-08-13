import { Link } from 'react-router-dom';

import { Button, InlineMessage, Panel } from '@/shared/ui';

export function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">خانه</h1>
      <p className="text-sm leading-7 text-[var(--text-secondary)]">
        پایه Admin با Design Foundation (Dark) یکپارچه شده است. Featureهای واقعی Import Review،
        Planning و Route Editing بعداً روی همین Architecture اضافه می‌شوند.
      </p>

      <InlineMessage tone="info">
        فونت پیش‌فرض: Vazirmatn — خودمیزبان. Route color فقط Presentation است، نه Domain status.
      </InlineMessage>

      <Panel
        title="تأیید بصری"
        actions={
          <Link to="/foundation">
            <Button variant="secondary" size="sm">
              Foundation Smoke
            </Button>
          </Link>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          صفحه Smoke فقط برای بررسی primitives است و در ناوبری اصلی نیست.
        </p>
      </Panel>
    </section>
  );
}

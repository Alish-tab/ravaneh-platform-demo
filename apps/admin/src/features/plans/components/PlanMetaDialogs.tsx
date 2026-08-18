import { useState } from 'react';

import { Button, Field, InlineMessage, Input } from '@/shared/ui';

import type { A01PlanViewModel } from '@/features/plans/a01-types';
import { DialogShell } from '@/features/plans/components/DialogShell';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { A01_DELIVERY_WINDOWS } from '@/features/plans/presentation';

type EditPlanDialogProps = {
  plan: A01PlanViewModel;
  onSave: (updates: { name: string; deliveryDate: string; window?: string }) => Promise<void>;
  onCancel: () => void;
};

export function EditPlanDialog({ plan, onSave, onCancel }: EditPlanDialogProps) {
  const [name, setName] = useState(plan.name);
  const [deliveryDate, setDeliveryDate] = useState(plan.deliveryDate);
  const [windowValue, setWindowValue] = useState(plan.window ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = !plan.canEditMetadata;

  const submit = async () => {
    if (!name.trim() || !deliveryDate.trim() || saving || locked) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        deliveryDate: deliveryDate.trim(),
        window: windowValue.trim() || undefined,
      });
    } catch {
      setError('ذخیره مشخصات ناموفق بود.');
      setSaving(false);
    }
  };

  return (
    <DialogShell
      title="ویرایش مشخصات برنامه"
      subtitle={plan.id}
      icon={
        <span className="text-[var(--accent)]">
          <Icon d={ICONS.edit} size={16} />
        </span>
      }
      onClose={onCancel}
      footer={
        <>
          <Button variant="subtle" onClick={onCancel} disabled={saving}>
            انصراف
          </Button>
          <Button
            variant="primary"
            loading={saving}
            disabled={locked || !name.trim() || !deliveryDate.trim()}
            onClick={() => void submit()}
          >
            ذخیره
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        {locked ? (
          <InlineMessage tone="warning">
            مشخصات این برنامه در وضعیت فعلی قابل ویرایش نیست.
          </InlineMessage>
        ) : null}

        <Field label="تاریخ تحویل" htmlFor="a01-edit-date">
          <Input
            id="a01-edit-date"
            value={deliveryDate}
            disabled={locked}
            onChange={(event) => setDeliveryDate(event.target.value)}
          />
        </Field>

        <Field label="پنجره زمانی (اختیاری)">
          <div className="flex gap-1.5">
            {A01_DELIVERY_WINDOWS.map((option) => {
              const selected = windowValue === option;
              return (
                <button
                  key={option}
                  type="button"
                  disabled={locked}
                  className={['plan-window-chip', selected ? 'selected' : '']
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={selected}
                  onClick={() => setWindowValue(selected ? '' : option)}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="نام برنامه" htmlFor="a01-edit-name">
          <Input
            id="a01-edit-name"
            value={name}
            disabled={locked}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
      </div>
    </DialogShell>
  );
}

type DeleteDraftDialogProps = {
  plan: A01PlanViewModel;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function DeleteDraftDialog({ plan, onConfirm, onCancel }: DeleteDraftDialogProps) {
  const [busy, setBusy] = useState(false);

  return (
    <DialogShell
      title="حذف پیش‌نویس"
      subtitle={plan.name}
      icon={
        <span className="text-[var(--error-text)]">
          <Icon d={ICONS.trash} size={16} />
        </span>
      }
      onClose={onCancel}
      footer={
        <>
          <Button variant="subtle" onClick={onCancel} disabled={busy}>
            انصراف
          </Button>
          <Button
            variant="destructive"
            loading={busy}
            onClick={() => {
              setBusy(true);
              void onConfirm().finally(() => setBusy(false));
            }}
          >
            حذف پیش‌نویس
          </Button>
        </>
      }
    >
      <InlineMessage tone="warning">
        این پیش‌نویس هنوز فایل ورودی ندارد و پس از حذف قابل بازیابی نیست.
      </InlineMessage>
    </DialogShell>
  );
}

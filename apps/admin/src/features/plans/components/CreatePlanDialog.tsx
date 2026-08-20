import { useEffect, useMemo } from 'react';

import { zodResolver } from '@/shared/lib/forms';
import { Controller, useForm, z } from '@/shared/lib/forms';
import { Button, Field, InlineMessage, Input } from '@/shared/ui';

import { DialogShell } from '@/features/plans/components/DialogShell';
import { Icon, ICONS } from '@/features/plans/components/icons';
import { generatePlanName } from '@/features/plans/plan-name';
import { A01_DELIVERY_WINDOWS } from '@/features/plans/presentation';

const createPlanSchema = z.object({
  deliveryDate: z.string().trim().min(1, 'تاریخ تحویل الزامی است'),
  window: z.string().optional(),
  name: z.string().trim().min(1, 'نام برنامه الزامی است'),
  nameEdited: z.boolean(),
});

export type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

type CreatePlanDialogProps = {
  onSubmit: (values: { name: string; deliveryDate: string; window?: string }) => Promise<void>;
  onCancel: () => void;
};

export function CreatePlanDialog({ onSubmit, onCancel }: CreatePlanDialogProps) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      deliveryDate: '',
      window: '',
      name: 'برنامه تحویل',
      nameEdited: false,
    },
  });

  const deliveryDate = watch('deliveryDate');
  const windowValue = watch('window');
  const nameEdited = watch('nameEdited');
  const name = watch('name');

  useEffect(() => {
    if (!nameEdited) {
      setValue('name', generatePlanName(deliveryDate, windowValue || undefined), {
        shouldValidate: false,
      });
    }
  }, [deliveryDate, windowValue, nameEdited, setValue]);

  const createError = errors.root?.message;
  const suggestedHint = useMemo(() => !nameEdited && name !== 'برنامه تحویل', [nameEdited, name]);

  const submit = handleSubmit(async (values) => {
    clearErrors('root');
    try {
      await onSubmit({
        name: values.name.trim(),
        deliveryDate: values.deliveryDate.trim(),
        window: values.window?.trim() || undefined,
      });
    } catch {
      setError('root', {
        message: 'ایجاد برنامه با خطا مواجه شد. اطلاعات وارد شده حفظ شده‌اند. دوباره تلاش کنید.',
      });
    }
  });

  return (
    <DialogShell
      title="برنامه جدید"
      subtitle="شناسه توسط سیستم تولید می‌شود"
      icon={
        <span className="text-[var(--accent)]">
          <Icon d={ICONS.plus} size={16} />
        </span>
      }
      onClose={onCancel}
      footer={
        <>
          <Button variant="subtle" onClick={onCancel} disabled={isSubmitting}>
            انصراف
          </Button>
          <Button
            variant={createError ? 'secondary' : 'primary'}
            type="submit"
            form="a01-create-plan-form"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {createError ? 'تلاش مجدد' : 'ایجاد برنامه'}
          </Button>
        </>
      }
    >
      <form
        id="a01-create-plan-form"
        className="flex flex-col gap-3.5"
        onSubmit={submit}
        noValidate
      >
        <Field
          label={
            <>
              تاریخ تحویل <span className="text-[var(--error-text)]">*</span>
            </>
          }
          error={errors.deliveryDate?.message}
          htmlFor="a01-delivery-date"
        >
          <div className="relative">
            <Input
              id="a01-delivery-date"
              placeholder="مثال: ۱۴۰۵/۰۶/۰۵"
              className="pe-8"
              error={Boolean(errors.deliveryDate)}
              aria-required
              {...register('deliveryDate')}
            />
            <span className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <Icon d={ICONS.calendar} size={13} />
            </span>
          </div>
        </Field>

        <Field
          label={
            <>
              پنجره زمانی تحویل{' '}
              <span className="font-normal text-[var(--text-muted)]">(اختیاری)</span>
            </>
          }
        >
          <Controller
            control={control}
            name="window"
            render={({ field }) => (
              <div className="flex gap-1.5" role="group" aria-label="پنجره زمانی تحویل">
                {A01_DELIVERY_WINDOWS.map((option) => {
                  const selected = field.value === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={['plan-window-chip', selected ? 'selected' : '']
                        .filter(Boolean)
                        .join(' ')}
                      aria-pressed={selected}
                      onClick={() => field.onChange(selected ? '' : option)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </Field>

        <Field
          label="نام برنامه"
          hint={suggestedHint ? 'پیشنهاد خودکار — قابل ویرایش' : undefined}
          error={errors.name?.message}
          htmlFor="a01-plan-name"
        >
          <Input
            id="a01-plan-name"
            placeholder="برنامه تحویل — ..."
            {...register('name', {
              onChange: () => setValue('nameEdited', true),
            })}
          />
        </Field>

        {createError ? <InlineMessage tone="error">{createError}</InlineMessage> : null}

        <InlineMessage tone="info">
          پس از ایجاد برنامه می‌توانید فایل اکسل داده‌های تحویل را بارگذاری کنید.
        </InlineMessage>
      </form>
    </DialogShell>
  );
}

import { useCallback, useState } from 'react';

import { ReviewLocationEditor } from '@/features/import-review/components/ReviewLocationEditor';
import { savedLocation } from '@/features/import-review/review-model';
import type { ReviewLatLng, ReviewTask } from '@/features/import-review/review-types';
import { DialogShell } from '@/shared/ui/DialogShell';
import { Button } from '@/shared/ui';

type ReviewLocationDialogProps = {
  task: ReviewTask;
  pending: boolean;
  onConfirm: (id: string, coords: ReviewLatLng) => Promise<boolean>;
  onCancel: () => void;
};

export function ReviewLocationDialog({
  task,
  pending,
  onConfirm,
  onCancel,
}: ReviewLocationDialogProps) {
  const [proposed, setProposed] = useState<ReviewLatLng | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const saving = pending || submitting;
  const close = useCallback(() => {
    if (!saving) onCancel();
  }, [onCancel, saving]);

  return (
    <div className="review-location-dialog">
      <DialogShell
        title="اصلاح موقعیت"
        subtitle="موقعیت صحیح را روی نقشه انتخاب کنید"
        onClose={close}
        showCloseButton
        closeDisabled={saving}
        footer={
          <>
            <Button variant="subtle" disabled={saving} onClick={close}>
              انصراف
            </Button>
            <Button
              loading={saving}
              disabled={!proposed || saving}
              onClick={async () => {
                if (!proposed || saving) return;
                setSubmitting(true);
                if (await onConfirm(task.id, proposed)) {
                  onCancel();
                } else {
                  setSubmitting(false);
                }
              }}
            >
              تأیید موقعیت
            </Button>
          </>
        }
      >
        <ReviewLocationEditor
          saved={savedLocation(task)}
          proposed={proposed}
          onPropose={setProposed}
        />
      </DialogShell>
    </div>
  );
}

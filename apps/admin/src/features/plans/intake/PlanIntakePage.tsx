import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button, InlineMessage } from '@/shared/ui';

import type { DatasetDiffViewModel, MergeStrategy } from '@/features/plans/a01-types';
import { PlanContextHeader } from '@/features/plans/components/PlanContextHeader';
import {
  fixtureParseOutcomeFromFileName,
  parsedBatchFromFile,
} from '@/features/plans/fixture/plans-fixture';
import { usePlansDataPort } from '@/features/plans/fixture/usePlansFixture';
import { usePlan } from '@/features/plans/hooks/usePlansData';
import { ImportDropzone } from '@/features/plans/intake/components/ImportDropzone';
import {
  A01ModeChip,
  ApplyFailedState,
  ApplySuccessState,
  ApplyingState,
  CompletedReadonlyBanner,
  DatasetActivePanel,
  DiffReadyPanel,
  ExecutionLockedBanner,
  ImportCleanState,
  ImportResultSummary,
  ProcessingState,
  SelectedFilePanel,
  StaleDataBanner,
  StructuralErrorState,
  UploadFailedState,
  UploadProgressState,
  WorkingVersionBanner,
} from '@/features/plans/intake/components/IntakePanels';
import {
  deriveInitialIntakeState,
  fileTypeFromName,
  hasWorkingDataset,
  type IntakeViewState,
} from '@/features/plans/intake/intake-state';
import { formatFileSizeLabel } from '@/features/plans/plan-name';
import '@/features/plans/styles/intake.css';

export function PlanIntakePage() {
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const port = usePlansDataPort();
  const { plan, status, reload } = usePlan(planId);

  const [viewState, setViewState] = useState<IntakeViewState>({ kind: 'idle' });
  const [staleDismissed, setStaleDismissed] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const initializedForId = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'ready' || !plan) return;
    if (initializedForId.current === plan.id) return;
    initializedForId.current = plan.id;
    setViewState(deriveInitialIntakeState(plan));
    setStaleDismissed(false);
  }, [plan, status]);

  const showStale =
    !staleDismissed &&
    Boolean(plan && (port.isStale(plan.id) || searchParams.get('stale') === '1'));

  const goToReview = () => {
    if (planId) navigate(`/plans/${planId}/review`);
  };

  const goToPlanning = () => {
    if (planId) navigate(`/plans/${planId}/planning`);
  };

  const backToDataset = () => {
    setPendingFile(null);
    setViewState(plan && hasWorkingDataset(plan) ? { kind: 'dataset-active' } : { kind: 'idle' });
  };

  const startUpload = async (file: File) => {
    if (!plan) return;
    const isUpdate = hasWorkingDataset(plan);
    setPendingFile(file);
    setViewState({ kind: 'uploading', progress: 100, fileName: file.name, isUpdate });

    const inspect = port.inspectUpload(file.name);
    if (inspect.kind === 'fail-upload') {
      setViewState({ kind: 'upload-failed', fileName: file.name, isUpdate });
      return;
    }

    setViewState({ kind: 'processing', fileName: file.name, isUpdate });

    if (inspect.kind === 'structural') {
      setViewState({ kind: 'structural-error', errorType: inspect.error, isUpdate });
      return;
    }

    if (isUpdate) {
      const diff = port.getDatasetDiff(file.name);
      setViewState({
        kind: 'diff-ready',
        fileName: file.name,
        diff,
        strategy: 'update-preserve',
        confirmReplace: false,
      });
      return;
    }

    const outcome = fixtureParseOutcomeFromFileName(file.name);
    const next = await port.applyImportBatch(
      plan.id,
      parsedBatchFromFile(file.name, outcome),
      outcome,
    );
    setViewState(
      outcome === 'clean'
        ? { kind: 'import-clean', importedFile: next.importedFile! }
        : { kind: 'import-result', importedFile: next.importedFile! },
    );
  };

  const applyStrategy = async (
    strategy: MergeStrategy,
    fileName: string,
    diff: DatasetDiffViewModel,
  ) => {
    if (!plan) return;
    const previousCount = plan.itemCount;
    setViewState({ kind: 'applying', strategy, fileName, diff });
    try {
      const outcome = fixtureParseOutcomeFromFileName(fileName);
      await port.applyDatasetStrategy(
        plan.id,
        strategy,
        diff,
        parsedBatchFromFile(fileName, outcome),
      );
      setViewState({ kind: 'apply-success', strategy });
    } catch {
      if (previousCount !== undefined) {
        /* dataset remains unchanged in the fixture port on failure */
      }
      setViewState({ kind: 'apply-failed', strategy, fileName, diff });
    }
  };

  const onFileSelected = (file: File) => {
    setPendingFile(file);
    setViewState({
      kind: 'file-selected',
      fileName: file.name,
      fileSize: formatFileSizeLabel(file.size),
      fileType: fileTypeFromName(file.name),
    });
  };

  if (status === 'loading') {
    return (
      <div className="plan-workspace-page p-6">
        <InlineMessage tone="info">در حال بارگذاری برنامه…</InlineMessage>
      </div>
    );
  }

  if (status === 'missing' || !plan) {
    return (
      <div className="plan-workspace-page flex flex-col items-start gap-3 p-6">
        <InlineMessage tone="error">برنامه یافت نشد.</InlineMessage>
        <Link to="/plans">
          <Button variant="secondary" size="sm">
            بازگشت به برنامه‌ها
          </Button>
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="plan-workspace-page flex flex-col items-start gap-3 p-6">
        <InlineMessage tone="error">بارگذاری برنامه ناموفق بود.</InlineMessage>
        <Button variant="secondary" size="sm" onClick={() => void reload()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const datasetFile = plan.importedFile;
  const canMutate = plan.canMutateDataset;
  const subtitle =
    plan.a01Mode === 'published-readonly'
      ? 'داده‌های منتشرشده — برای ویرایش نسخه کاری ایجاد کنید'
      : plan.a01Mode === 'working'
        ? 'نسخه کاری — این تغییرات هنوز برای رانندگان قابل مشاهده نیستند'
        : plan.a01Mode === 'execution-locked'
          ? 'داده‌های برنامه — فقط مشاهده'
          : plan.a01Mode === 'completed-readonly'
            ? 'داده‌های تاریخی — فقط مشاهده'
            : hasWorkingDataset(plan)
              ? 'مشاهده و به‌روزرسانی دیتاست سفارش‌های این برنامه'
              : 'فایل اکسل داده‌های تحویل را بارگذاری کنید';

  const inDeepFlow =
    viewState.kind === 'file-selected' ||
    viewState.kind === 'uploading' ||
    viewState.kind === 'upload-failed' ||
    viewState.kind === 'processing' ||
    viewState.kind === 'structural-error' ||
    viewState.kind === 'diff-ready' ||
    viewState.kind === 'import-result' ||
    viewState.kind === 'import-clean' ||
    viewState.kind === 'applying' ||
    viewState.kind === 'apply-failed' ||
    viewState.kind === 'apply-success';

  const showDataset =
    Boolean(datasetFile) &&
    (viewState.kind === 'dataset-active' ||
      viewState.kind === 'idle' ||
      (viewState.kind === 'structural-error' && viewState.isUpdate) ||
      (viewState.kind === 'upload-failed' && viewState.isUpdate));

  return (
    <div className="plan-workspace-page">
      <PlanContextHeader plan={plan} />

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="mx-auto flex max-w-[680px] flex-col gap-4">
          {showStale ? (
            <StaleDataBanner
              onRefresh={() => {
                setStaleDismissed(true);
                if (planId) port.markStale(planId, false);
                void reload();
              }}
            />
          ) : null}

          {plan.a01Mode === 'working' ? (
            <WorkingVersionBanner onGoToPlanning={goToPlanning} />
          ) : null}
          {plan.a01Mode === 'execution-locked' ? <ExecutionLockedBanner /> : null}
          {plan.a01Mode === 'completed-readonly' ? <CompletedReadonlyBanner /> : null}

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">داده‌های برنامه</h2>
                <A01ModeChip mode={plan.a01Mode} />
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{subtitle}</p>
            </div>
          </div>

          <div className="divider" />

          {showDataset && datasetFile ? (
            <DatasetActivePanel
              importedFile={datasetFile}
              a01Mode={plan.a01Mode}
              onUploadNew={() => setViewState({ kind: 'idle' })}
              onCreateWorkingVersion={
                plan.a01Mode === 'published-readonly'
                  ? () => {
                      void port.createWorkingVersion(plan.id);
                    }
                  : undefined
              }
            />
          ) : null}

          {viewState.kind === 'idle' && canMutate ? (
            <ImportDropzone onFileSelected={onFileSelected} />
          ) : null}

          {viewState.kind === 'dataset-active' && canMutate ? (
            <ImportDropzone onFileSelected={onFileSelected} />
          ) : null}

          {viewState.kind === 'file-selected' ? (
            <SelectedFilePanel
              fileName={viewState.fileName}
              fileSize={viewState.fileSize}
              fileType={viewState.fileType}
              onRemove={backToDataset}
              onUpload={() => {
                if (pendingFile) void startUpload(pendingFile);
              }}
            />
          ) : null}

          {viewState.kind === 'uploading' ? (
            <UploadProgressState progress={viewState.progress} />
          ) : null}

          {viewState.kind === 'upload-failed' ? (
            <UploadFailedState
              fileName={viewState.fileName}
              onRetry={() => {
                if (pendingFile) void startUpload(pendingFile);
              }}
              onSelectAnother={backToDataset}
            />
          ) : null}

          {viewState.kind === 'processing' ? <ProcessingState /> : null}

          {viewState.kind === 'structural-error' ? (
            <StructuralErrorState errorType={viewState.errorType} onRetry={backToDataset} />
          ) : null}

          {viewState.kind === 'import-result' ? (
            <ImportResultSummary
              importedFile={viewState.importedFile}
              summary={
                viewState.importedFile.parseSummary ?? {
                  totalRows: 210,
                  importedCount: 210,
                  locationReviewCount: 23,
                  duplicateOrderIdCount: 3,
                  otherReviewCount: 2,
                }
              }
              onContinueToReview={goToReview}
            />
          ) : null}

          {viewState.kind === 'import-clean' ? (
            <ImportCleanState importedFile={viewState.importedFile} onContinue={goToReview} />
          ) : null}

          {viewState.kind === 'diff-ready' ? (
            <DiffReadyPanel
              fileName={viewState.fileName}
              diff={viewState.diff}
              strategy={viewState.strategy}
              confirmReplace={viewState.confirmReplace}
              onStrategyChange={(strategy) =>
                setViewState({ ...viewState, strategy, confirmReplace: false })
              }
              onApply={(strategy) => void applyStrategy(strategy, viewState.fileName, viewState.diff)}
              onShowReplaceConfirm={() =>
                setViewState({ ...viewState, strategy: 'full-replace', confirmReplace: true })
              }
              onCancelReplace={() =>
                setViewState({ ...viewState, strategy: 'update-preserve', confirmReplace: false })
              }
              onBack={backToDataset}
            />
          ) : null}

          {viewState.kind === 'applying' ? <ApplyingState /> : null}

          {viewState.kind === 'apply-failed' ? (
            <ApplyFailedState
              onRetry={() =>
                void applyStrategy(viewState.strategy, viewState.fileName, viewState.diff)
              }
              onBack={() =>
                setViewState({
                  kind: 'diff-ready',
                  fileName: viewState.fileName,
                  diff: viewState.diff,
                  strategy: viewState.strategy,
                  confirmReplace: false,
                })
              }
            />
          ) : null}

          {viewState.kind === 'apply-success' ? (
            <ApplySuccessState strategy={viewState.strategy} onContinue={goToReview} />
          ) : null}

          {!canMutate && !inDeepFlow && !datasetFile ? (
            <InlineMessage tone="info">این برنامه دیتاست قابل ویرایشی ندارد.</InlineMessage>
          ) : null}
        </div>
      </div>
    </div>
  );
}

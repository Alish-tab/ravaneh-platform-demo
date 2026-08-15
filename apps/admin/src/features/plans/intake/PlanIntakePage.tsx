import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button, InlineMessage } from '@/shared/ui';

import { PlanContextHeader } from '@/features/plans/components/PlanContextHeader';
import { usePlansDataPort } from '@/features/plans/fixture/usePlansFixture';
import { buildParsedImportedFile, statusAfterParse } from '@/features/plans/fixture/plans-fixture';
import { usePlan } from '@/features/plans/hooks/usePlansData';
import { ImportDropzone } from '@/features/plans/intake/components/ImportDropzone';
import {
  CurrentFileSummary,
  ImportCleanState,
  ImportResultSummary,
  ProcessingState,
  ReplaceDatasetConfirm,
  ReplacementUploadFailedState,
  SelectedFilePanel,
  StaleDataBanner,
  StructuralErrorState,
  UploadFailedState,
  UploadProgressState,
} from '@/features/plans/intake/components/IntakePanels';
import {
  deriveInitialIntakeState,
  fixtureParseOutcomeFromFileName,
  fixtureShouldFailUpload,
  fixtureStructuralErrorFromFileName,
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
  const [isReplacing, setIsReplacing] = useState(false);
  const timerRef = useRef<number | null>(null);
  const processTimerRef = useRef<number | null>(null);
  const initializedForId = useRef<string | null>(null);

  const clearTimers = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (processTimerRef.current !== null) {
      window.clearTimeout(processTimerRef.current);
      processTimerRef.current = null;
    }
  };

  useEffect(() => () => clearTimers(), []);

  useEffect(() => {
    if (status !== 'ready' || !plan) return;
    if (initializedForId.current === plan.id) return;
    initializedForId.current = plan.id;
    setViewState(deriveInitialIntakeState(plan));
    setStaleDismissed(false);
  }, [plan, status]);

  const showStale = searchParams.get('stale') === '1' && !staleDismissed;

  const goToReviewHandoff = () => {
    if (planId) navigate(`/plans/${planId}/review`);
  };

  const finishParse = async (fileName: string, replacement: boolean) => {
    if (!plan) return;
    const previousFile = plan.importedFile;
    const structural = fixtureStructuralErrorFromFileName(fileName);
    if (structural) {
      if (replacement && previousFile) {
        // Preserve previous dataset visually — Backend mutation semantics deferred.
        setViewState({ kind: 'replacement-upload-failed', previousFile });
        setIsReplacing(false);
        return;
      }
      await port.updatePlan(plan.id, {
        status: 'intake_failed',
        lastChanged: 'همین الان',
      });
      setViewState({ kind: 'structural-error', errorType: structural });
      setIsReplacing(false);
      return;
    }

    const outcome = fixtureParseOutcomeFromFileName(fileName);
    const importedFile = buildParsedImportedFile({ fileName, outcome });
    await port.updatePlan(plan.id, {
      status: statusAfterParse(outcome),
      currentStage: 'review',
      itemCount: importedFile.rowCount,
      importedFile,
      lastChanged: 'همین الان',
    });
    setIsReplacing(false);
    setViewState(outcome === 'clean' ? { kind: 'import-clean' } : { kind: 'import-result' });
  };

  const startUpload = (file: File, replacement: boolean) => {
    clearTimers();
    setPendingFile(file);

    if (fixtureShouldFailUpload(file.name)) {
      if (replacement && plan?.importedFile) {
        setViewState({
          kind: 'replacement-upload-failed',
          previousFile: plan.importedFile,
        });
      } else {
        setViewState({ kind: 'upload-failed', fileName: file.name, isReplacement: replacement });
      }
      return;
    }

    setViewState({
      kind: 'uploading',
      progress: 0,
      fileName: file.name,
      isReplacement: replacement,
    });
    void port.updatePlan(plan!.id, { status: 'uploading', lastChanged: 'همین الان' });

    let prog = 0;
    timerRef.current = window.setInterval(() => {
      prog += 18 + Math.random() * 12;
      if (prog >= 100) {
        clearTimers();
        setViewState({ kind: 'processing', fileName: file.name, isReplacement: replacement });
        void port.updatePlan(plan!.id, { status: 'process', lastChanged: 'همین الان' });
        processTimerRef.current = window.setTimeout(() => {
          void finishParse(file.name, replacement);
        }, 700);
      } else {
        setViewState({
          kind: 'uploading',
          progress: prog,
          fileName: file.name,
          isReplacement: replacement,
        });
      }
    }, 160);
  };

  const onFileSelected = (file: File) => {
    if (!plan) return;
    if (plan.importedFile?.name === file.name) {
      setViewState({ kind: 'structural-error', errorType: 'duplicate-file' });
      return;
    }
    setPendingFile(file);
    setViewState({
      kind: 'file-selected',
      fileName: file.name,
      fileSize: formatFileSizeLabel(file.size),
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

  const mockImported =
    plan.importedFile ??
    buildParsedImportedFile({
      fileName: 'orders_demo.xlsx',
      outcome: viewState.kind === 'import-clean' ? 'clean' : 'needs_review',
    });

  return (
    <div className="plan-workspace-page">
      <PlanContextHeader
        plan={plan}
        activeStage="intake"
        onStageChange={(stage) => {
          if (stage === 'review') goToReviewHandoff();
          if (stage === 'planning') navigate('/planning');
          /* Execution and the current Intake stage remain in this workspace. */
        }}
      />

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="mx-auto flex max-w-[680px] flex-col gap-4">
          {showStale ? (
            <StaleDataBanner
              onRefresh={() => {
                setStaleDismissed(true);
                void reload();
              }}
            />
          ) : null}

          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">ورود داده</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              فایل اکسل داده‌های تحویل را بارگذاری کنید
            </p>
          </div>

          <div className="divider" />

          {viewState.kind === 'idle' ? <ImportDropzone onFileSelected={onFileSelected} /> : null}

          {viewState.kind === 'file-selected' ? (
            <SelectedFilePanel
              fileName={viewState.fileName}
              fileSize={viewState.fileSize}
              onRemove={() => {
                setPendingFile(null);
                setViewState({ kind: 'idle' });
              }}
              onUpload={() => {
                if (pendingFile) startUpload(pendingFile, isReplacing);
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
                if (pendingFile) startUpload(pendingFile, viewState.isReplacement);
              }}
              onSelectAnother={() => {
                setPendingFile(null);
                if (viewState.isReplacement && plan.importedFile) {
                  setViewState({
                    kind: 'replacement-upload-failed',
                    previousFile: plan.importedFile,
                  });
                } else {
                  setViewState({ kind: 'idle' });
                }
              }}
            />
          ) : null}

          {viewState.kind === 'processing' ? <ProcessingState /> : null}

          {viewState.kind === 'structural-error' ? (
            <>
              <StructuralErrorState
                errorType={viewState.errorType}
                onRetry={() => setViewState({ kind: 'idle' })}
              />
              {plan.importedFile ? (
                <CurrentFileSummary
                  importedFile={plan.importedFile}
                  downstreamRisk="none"
                  onReplace={() => setViewState({ kind: 'idle' })}
                />
              ) : null}
            </>
          ) : null}

          {viewState.kind === 'import-result' ? (
            <ImportResultSummary
              importedFile={mockImported}
              summary={
                mockImported.parseSummary ?? {
                  totalRows: 210,
                  importedCount: 210,
                  locationReviewCount: 23,
                  duplicateOrderIdCount: 3,
                  otherReviewCount: 2,
                }
              }
              onContinueToReview={goToReviewHandoff}
            />
          ) : null}

          {viewState.kind === 'import-clean' ? (
            <ImportCleanState importedFile={mockImported} onContinue={goToReviewHandoff} />
          ) : null}

          {viewState.kind === 'has-file' && plan.importedFile ? (
            <CurrentFileSummary
              importedFile={plan.importedFile}
              downstreamRisk={viewState.downstreamRisk}
              onReplace={() =>
                setViewState({
                  kind: 'replace-confirm',
                  downstreamRisk: viewState.downstreamRisk,
                })
              }
            />
          ) : null}

          {viewState.kind === 'replace-confirm' ? (
            <>
              {plan.importedFile ? (
                <CurrentFileSummary
                  importedFile={plan.importedFile}
                  downstreamRisk={viewState.downstreamRisk}
                  onReplace={() => undefined}
                />
              ) : null}
              <ReplaceDatasetConfirm
                downstreamRisk={viewState.downstreamRisk}
                onCancel={() =>
                  setViewState({
                    kind: 'has-file',
                    downstreamRisk: viewState.downstreamRisk,
                  })
                }
                onConfirm={() => {
                  /**
                   * Fixture UI: enter replacement selection without destroying previous file yet.
                   * Successful parse replaces the dataset. Upload/parse failure keeps previous file.
                   * Final Backend mutation semantics remain deferred to OpenAPI.
                   */
                  setIsReplacing(true);
                  setPendingFile(null);
                  setViewState({ kind: 'idle' });
                }}
              />
            </>
          ) : null}

          {viewState.kind === 'replacement-upload-failed' ? (
            <ReplacementUploadFailedState
              previousFile={viewState.previousFile}
              onRetry={() => {
                if (pendingFile) startUpload(pendingFile, true);
              }}
              onSelectAnother={() => {
                setIsReplacing(true);
                setViewState({ kind: 'idle' });
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

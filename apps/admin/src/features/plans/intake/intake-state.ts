import type {
  A01ImportedFile,
  A01PlanViewModel,
  A01StructuralErrorKind,
  DatasetDiffViewModel,
  MergeStrategy,
} from '@/features/plans/a01-types';

/**
 * Intake UI state machine (local presentation state).
 * Not a domain/API contract.
 */
export type IntakeViewState =
  | { kind: 'idle' }
  | { kind: 'file-selected'; fileName: string; fileSize: string; fileType: string }
  | { kind: 'uploading'; progress: number; fileName: string; isUpdate: boolean }
  | { kind: 'upload-failed'; fileName: string; isUpdate: boolean }
  | { kind: 'processing'; fileName: string; isUpdate: boolean }
  | { kind: 'structural-error'; errorType: A01StructuralErrorKind; isUpdate: boolean }
  | { kind: 'import-result'; importedFile: A01ImportedFile }
  | { kind: 'import-clean'; importedFile: A01ImportedFile }
  | { kind: 'dataset-active' }
  | {
      kind: 'diff-ready';
      fileName: string;
      diff: DatasetDiffViewModel;
      strategy: MergeStrategy | null;
      confirmReplace: boolean;
    }
  | {
      kind: 'applying';
      strategy: MergeStrategy;
      fileName: string;
      diff: DatasetDiffViewModel;
    }
  | {
      kind: 'apply-failed';
      strategy: MergeStrategy;
      fileName: string;
      diff: DatasetDiffViewModel;
    }
  | { kind: 'apply-success'; strategy: MergeStrategy };

export function hasWorkingDataset(plan: Pick<A01PlanViewModel, 'importBatches' | 'importedFile' | 'itemCount'>): boolean {
  if (plan.importBatches.some((batch) => batch.result === 'clean' || batch.result === 'needs_review')) {
    return true;
  }
  return Boolean(plan.importedFile && (plan.itemCount !== undefined || plan.importedFile.rowCount > 0));
}

export function deriveInitialIntakeState(plan: A01PlanViewModel): IntakeViewState {
  if (plan.status === 'intake_failed' && !hasWorkingDataset(plan)) {
    return { kind: 'structural-error', errorType: 'empty', isUpdate: false };
  }
  if (hasWorkingDataset(plan)) return { kind: 'dataset-active' };
  return { kind: 'idle' };
}

export function fileTypeFromName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toUpperCase();
  return ext || 'XLSX';
}

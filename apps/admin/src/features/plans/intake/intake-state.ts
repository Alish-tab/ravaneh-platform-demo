import type { A01DownstreamRisk, A01ImportedFile, A01StructuralErrorKind } from '@/features/plans/a01-types';

/**
 * A01 Intake UI state machine (local presentation state).
 * Not a domain/API contract.
 */
export type IntakeViewState =
  | { kind: 'idle' }
  | { kind: 'file-selected'; fileName: string; fileSize: string }
  | { kind: 'uploading'; progress: number; fileName: string; isReplacement: boolean }
  | { kind: 'upload-failed'; fileName: string; isReplacement: boolean }
  | { kind: 'processing'; fileName: string; isReplacement: boolean }
  | { kind: 'structural-error'; errorType: A01StructuralErrorKind }
  | { kind: 'import-result' }
  | { kind: 'import-clean' }
  | { kind: 'has-file'; downstreamRisk: A01DownstreamRisk }
  | { kind: 'replace-confirm'; downstreamRisk: A01DownstreamRisk }
  | { kind: 'replacement-upload-failed'; previousFile: A01ImportedFile };

export function deriveInitialIntakeState(plan: {
  status: string;
  currentStage: string;
  importedFile?: A01ImportedFile;
}): IntakeViewState {
  if (plan.status === 'draft' && !plan.importedFile) return { kind: 'idle' };
  if (plan.status === 'uploading') {
    return {
      kind: 'uploading',
      progress: 45,
      fileName: plan.importedFile?.name ?? 'upload.xlsx',
      isReplacement: false,
    };
  }
  if (plan.status === 'process') {
    return {
      kind: 'processing',
      fileName: plan.importedFile?.name ?? 'upload.xlsx',
      isReplacement: false,
    };
  }
  if (plan.status === 'intake_failed') {
    return { kind: 'structural-error', errorType: 'empty' };
  }
  if (plan.importedFile) {
    if (plan.importedFile.parseOutcome === 'clean' && plan.currentStage === 'review') {
      return { kind: 'import-clean' };
    }
    if (plan.currentStage === 'review' || plan.importedFile.parseOutcome === 'needs_review') {
      if (plan.currentStage === 'review') return { kind: 'import-result' };
    }
    const risk: A01DownstreamRisk =
      plan.currentStage === 'planning'
        ? 'planning'
        : plan.currentStage === 'execution'
          ? 'published'
          : 'none';
    if (plan.currentStage === 'review') return { kind: 'import-result' };
    return { kind: 'has-file', downstreamRisk: risk };
  }
  return { kind: 'idle' };
}

/** Fixture heuristic for demo outcomes — not Backend validation. */
export function fixtureParseOutcomeFromFileName(fileName: string): 'clean' | 'needs_review' {
  return /clean/i.test(fileName) ? 'clean' : 'needs_review';
}

export function fixtureShouldFailUpload(fileName: string): boolean {
  return /fail-upload/i.test(fileName);
}

export function fixtureStructuralErrorFromFileName(
  fileName: string,
): A01StructuralErrorKind | null {
  if (/unreadable/i.test(fileName)) return 'unreadable';
  if (/empty-file/i.test(fileName)) return 'empty';
  if (/missing-col/i.test(fileName)) return 'missing-columns';
  if (/dup-file/i.test(fileName)) return 'duplicate-file';
  return null;
}

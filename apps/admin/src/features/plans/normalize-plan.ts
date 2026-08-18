/**
 * Fixture-local normalization for incomplete test seeds.
 * Does not invent Backend defaults.
 */
import type {
  A01ImportedFile,
  A01PlanViewModel,
  ImportBatchViewModel,
  PlanA01Mode,
  PlanLifecycle,
} from '@/features/plans/a01-types';
import { toServiceDateSortKey } from '@/features/plans/plan-name';

function batchFromImportedFile(file: A01ImportedFile): ImportBatchViewModel {
  const result =
    file.parseOutcome === 'clean'
      ? 'clean'
      : file.parseOutcome === 'needs_review'
        ? 'needs_review'
        : file.rowCount > 0
          ? 'needs_review'
          : 'structural_failed';
  return {
    id: `batch-${file.name}`,
    filename: file.name,
    uploadedAt: file.uploadedAt,
    rowCount: file.rowCount,
    result,
    parseSummary: file.parseSummary,
  };
}

function importedFileFromBatches(batches: ImportBatchViewModel[]): A01ImportedFile | undefined {
  const latest = [...batches].reverse().find((batch) => batch.result === 'clean' || batch.result === 'needs_review');
  if (!latest) return undefined;
  return {
    name: latest.filename,
    uploadedAt: latest.uploadedAt,
    rowCount: latest.rowCount,
    parseSummary: latest.parseSummary,
    parseOutcome: latest.result === 'clean' ? 'clean' : 'needs_review',
  };
}

export type PlanFixtureSeed = Partial<A01PlanViewModel> &
  Pick<A01PlanViewModel, 'id' | 'name' | 'deliveryDate'>;

export function normalizePlanViewModel(seed: PlanFixtureSeed): A01PlanViewModel {
  const importBatches =
    seed.importBatches ?? (seed.importedFile ? [batchFromImportedFile(seed.importedFile)] : []);
  const importedFile = seed.importedFile ?? importedFileFromBatches(importBatches);

  const lifecycle: PlanLifecycle = seed.lifecycle ?? 'draft';
  const a01Mode: PlanA01Mode = seed.a01Mode ?? 'editable';
  const needsAttention = seed.needsAttention ?? null;
  const suggestedSection = seed.suggestedSection ?? 'intake';

  return {
    id: seed.id,
    name: seed.name,
    deliveryDate: seed.deliveryDate,
    window: seed.window,
    serviceDateSortKey: seed.serviceDateSortKey ?? toServiceDateSortKey(seed.deliveryDate),
    lastChanged: seed.lastChanged ?? 'همین الان',
    itemCount: seed.itemCount,
    lifecycle,
    needsAttention,
    attentionActionLabel: seed.attentionActionLabel,
    isPreparing: seed.isPreparing ?? Boolean(needsAttention),
    suggestedSection,
    canEditMetadata: seed.canEditMetadata ?? true,
    canDeleteDraft: seed.canDeleteDraft ?? false,
    canMutateDataset:
      seed.canMutateDataset ?? (a01Mode === 'editable' || a01Mode === 'working'),
    hasWorkingVersion: seed.hasWorkingVersion ?? a01Mode === 'working',
    a01Mode,
    importBatches,
    publishedSnapshot: seed.publishedSnapshot,
    currentStage: seed.currentStage ?? suggestedSection,
    status: seed.status ?? 'draft',
    importedFile,
  };
}

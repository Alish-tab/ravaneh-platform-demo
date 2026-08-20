import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MapToolbar } from '@/shared/map/MapToolbar';

describe('shared MapToolbar interaction', () => {
  it('invokes the selected-area action without bubbling to map deselection', () => {
    const clearSelection = vi.fn();
    const onFitSelected = vi.fn();

    render(
      <div onClick={clearSelection}>
        <MapToolbar
          onZoomIn={vi.fn()}
          onZoomOut={vi.fn()}
          onFitAll={vi.fn()}
          onFitSelected={onFitSelected}
          onToggleAreas={vi.fn()}
          hasSelection
          showAreas
        />
        <div data-testid="real-empty-map" />
      </div>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'مرکز کردن محدوده انتخاب‌شده' }));

    expect(onFitSelected).toHaveBeenCalledOnce();
    expect(clearSelection).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('real-empty-map'));
    expect(clearSelection).toHaveBeenCalledTimes(1);
  });
});

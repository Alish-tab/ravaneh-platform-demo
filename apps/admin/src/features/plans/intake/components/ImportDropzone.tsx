import { useRef, useState } from 'react';

import { LtrData } from '@/shared/ui';

import { Icon, ICONS } from '@/features/plans/components/icons';

type ImportDropzoneProps = {
  onFileSelected: (file: File) => void;
};

export function ImportDropzone({ onFileSelected }: ImportDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    onFileSelected(file);
  };

  return (
    <div
      className={['file-drop', dragOver ? 'dragover' : ''].filter(Boolean).join(' ')}
      role="button"
      tabIndex={0}
      aria-label="انتخاب فایل اکسل"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        handleFile(event.dataTransfer.files[0]);
      }}
    >
      <div className={['intake-drop-icon', dragOver ? 'active' : ''].filter(Boolean).join(' ')}>
        <Icon d={ICONS.upload} size={18} />
      </div>
      <div className="text-center">
        <div className="text-[13px] font-medium text-[var(--text-primary)]">
          فایل اکسل را اینجا رها کنید
        </div>
        <div className="mt-1 text-xs text-[var(--text-secondary)]">
          یا کلیک کنید تا فایل انتخاب شود
        </div>
      </div>
      <LtrData className="intake-extension-chip">.xlsx</LtrData>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
}

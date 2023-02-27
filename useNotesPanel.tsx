import React, { useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/interactive-supports-focus */
import Button from 'pp-ui/v2/basic/buttons/Button';
import type { Reference, ReferencePanel } from '../types';

export type NoteInputRef = { setEditing(value: boolean): void; getElement: () => HTMLDivElement | null } | undefined;

export const useNotesPanel = (
  notesPanelActive: boolean,
  reference: Reference,
  showBottomMargin: boolean | undefined,
  onMouseEvent: React.MouseEventHandler | undefined,
  onNoteInput: (() => void) | undefined,
  onSaveNote: (() => void) | undefined,
  isEditAllowed: boolean,
  toggleBottomPanel: ({
    panel,
    origin,
  }: {
    panel: ReferencePanel;
    origin: 'grid' | 'keyboard-shortcut';
  }) => void | undefined,
  notesInputRef?: React.MutableRefObject<NoteInputRef>
) => {
  const { t } = useTranslation('grid');
  const [editingNote, setEditingNote] = useState(!reference.note);
  const inputRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(notesInputRef, () => ({
    setEditing: value => setEditingNote(value),
    getElement: () => inputRef.current,
  }));

  const handleNoteSave = () => {
    setEditingNote(false);
    onSaveNote?.();
  };

  if (!notesPanelActive) return null;

  return (
    <div
      className={
        showBottomMargin
          ? ['gridReference_bottomPanel', '-bottom-margin'].join(' ')
          : 'gridReference_bottomPanel -arrow  -notes'
      }
      onMouseMove={onMouseEvent}
      onMouseEnter={onMouseEvent}
    >
      <div
        role="textbox"
        className={`referenceNotes ${isEditAllowed ? '' : '-disabled'} ${!editingNote ? '' : '-active'}`}
        contentEditable={!!onNoteInput && isEditAllowed}
        ref={inputRef}
        onInput={onNoteInput}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: reference.note || '' }}
        onClick={() => {
          if (!editingNote) setEditingNote(true);
        }}
      />
      {isEditAllowed && onSaveNote && (
        <>
          {!editingNote && <div className="referenceNotes_hint">{t('referenceNotes.hintText')}</div>}
          {editingNote && (
            <div className="referenceNotes_actions">
              <Button
                styleName="neutral-1"
                size="large"
                label={t('referenceNotes.close')}
                onClick={() => {
                  setEditingNote(false);
                  toggleBottomPanel({ panel: 'notes', origin: 'grid' });
                }}
              />
              <Button styleName="primary-1" size="large" label={t('referenceNotes.save')} onClick={handleNoteSave} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

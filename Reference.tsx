/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable no-underscore-dangle */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReferenceComponent from 'pp-ui/v2/basic/misc/reference/Reference';
import Icon from 'pp-ui/v2/fundamentals/icons/Icon';
import Tooltip from 'pp-ui/v2/basic/misc/Tooltip';
import DotSeparator from 'pp-ui/v2/basic/layout/DotSeparator';
import { HighlightedFields } from 'pp-shared/src/library/ReferenceDL';
import { DraggableItem } from 'pp-ui/ts/webapp';
import { renderReferenceData } from 'pp-ui/v2/basic/misc/reference/helpers';

import EventsHub from '../../ComponentEvents/EventsHub';
import {
  addOpenReferencePanels,
  addOpenReferenceDetails,
  removeOpenReferencePanels,
  removeOpenReferenceDetails,
} from '../helpers';
import {
  Attachment,
  ReferenceDragItem,
  Reference as ReferenceType,
  PermissionAccessLevel,
  ReferencePanel,
} from '../types';

import { renderReferenceFieldsAndValues } from './renderers';
import { RestrictableReferenceActions } from '../../Permissions/types';
import { NoteInputRef, useNotesPanel } from './useNotesPanel';

const DRAG_ACCEPT = ['REFERENCE'];

type Props = {
  active?: boolean;
  externalDisableDrag: boolean;
  allowedActions?: RestrictableReferenceActions[];
  permissionLevel?: PermissionAccessLevel;
  externalOpenPanel?: ReferencePanel;
  externalOpenDetails?: boolean;
  privateActions?: string[];
  proxylist?: string;
  readOnlyNotes?: boolean;
  library?: string;

  IncompleteMenuComponent?: JSX.Element | null;
  FoldersComponent?: JSX.Element | null;
  LabelsComponent?: JSX.Element | null;
  LinkComponent?: JSX.Element | JSX.Element[] | null;
  ProfileComponent?: JSX.Element | null;
  highlightedFields?: HighlightedFields;
  hasSnippets?: boolean;

  hideStar?: boolean;

  itemDropRef?: React.RefObject<HTMLDivElement>;
  notesInputRef?: React.MutableRefObject<NoteInputRef>;
  onMouseEvent?: React.MouseEventHandler;
  onNoteInput?: () => void;
  onSaveNote?: () => void;
  onView?: () => void;
  onSelectReference?: () => void;
  onSelectReferenceFromDrag?: () => void;
  onSizeChange?: () => void;
  onToggleBottomPanel?: (panel: ReferencePanel, origin: 'grid' | 'keyboard-shortcut') => void;
  onToggleDetails?: () => void;
  onToggleStar?: () => void;

  reference: ReferenceType;
  renderAttachment: (attachment: Attachment, isLastAttachment: boolean) => JSX.Element;
  renderAttachmentFooter?: () => JSX.Element | null;
  renderExtraButtons: () => JSX.Element;
  renderHandle: () => JSX.Element;
  renderProfiles?: () => JSX.Element | null;
  renderSnippet?: (
    openPanel: (panel: ReferencePanel) => void,
    onMouseEvent?: React.MouseEventHandler<HTMLDivElement>
  ) => JSX.Element | null;
  renderTopRight?: () => JSX.Element;

  showBottomMargin?: boolean;
};

const Reference: React.FC<Props> = ({
  active,
  hideStar,
  allowedActions = [],
  externalOpenPanel,
  externalOpenDetails,
  proxylist,
  privateActions,
  readOnlyNotes,
  library,
  hasSnippets,
  IncompleteMenuComponent,
  FoldersComponent,
  LabelsComponent,
  LinkComponent,
  ProfileComponent,
  highlightedFields,
  itemDropRef,
  notesInputRef,
  onMouseEvent,
  onNoteInput,
  onView,
  onSaveNote,
  onSelectReference,
  onSelectReferenceFromDrag,
  onSizeChange,
  onToggleBottomPanel,
  onToggleDetails,
  onToggleStar,
  reference,
  renderAttachment,
  renderAttachmentFooter,
  renderExtraButtons,
  renderHandle,
  renderSnippet,
  renderTopRight,

  externalDisableDrag,

  showBottomMargin,
}) => {
  const { t } = useTranslation('grid');

  const [dragDisabled, setDragDisabled] = useState(false);
  const stopEventPropagation: React.MouseEventHandler = useCallback(e => {
    e.stopPropagation();
  }, []);

  const [panelOpen, setPanelOpen] = useState<ReferencePanel | undefined>(externalOpenPanel);
  const [detailsExpanded, setDetailsExpanded] = useState<boolean>(!!externalOpenDetails);

  const toggleBottomPanel = ({ panel, origin }: { panel: ReferencePanel; origin: 'grid' | 'keyboard-shortcut' }) => {
    setPanelOpen(previousValue => {
      const open = previousValue !== panel ? panel : undefined;
      if (open === 'abstract' && !reference.abstract) return previousValue;
      if (open) {
        addOpenReferencePanels(reference._id, panel);
      } else {
        if (hasSnippets) {
          addOpenReferencePanels(reference._id, 'snippet');
          return 'snippet';
        }
        removeOpenReferencePanels(reference._id);
      }
      return open;
    });

    onToggleBottomPanel?.(panel, origin);
  };

  const NotesPanel = useNotesPanel(
    panelOpen === 'notes',
    reference,
    showBottomMargin,
    onMouseEvent,
    onNoteInput,
    onSaveNote,
    allowedActions.includes('editNotes'),
    toggleBottomPanel,
    notesInputRef
  );

  const toggleDetails = () => {
    setDetailsExpanded(previousValue => {
      if (previousValue) removeOpenReferenceDetails(reference._id);
      else addOpenReferenceDetails(reference._id);
      return !previousValue;
    });
  };

  useEffect(() => {
    onSizeChange?.();
  }, [panelOpen, detailsExpanded]);

  useEffect(() => {
    EventsHub.on(`reference:toggleDetails:${reference._id}`, toggleDetails);
    EventsHub.on<Parameters<typeof toggleBottomPanel>[0]>(`reference:togglePanel:${reference._id}`, toggleBottomPanel);

    return () => {
      EventsHub.off<Parameters<typeof toggleBottomPanel>[0]>(
        `reference:togglePanel:${reference._id}`,
        toggleBottomPanel
      );
      EventsHub.off(`reference:toggleDetails:${reference._id}`, toggleDetails);
    };
  }, [reference._id, reference.abstract]);

  const dragItem: ReferenceDragItem = useMemo(
    () => ({
      reference,
      type: 'REFERENCE',
      index: reference._id,
      id: reference._id,
      sourceLibraryId: library || 'personal',
    }),
    [reference]
  );

  const wrapperClasses = showBottomMargin && !panelOpen ? ['gridReference', '-bottom-margin'] : ['gridReference'];
  const contentPanelClasses = ['gridReference_contentPanel'];

  if (active) {
    wrapperClasses.push('-active');
    contentPanelClasses.push('-active');
  }

  if (detailsExpanded) {
    contentPanelClasses.push('-details-expanded');
  }

  return (
    <>
      <div
        data-testid="reference"
        ref={itemDropRef}
        className={wrapperClasses.join(' ')}
        onMouseMove={onMouseEvent}
        onMouseEnter={onMouseEvent}
      >
        <DraggableItem<ReferenceDragItem>
          dragItem={dragItem}
          accept={DRAG_ACCEPT}
          selfDropDisabled
          onDragStart={onSelectReferenceFromDrag}
          key={reference._id}
          disableDrag={dragDisabled || externalDisableDrag}
        >
          <div className={contentPanelClasses.join(' ')} role="button" onClick={onSelectReference}>
            {renderHandle()}
            <ReferenceComponent
              size="large"
              layout={hideStar ? 'default' : 'title-icons'}
              reference={reference}
              onToggleStar={onToggleStar}
              onDetailsClick={() => {
                toggleDetails();
                onToggleDetails?.();
              }}
              highlightedFields={highlightedFields}
              useClickableData={{
                year: true,
                author: true,
                journal: !!reference.journal || !!reference.journalfull || !!reference.publisher,
              }}
              onDataClick={(type, value) => EventsHub.emit('search:addFilter', { filterType: type, value })}
              TitleEndComponents={
                <>
                  {LabelsComponent}
                  {IncompleteMenuComponent}
                </>
              }
              TopRightComponents={renderTopRight?.()}
              onTitleClick={() => toggleBottomPanel({ panel: 'abstract', origin: 'grid' })}
              onTitleDblClick={() => onView?.()}
            />
            {detailsExpanded && (
              <div className="gridReference_contentPanel_details">
                {renderReferenceFieldsAndValues(reference, true, ['title', 'note', 'abstract', 'kind'], proxylist, {
                  enter: e => {
                    e.stopPropagation();
                    setDragDisabled(true);
                  },
                  leave: e => {
                    e.stopPropagation();
                    setDragDisabled(false);
                  },
                })}
              </div>
            )}
            <div className="gridReference_contentPanel_toolbar">
              <div
                role="button"
                className="gridReference_contentPanel_toolbar_iconButtons"
                onClick={stopEventPropagation}
                onMouseDown={stopEventPropagation}
              >
                <button
                  type="button"
                  onClick={() => toggleBottomPanel({ panel: 'abstract', origin: 'grid' })}
                  className="gridReference_button"
                  disabled={!reference.abstract}
                >
                  <Icon name="square-lines-custom" size={20} />
                </button>
                <button
                  className={`gridReference_button${
                    reference.attachments && reference.attachments.length > 0 ? ' -with-badge' : ''
                  }`}
                  type="button"
                  data-badge={reference.attachments?.length}
                  onClick={() => toggleBottomPanel({ panel: 'attachments', origin: 'grid' })}
                >
                  <Icon name="paperclip-vertical-line" size={20} />
                </button>
                <Tooltip
                  text={t('referenceNotes.privateNotesTooltipText')}
                  placement="bottom"
                  disabled={!privateActions || !privateActions.includes('notes')}
                >
                  <button
                    className={`gridReference_button ${!reference.note ? 'grayed' : ''}`}
                    type="button"
                    data-badge={reference.note?.length}
                    disabled={
                      (readOnlyNotes && !reference.note) || (privateActions && privateActions.includes('notes'))
                    }
                    onClick={() => toggleBottomPanel({ panel: 'notes', origin: 'grid' })}
                  >
                    <Icon name="comment-dots-line" size={20} />
                  </button>
                </Tooltip>
              </div>
              <div className="gridReference_contentPanel_toolbar_profileWrapper">
                {(ProfileComponent || FoldersComponent) && <DotSeparator className="referenceSeparator" />}
                {ProfileComponent}
              </div>
              <div className="gridReference_contentPanel_toolbar_folders">{FoldersComponent}</div>
              <div className="gridReference_contentPanel_toolbar_links">{LinkComponent}</div>
              {renderExtraButtons()}
            </div>
          </div>
        </DraggableItem>
      </div>
      {panelOpen === 'abstract' && (
        <div
          className={
            showBottomMargin
              ? ['gridReference_bottomPanel', '-bottom-margin'].join(' ')
              : 'gridReference_bottomPanel -arrow  -abstract'
          }
          onMouseMove={onMouseEvent}
          onMouseEnter={onMouseEvent}
        >
          {highlightedFields?.abstract
            ? renderReferenceData(highlightedFields.abstract, { field: 'other' })
            : reference.abstract}
        </div>
      )}
      {panelOpen === 'notes' && (!privateActions || !privateActions.includes('notes')) && NotesPanel}
      {panelOpen === 'attachments' && (
        <div
          className={
            showBottomMargin
              ? ['gridReference_bottomPanel', '-bottom-margin', 'referenceAttachments'].join(' ')
              : 'gridReference_bottomPanel -arrow -attachments referenceAttachments'
          }
          onMouseMove={onMouseEvent}
          onMouseEnter={onMouseEvent}
        >
          {reference.attachments?.length ? (
            // @ts-ignore
            [...reference.attachments]
              .sort((a: Attachment, b: Attachment) => (a.filename || '').localeCompare(b.filename || ''))
              .map((attachment, index) =>
                renderAttachment(attachment, index === (reference.attachments?.length || 1) - 1)
              )
          ) : (
            <span className="referenceAttachments_message">{t('referenceAttachments.noAttachedFiles')}</span>
          )}
          {renderAttachmentFooter?.()}
        </div>
      )}
      {panelOpen === 'snippet' && renderSnippet?.(panel => toggleBottomPanel({ panel, origin: 'grid' }), onMouseEvent)}
    </>
  );
};

export default React.memo(Reference);

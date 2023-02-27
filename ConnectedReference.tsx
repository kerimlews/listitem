/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable no-underscore-dangle */
import { connect, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSelector } from '@reduxjs/toolkit';
import { AttachmentRenameDialogProps, ReactDnDTypes, clipboardUtils, useItemDrop } from 'pp-ui/ts/webapp';
import Tooltip from 'pp-ui/v2/basic/misc/Tooltip';
import Loader from 'pp-ui/v2/basic/misc/Spinner';
import Icon from 'pp-ui/v2/fundamentals/icons/Icon';
import DotSeparator from 'pp-ui/v2/basic/layout/DotSeparator';
import Separator from 'pp-ui/v2/basic/layout/Separator';
import Button from 'pp-ui/v2/basic/buttons/Button';
import Link from 'pp-ui/v2/basic/buttons/Link';
import { getCitedByLink } from 'pp-shared/src/library/Publication';

import { strings } from 'pp-shared/webapp';
import type { DataLayerTypes, types } from 'pp-shared/types';
import type { RootState } from '../../rootReducer';
import './referenceStyles.scss';
import { ActiveGridReference, Attachment, Reference as ReferenceType } from '../types';
import { Collection } from '../../TreePanel/types';
import { pdfProgressAction } from '../../Sync/slice';

import {
  addReferenceToCollectionAction,
  removeAttachmentThunkAction,
  removeFromCollectionThunkAction,
  setActiveReferenceAction,
  setAttachmentAsMainThunkAction,
  toggleSelectedReferenceThunkAction,
  updateAttachmentThunkAction,
  updateReferencesThunkAction,
  createAttachmentThunkAction,
  removeFromFolderAction,
} from '../slice';
import ReferenceMenu from './ReferenceMenu';

import { hasMainPdf, getMainPdf, couldBePdf } from '../commonHelpers';
import {
  cloneReference,
  openAttachmentFile,
  getAttachmentDisplayName,
  getAuthorAndYear,
  getReferenceMissingFields,
  getWebsiteLink,
  isDraggingOverReference,
  setDraggingOverReference,
  getOpenReferencePanels,
  getOpenReferenceDetails,
  getLinksForReference,
} from '../helpers';
import { downloadAttachmentFile } from '../fileHelpers';
import {
  openDialogAction,
  openAutoUpdateDialogAction,
  openDeletePermanentlyConfirmationDialogAction,
  openEditDialogAction,
  openRemoveAttachmentConfirmationDialogAction,
} from '../../ModalContainer/slice';
import type { Notification } from '../../Notifications/types';
import {
  showExtensionFeatureOnlyNotificationAction,
  showNotificationAction,
  showOfflineNotificationAction,
} from '../../Notifications/slice';
import { GoogleDriveConfig } from '../../Settings/types';
import IncompleteMenu from './IncompleteMenu';
import PdfMenu from './PdfMenu';
import Reference from './Reference';
import EventsHub from '../../ComponentEvents/EventsHub';
import { useFileUpload } from '../../hooks/useFileUpload';
import ReferenceExtraButtons from './ReferenceExtraButtons';
import { duplicateReferenceThunkAction, markReferenceAsNotDuplicateAction } from '../actions/duplicatesActions';
import { getSelectedReferenceCount } from '../selectors';
import mixpanel from '../../mixpanel';
import { panelToMixpanelType } from '../../mixpanel/events';
import { hasProxyActive } from '../../Settings/slice';
import useAllowedActions from '../../Permissions/useAllowedActions';
import ReferenceCopyStatus from './ReferenceCopyStatus';
import { toggleTrashSelectedReferencesThunkAction } from '../actions/trashActions';
import {
  browsePDFAction,
  browseSupplementaryFilesAction,
  downloadPDFAction,
  searchGoogleForPDFAction,
} from '../actions/crawlActions';
import SearchService from '../../Search/SearchService';
import Snippet from './Snippet';
import { dropReferenceOnDifferentLibraryAction } from '../../TreePanel/action/dragActions';
import { useCollectionListComponent, useProfileComponent } from './hooks';
import { openLinkAction, openWebLinkAction } from '../../Shortcuts/actions';
import { convertFilterStateToUrl, getNameForURL } from '../../URL/convertUrlToFilterState';
import { gridHelpers } from '../../helpers';
import { NoteInputRef } from './useNotesPanel';
import { goToUrl } from '../../App/helpers';

let mousePosition = { x: 0, y: 0 };

type OwnProps = {
  index: number;
  onScrollToElement?: (index: number) => void;
  onSizeChange?: (index: number) => void;
  showBottomMargin?: boolean;
};

type StateProps = {
  active: boolean;
  activeReferenceSource?: 'keyboard' | 'mouse';
  isOffline: boolean;
  isTrashed: boolean;
  gdriveConfig: GoogleDriveConfig;
  externalOpenPanel?: 'abstract' | 'notes' | 'attachments' | 'snippet';
  externalOpenDetails?: boolean;
  reference: ReferenceType;
  selected: boolean;
  preferedViewer: NonNullable<types.User['pubview_preferredViewer']>;
  pdfDownloadStatus?: DataLayerTypes.Sync.PdfDownloadProgress;
  isProxyActive: boolean;
  proxylist?: string;
  userId?: string;
};

type DispatchProps = {
  addToCollection: (
    collection: Collection,
    reference: ReferenceType,
    draggingOverRange: boolean,
    libraryId: string
  ) => void;
  addToCollectionForDifferentLibrary: (
    reference: ReferenceType,
    libraryId: string,
    sourceLibraryId: string,
    collection: Collection
  ) => void;
  browsePDF: (reference: ReferenceType) => void;
  browseSupplementaryFiles: (reference: ReferenceType) => void;
  deletePermanently: (reference: ReferenceType) => void;
  downloadPDF: (reference: ReferenceType) => void;
  duplicateReference: (reference: ReferenceType, originalReferenceIndex: number, authorAndYear: string) => void;
  markReferenceAsNotDuplicate: (referenceId: string) => void;
  openAttachmentRenameDialog: (
    props: Pick<AttachmentRenameDialogProps, 'attachment' | 'publication'> & { referenceIndex: number }
  ) => void;
  openAutoUpdateDialog: (reference: ReferenceType) => void;
  openEditDialog: (reference: ReferenceType) => void;
  openRemoveAttachmentConfirmationDialog: (
    authorAndYear: string,
    referenceIndex: number,
    attachment: Attachment
  ) => void;
  openShareDialog: (id: string) => void;
  openWebLink: (id: string) => void;
  openLink: (url: string) => void;
  removeFromCollection: (collection: Collection, reference: ReferenceType, libraryId: string) => void;
  removeFromFolder: (referenceId: string, libraryId: string) => void;
  searchGoogleForPDF: (reference: ReferenceType) => void;
  setActiveReference: (value: ActiveGridReference) => void;
  setAttachmentAsMain: (referenceIndex: number, attachmentId: string, attachment: Attachment[]) => void;
  showExtensionFeatureOnlyNotification: () => void;
  showNotification: (notification: Notification) => void;
  showOfflineNotification: () => void;
  toggleTrashReference: (references: ReferenceType, trash: boolean) => void;
  toggleSelectedReference: (id: string, disableUnselect?: boolean, dragging?: boolean) => void;
  updateAttachment: (referenceIndex: number, attachment: Attachment, changes: Partial<Attachment>) => void;
  updateReferences: (reference: ReferenceType, changes: Partial<ReferenceType>, label?: string) => void;
  createAttachment: (attachments: Attachment[], reference: ReferenceType, referenceIndex: number) => void;

  resetPdfDownloadStatus: () => void;
};

type Props = OwnProps & StateProps & DispatchProps;

const ConnectedReference: React.FC<Props> = ({
  active,
  activeReferenceSource,
  addToCollection,
  addToCollectionForDifferentLibrary,
  deletePermanently,
  browsePDF,
  browseSupplementaryFiles,
  downloadPDF,
  duplicateReference,
  externalOpenPanel,
  externalOpenDetails,
  reference,
  selected,
  proxylist,
  isProxyActive,
  userId,
  index,
  isOffline,
  isTrashed,
  gdriveConfig,
  markReferenceAsNotDuplicate,
  openAttachmentRenameDialog,
  openAutoUpdateDialog,
  openEditDialog,
  openWebLink,
  openLink,
  openRemoveAttachmentConfirmationDialog,
  openShareDialog,
  onScrollToElement,
  onSizeChange,
  preferedViewer,
  removeFromFolder,
  removeFromCollection,
  searchGoogleForPDF,
  setActiveReference,
  setAttachmentAsMain,
  showNotification,
  showOfflineNotification,
  showBottomMargin,
  toggleTrashReference,
  toggleSelectedReference,
  updateReferences,
  createAttachment,
  pdfDownloadStatus,
  resetPdfDownloadStatus,
}) => {
  const { t } = useTranslation('grid');
  const allowedActions = useAllowedActions('reference');

  const notesInputRef = useRef<NoteInputRef>();
  const previouslyActive = useRef<boolean>(false);

  const uploadFile = useFileUpload(reference, showNotification, (attachments, ref) =>
    createAttachment(attachments, ref, index)
  );

  const [dragDisabled, setDragDisabled] = useState<boolean>(false);

  const [loaderVisible, setLoaderVisible] = useState<boolean>(false);
  const [attachmentLoaders, setAttachmentLoaders] = useState<Record<string, boolean>>({});

  const selectedReferenceCount = useSelector(getSelectedReferenceCount);
  const activeLibraryOrFolder = useSelector((state: RootState) => state.filters.selectedLibrary);
  const privateActions = useSelector((state: RootState) => {
    const { selectedLibrary } = state.filters;
    if (!selectedLibrary || selectedLibrary.type === 'shared-library') return [];
    const sharingSettings = JSON.parse(selectedLibrary.sharing_settings || '{ "share_annotations": true }');
    if (!sharingSettings.share_annotations) return ['notes'];
    return [];
  });
  const itemDrop = useItemDrop<ReactDnDTypes.DragItem & { collection: Collection; libraryId: string }>(
    ['COLLECTION:FOLDER', 'COLLECTION:LABEL'],
    undefined,
    item => {
      if (
        (item.collection.collectionType === 'folder' && !allowedActions.actions.includes('addEditFolders')) ||
        (item.collection.collectionType === 'label' && !allowedActions.actions.includes('addEditLabels'))
      ) {
        return;
      }

      const activeLibraryId = activeLibraryOrFolder?.id || 'personal';

      if (activeLibraryId !== item.libraryId) {
        addToCollectionForDifferentLibrary(reference, item.libraryId, activeLibraryId, item.collection);
      } else {
        addToCollection(item.collection, reference, selected && isDraggingOverReference(), item.libraryId);
      }
      mixpanel.track({
        name: 'Add to collection',
        type: item.collection.collectionType,
        origin: 'drag-drop',
        amount: selectedReferenceCount || 1,
      });
    }
  );

  useEffect(() => {
    EventsHub.on<{ value: boolean }>('reference:draggingOver', changeHighlight);
    if (itemDrop.isOver) {
      setDraggingOverReference(reference._id, selected);
    } else {
      setDraggingOverReference(reference._id, false);
    }

    return () => EventsHub.off('reference:draggingOver', changeHighlight);
  }, [itemDrop.isOver, selected]);

  useEffect(() => {
    onSizeChange?.(index);
  }, [
    reference.labels,
    reference.folders,
    reference.attachments,
    reference.__render?.title,
    reference.__render?.author,
    reference.__render?.journal,
  ]);

  useEffect(() => {
    if (!previouslyActive.current && active && activeReferenceSource === 'keyboard') {
      onScrollToElement?.(index);
    }
    previouslyActive.current = active;
  }, [active, activeReferenceSource]);

  const changeHighlight = ({ value }: { value: boolean }) => {
    if (
      (itemDrop?.item?.collection?.collectionType === 'folder' && !allowedActions.actions.includes('addEditFolders')) ||
      (itemDrop?.item?.collection?.collectionType === 'label' && !allowedActions.actions.includes('addEditLabels'))
    ) {
      return;
    }
    if (itemDrop.ref.current) {
      if ((value && selected) || itemDrop.isOver) {
        itemDrop.ref.current.classList.add('-draggingOver');
      } else {
        itemDrop.ref.current.classList.remove('-draggingOver');
      }
    }
  };

  const handleSelectReference = useCallback(() => toggleSelectedReference(reference._id, true), [reference, selected]);
  const handleSelectReferenceFromDrag = useCallback(() => toggleSelectedReference(reference._id, true, true), [
    reference,
    selected,
  ]);

  const handleMouseEvent: React.MouseEventHandler = useCallback(
    ({ clientX: x, clientY: y }) => {
      if (!active && (x !== mousePosition.x || y !== mousePosition.y)) {
        setActiveReference({ index, selectionSource: 'mouse' });
      }
      mousePosition = { x, y };
    },
    [index, active]
  );

  const openAttachment = async (
    buttonEl?: HTMLButtonElement,
    setLoaderVisibleCallback?: (state: boolean) => void,
    attachment?: Attachment
  ) => {
    const attachmentToDownload = attachment || getMainPdf(reference);
    if (!attachmentToDownload) {
      showNotification({
        iconLeft: 'check',
        text: `No attachment available`,
      });
      return;
    }

    if (attachmentToDownload.download_status === 'running') {
      showNotification({
        iconLeft: 'warning',
        text: 'Attachment is still downloading.',
      });
      return;
    }

    await openAttachmentFile(
      attachmentToDownload,
      preferedViewer,
      setLoaderVisibleCallback,
      activeLibraryOrFolder?.id,
      buttonEl
    );

    // reset loader
    resetPdfDownloadStatus();
    if (buttonEl) {
      buttonEl.classList.remove('hidden');
    }
    if (setLoaderVisibleCallback) {
      setLoaderVisibleCallback(false);
    }
  };

  useEffect(() => {
    const viewPDF = () => {
      if (reference.pubtype && ['PP_WEBSITE'].includes(reference.pubtype)) {
        openWebLink(reference._id);
      }
      openAttachment(undefined, setLoaderVisible);

      mixpanel.track({ name: 'View PDF', origin: 'keyboard-shortcut', target: preferedViewer });
    };

    EventsHub.on<{ multiple: boolean }>(`reference:attachFile:${reference._id}`, uploadFile);
    EventsHub.on(`reference:viewPDF:${reference._id}`, viewPDF);

    return () => {
      EventsHub.off(`reference:attachFile:${reference._id}`, uploadFile);
      EventsHub.off(`reference:viewPDF:${reference._id}`, viewPDF);
    };
  }, [reference._id, reference.attachments]);

  const renameAttachment = (attachment: Attachment) => {
    openAttachmentRenameDialog({
      // @ts-ignore @TODO: Fix attachment type in rename dialog
      attachment,
      // @ts-ignore
      publication: reference,
      referenceIndex: index,
    });
    mixpanel.track({ name: 'Rename attachment', origin: 'grid' });
  };

  const removeAttachment = (attachment: Attachment) => {
    openRemoveAttachmentConfirmationDialog(getAuthorAndYear(reference), index, attachment);
    mixpanel.track({ name: 'Remove attachment', origin: 'grid' });
  };

  const downloadAttachment = async (attachment: Attachment, libraryId?: string) => {
    downloadAttachmentFile(attachment, reference, gdriveConfig, libraryId);
    mixpanel.track({ name: 'Save attachment to disk', origin: 'grid' });
  };

  const browseJournal = () => {
    mixpanel.track({ name: 'Click UI', type: 'browse for supplementary files', origin: 'grid' });

    browseSupplementaryFiles(reference);
  };

  const editReference = () => {
    openEditDialog(reference);
    mixpanel.track({ name: 'Edit meta-data', origin: 'context-menu' });
  };

  const toggleAutoUpdate = () => {
    openAutoUpdateDialog(reference);
    mixpanel.track({ name: 'Auto-update', origin: 'context-menu' });
  };

  const handleNoteInput = () => {
    if (notesInputRef.current) {
      const noteInputElement = notesInputRef.current.getElement();
      if (!noteInputElement) return;
      const hasSizeChanged = noteInputElement.style.height !== `${noteInputElement.scrollHeight}px`;
      noteInputElement.style.height = `${noteInputElement.scrollHeight}px`;
      if (hasSizeChanged) {
        onSizeChange?.(index);
      }
    }
  };

  const saveNote = () => {
    if (notesInputRef.current) {
      const noteInputElement = notesInputRef.current.getElement();
      if (!noteInputElement) return;
      updateReferences(reference, { note: noteInputElement.innerHTML }, t('referenceNotes.noteSaved'));
    }
    mixpanel.track({ name: 'Edit notes' });
  };

  const clearIncomplete = () => {
    updateReferences(reference, { incomplete: 0, force_complete: 1 });
  };

  const handleRemoveFromCollection = (collection: Collection, libraryId: string) => {
    removeFromCollection(collection, reference, libraryId);
    mixpanel.track({ name: 'Remove from collection', type: collection.collectionType, origin: 'grid' });
  };

  const handleCollectionChange = useCallback(() => onSizeChange?.(index), [index]);

  const FoldersComponent = useCollectionListComponent(
    reference._id,
    reference.folders,
    index,
    'folder',
    activeLibraryOrFolder,
    handleCollectionChange,
    handleRemoveFromCollection
  );
  const LabelsComponent = useCollectionListComponent(
    reference._id,
    reference.labels,
    index,
    'label',
    activeLibraryOrFolder,
    handleCollectionChange,
    handleRemoveFromCollection
  );
  const ProfileComponent = useProfileComponent(reference, isTrashed, activeLibraryOrFolder);

  if (!reference) return null;

  const renderAttachment = (attachment: Attachment, isLastAttachment: boolean) => {
    let setAsMainAction;
    const hasAttachmentPermission = allowedActions.actions.includes('addRemoveAttachments');
    if (couldBePdf(attachment)) {
      // only for pdf files
      if (attachment.article_pdf !== 1) {
        setAsMainAction = (
          <button
            type="button"
            onClick={() => setAttachmentAsMain(index, attachment._id, reference.attachments || [])}
            className="gridReference_button -small"
          >
            {t('referenceAttachments.setAsMain')}
          </button>
        );
      } else {
        setAsMainAction = (
          <div className="referenceAttachments_mainPdf">
            <Icon name="circle-check" size={16} />
            {t('referenceAttachments.isMainPdf')}
          </div>
        );
      }
    }
    return (
      <>
        <div className="referenceAttachments_individual" key={attachment._id}>
          <div className="referenceAttachments_title">
            <button
              type="button"
              className={`gridReference_button referenceAttachments_filename ${
                attachmentLoaders[attachment._id] ? '-disabled' : ''
              }`}
              onClick={() => {
                openAttachment(
                  undefined,
                  v => setAttachmentLoaders({ ...attachmentLoaders, [attachment._id]: v }),
                  attachment
                );
                mixpanel.track({ name: 'View Attachment', origin: 'attachments-panel', target: preferedViewer });
              }}
            >
              {getAttachmentDisplayName(reference, attachment, gdriveConfig)}
            </button>
            {attachmentLoaders[attachment._id] && (
              <Loader
                size={20}
                percentDone={
                  pdfDownloadStatus?.current &&
                  pdfDownloadStatus?.total &&
                  pdfDownloadStatus?.pub?._id === reference._id
                    ? (pdfDownloadStatus?.current * 100) / pdfDownloadStatus.total
                    : undefined
                }
              />
            )}
          </div>
          <div className="referenceAttachments_individual_actions">
            <span className="referenceAttachments_size">{strings.formatFileSize(attachment.filesize || 0)}</span>
            {hasAttachmentPermission && setAsMainAction ? (
              <>
                <DotSeparator className="referenceSeparator -no-margin" />
                {setAsMainAction}
              </>
            ) : (
              <>
                <div />
                <div />
              </>
            )}
            <div />
            <button type="button" className="iconButton" onClick={() => renameAttachment(attachment)}>
              <Icon name="google-drive" size={20} />
            </button>
            <button
              type="button"
              className="iconButton"
              onClick={() => downloadAttachment(attachment, activeLibraryOrFolder?.id)}
            >
              <Icon name="arrow-down-to-bracket" size={20} />
            </button>
            {hasAttachmentPermission ? (
              <button type="button" className="iconButton" onClick={() => removeAttachment(attachment)}>
                <Icon name="trash-can" size={20} />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
        {!isLastAttachment && <Separator styleName="neutral-1" />}
      </>
    );
  };

  const renderAttachmentFooter = () => {
    if (!allowedActions.actions.includes('addRemoveAttachments')) return null;
    return (
      <div className="referenceAttachments_footer">
        <Tooltip text={t('referenceAttachments.attachFileButtonTooltip')}>
          <Button
            styleName="neutral-1"
            size="small"
            label={t('referenceAttachments.attachFileButton')}
            iconLeft="paperclip-vertical"
            onClick={() => {
              if (isOffline) {
                showOfflineNotification();
                return;
              }
              uploadFile({ multiple: true });
              mixpanel.track({ name: 'Click UI', type: 'add attachment', origin: 'attachments-panel' });
            }}
          />
        </Tooltip>
        {getWebsiteLink(reference) && (
          <Tooltip text={t('referenceAttachments.browseJournalTooltip')}>
            <Link
              size="small"
              tag="button"
              styleName="neutral"
              iconLeft="arrow-up-right-from-square"
              label={t('referenceAttachments.browseJournal')}
              onClick={browseJournal}
            />
          </Tooltip>
        )}
      </div>
    );
  };

  const renderHandle = () => (
    <div className="gridReference_contentPanel_handle" role="button">
      <input
        type="checkbox"
        checked={selected}
        className="gridReference_contentPanel_handle_checkbox"
        onClick={e => {
          e.stopPropagation();
          toggleSelectedReference(reference._id);
        }}
        onChange={() => {}}
      />
      {active && <Icon name="grip-dots-vertical" size={20} className="gridReference_contentPanel_handle_icon" />}
    </div>
  );

  const IncompleteMenuComponent =
    reference.incomplete === 1 && reference.force_complete !== 1 ? (
      <IncompleteMenu
        onClear={() => clearIncomplete()}
        onAutoUpdate={() => toggleAutoUpdate()}
        onEdit={() => editReference()}
        missingFields={getReferenceMissingFields(reference)}
      />
    ) : null;

  const LinkComponent = useMemo(() => {
    if (!selected) return null;
    const links = getLinksForReference(reference);

    return links.map(link => (
      <>
        <DotSeparator className="referenceSeparator" />
        <Link
          tag="button"
          onClick={() => {
            if (link.type === 'refs') {
              // connected refs?
            } else if (link.type === 'citedby') {
              goToUrl(getCitedByLink(reference) || '', '');
            } else {
              openLink(link.url);
            }
          }}
          label={link.name}
          styleName="primary"
          size="small"
        />
      </>
    ));
  }, [reference._id, reference.url, reference.pmid, reference.doi, reference, selected]);

  const renderExtraButtons = () => {
    const PdfMenuComponent = allowedActions.actions.includes('addRemoveAttachments') ? (
      <PdfMenu
        showAddPdfButton={selected}
        isTrashed={isTrashed}
        referenceId={reference._id}
        pub={reference}
        isProxyActive={isProxyActive}
        onBrowsePDF={() => browsePDF(reference)}
        onSearchPDF={() => searchGoogleForPDF(reference)}
        onChooseFile={() => {
          uploadFile({ multiple: false });
          mixpanel.track({ name: 'Click UI', type: 'add attachment', origin: 'context-menu' });
        }}
        onFindPDF={() => {
          downloadPDF(reference);
          mixpanel.track({ name: 'Download PDF', origin: 'context-menu' });
        }}
      />
    ) : null;
    return (
      <ReferenceExtraButtons onMarkAsNotDuplicate={() => markReferenceAsNotDuplicate(reference._id)}>
        {hasMainPdf(reference) ? (
          <>
            {!loaderVisible && (
              <button
                className="referencePdfButton"
                type="button"
                onMouseDown={e => e.stopPropagation()}
                onClick={async e => {
                  e.stopPropagation();
                  openAttachment(e.target as HTMLButtonElement, setLoaderVisible);
                  mixpanel.track({ name: 'View PDF', origin: 'grid', target: preferedViewer });
                }}
              >
                {t('reference.viewPDFButton')}
              </button>
            )}
            {loaderVisible && (
              <Loader
                size={20}
                percentDone={
                  pdfDownloadStatus?.current &&
                  pdfDownloadStatus?.total &&
                  pdfDownloadStatus?.pub?._id === reference._id
                    ? (pdfDownloadStatus?.current * 100) / pdfDownloadStatus.total
                    : undefined
                }
              />
            )}
          </>
        ) : (
          PdfMenuComponent
        )}
      </ReferenceExtraButtons>
    );
  };

  const renderTopRight = useCallback(() => {
    const RenderedReferenceMenu = (
      <ReferenceMenu
        onAutoUpdate={toggleAutoUpdate}
        onCopyLink={() => {
          const name = gridHelpers.getAuthorAndYear(reference);
          clipboardUtils.copyPlainTextToClipboard(
            convertFilterStateToUrl({
              root:
                activeLibraryOrFolder?.type === 'shared-library'
                  ? getNameForURL(activeLibraryOrFolder.name, activeLibraryOrFolder.id, 'team')
                  : 'my-library',
              filters: [{ name, type: 'pub', id: reference._id }],
            })
          );
          mixpanel.track({ name: 'Copy link', origin: 'context-menu' });
          showNotification({
            iconLeft: 'check',
            text: t('referenceMenu.copyLinkNotificationText', { name }),
          });
        }}
        onDeletePermanently={() => {
          deletePermanently(reference);
          mixpanel.track({ name: 'Delete from trash', origin: 'context-menu' });
        }}
        onEdit={editReference}
        onMakeCopy={() => {
          duplicateReference(cloneReference(reference, userId), index, getAuthorAndYear(reference));
          mixpanel.track({ name: 'Import', type: 'reference', origin: 'context-menu', source: 'by-copy' });
        }}
        onRemoveFromFolder={() => {
          removeFromFolder(reference._id, activeLibraryOrFolder?.id || 'personal');
          mixpanel.track({ name: 'Remove from collection', type: 'folder', origin: 'context-menu' });
        }}
        onRestoreFromTrash={() => {
          toggleTrashReference(reference, false);
          mixpanel.track({ name: 'Restore from Trash', origin: 'context-menu' });
        }}
        onShare={() => {
          openShareDialog(reference._id);
          mixpanel.track({
            name: 'Create sharing link',
            origin: 'context-menu',
          });
        }}
        onTrash={() => {
          toggleTrashReference(reference, true);
          mixpanel.track({ name: 'Trash', origin: 'context-menu' });
        }}
        onToggle={open => setDragDisabled(open)}
        menuType={isTrashed ? 'trashed' : 'library'}
      />
    );

    if (!activeLibraryOrFolder || isTrashed) return RenderedReferenceMenu;
    return (
      <div className="gridReference_contentPanel_topRight">
        <ReferenceCopyStatus
          idList={reference.id_list}
          referenceId={reference._id}
          libraryId={activeLibraryOrFolder.id}
          isOwner={
            reference.owner === userId ||
            !!reference.linked_from?.includes(userId || '') ||
            !!reference.copied_from?.includes(userId || '')
          }
        />
        {RenderedReferenceMenu}
      </div>
    );
  }, [isTrashed, reference, activeLibraryOrFolder]);

  return (
    <Reference
      highlightedFields={SearchService.getCurrentSearchHighlights()[reference._id]}
      library={activeLibraryOrFolder?.id}
      allowedActions={allowedActions.actions}
      privateActions={privateActions}
      active={active}
      externalDisableDrag={dragDisabled}
      externalOpenPanel={externalOpenPanel}
      externalOpenDetails={externalOpenDetails}
      proxylist={proxylist}
      FoldersComponent={FoldersComponent}
      LabelsComponent={LabelsComponent}
      LinkComponent={LinkComponent}
      ProfileComponent={ProfileComponent}
      IncompleteMenuComponent={IncompleteMenuComponent}
      itemDropRef={itemDrop.ref}
      notesInputRef={notesInputRef}
      onMouseEvent={handleMouseEvent}
      onNoteInput={handleNoteInput}
      onSaveNote={saveNote}
      onSelectReference={handleSelectReference}
      onSelectReferenceFromDrag={handleSelectReferenceFromDrag}
      onToggleStar={() => {
        if (isTrashed) {
          showNotification({
            text: t('grid:referenceIsTrashedNotification', {
              count: 1,
            }),
            hideDelay: 3000,
          });
          return;
        }

        updateReferences(reference, { starred: reference.starred === 1 ? 0 : 1 });
        mixpanel.track({ name: 'Star', origin: 'grid' });
      }}
      onView={() => {
        if (reference.pubtype && ['PP_WEBSITE'].includes(reference.pubtype)) {
          openWebLink(reference._id);
        }
        openAttachment(undefined, setLoaderVisible);
      }}
      onSizeChange={() => {
        onSizeChange?.(index);
      }}
      onToggleBottomPanel={(panel, origin) => {
        if (panel === 'notes' && notesInputRef.current) {
          const noteInputElement = notesInputRef.current.getElement();
          if (noteInputElement) noteInputElement.focus();
          if (origin === 'keyboard-shortcut') notesInputRef.current.setEditing(true);
        }
        mixpanel.track({ name: 'Click UI', type: panelToMixpanelType(panel), origin });
      }}
      onToggleDetails={() => {
        mixpanel.track({ name: 'Click UI', type: 'details view', origin: 'grid' });
      }}
      reference={reference}
      renderAttachment={renderAttachment}
      renderAttachmentFooter={renderAttachmentFooter}
      renderExtraButtons={renderExtraButtons}
      renderHandle={renderHandle}
      renderTopRight={renderTopRight}
      hasSnippets={SearchService.getSearching() && !!SearchService.getCurrentSearchSnippets()[reference._id]}
      renderSnippet={(openPanel, onMouseEvent) => {
        if (SearchService.getSearching() && SearchService.getCurrentSearchSnippets()[reference._id]) {
          return (
            <Snippet
              showBottomMargin={!!showBottomMargin}
              onMouseEvent={onMouseEvent}
              onSnippetClick={snippetType => openPanel(snippetType === 'note' ? 'notes' : 'abstract')}
              snippets={SearchService.getCurrentSearchSnippets()[reference._id]}
            />
          );
        }
        return null;
      }}
      showBottomMargin={showBottomMargin}
    />
  );
};

const getReference = (state: RootState, props: OwnProps): ReferenceType => state.grid.references[props.index];

const referenceSelector = createSelector<RootState, OwnProps, ReferenceType, ReferenceType>(
  [getReference],
  reference => reference
);

const userSettingsSelector = createSelector<
  RootState,
  RootState['settings']['userSettings'],
  RootState['settings']['userSettings'] | undefined
>(
  state => state.settings.userSettings,
  userSettings => userSettings
);

const gdriveConfigSelector = createSelector<RootState, RootState['settings']['userSettings'], any>(
  state => state.settings.userSettings,
  userSettings => (userSettings && userSettings.gdrive_config ? JSON.parse(userSettings.gdrive_config) : undefined)
);

const mapStateToProps = (state: RootState, props: OwnProps) => {
  const reference = referenceSelector(state, props);
  const selected =
    (reference && !!state.grid.selectedReferencesIds[reference._id]) ||
    (reference && state.grid.selectAllMode && !state.grid.selectAllIgnoredIds[reference._id]);
  const userSettings = userSettingsSelector(state);
  const active =
    typeof state.grid.activeReferenceIndex !== 'undefined' && props.index === state.grid.activeReferenceIndex;

  return {
    gdriveConfig: gdriveConfigSelector(state),
    active,
    activeReferenceSource: active ? state.grid.activeReferenceSource : undefined,
    externalOpenPanel: reference ? getOpenReferencePanels(reference._id) : undefined,
    externalOpenDetails: reference ? getOpenReferenceDetails(reference._id) : undefined,
    isOffline: state.settings.appStatus !== 'connect',
    reference,
    selected,
    preferedViewer: state?.settings?.userSettings?.pubview_preferredViewer || 'metapdf',
    proxylist: userSettings?.proxy_list,
    isProxyActive: hasProxyActive(userSettings),
    userId: userSettings?._id,
    isTrashed: state.grid.activeFilters.includes('TRASHED'),
    pdfDownloadStatus:
      state.sync.pdfDownloadStatus?.pub && state.sync.pdfDownloadStatus?.pub._id === reference._id
        ? state.sync.pdfDownloadStatus
        : undefined,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  addToCollection: (collection: Collection, reference: ReferenceType, draggingOverRange: boolean, libraryId: string) =>
    dispatch(addReferenceToCollectionAction(collection, reference._id, draggingOverRange, libraryId)),
  addToCollectionForDifferentLibrary: (
    reference: ReferenceType,
    libraryId: string,
    sourceLibraryId: string,
    collection: Collection
  ) => dispatch(dropReferenceOnDifferentLibraryAction(reference, libraryId, sourceLibraryId, collection)),
  browsePDF: (reference: ReferenceType) => dispatch(browsePDFAction(reference)),
  browseSupplementaryFiles: (reference: ReferenceType) => dispatch(browseSupplementaryFilesAction(reference)),
  deletePermanently: (reference: ReferenceType) =>
    dispatch(
      openDeletePermanentlyConfirmationDialogAction({
        selectedReferencesIds: { [reference._id]: true },
      })
    ),
  downloadPDF: (reference: ReferenceType) => dispatch(downloadPDFAction(reference)),
  duplicateReference: (reference: ReferenceType, originalReferenceIndex: number, authorAndYear: string) =>
    dispatch(duplicateReferenceThunkAction({ reference, originalReferenceIndex, authorAndYear })),
  markReferenceAsNotDuplicate: (referenceId: string) => dispatch(markReferenceAsNotDuplicateAction({ referenceId })),
  openAttachmentRenameDialog: (
    props: Pick<AttachmentRenameDialogProps, 'attachment' | 'publication'> & { referenceIndex: number }
  ) => dispatch(openDialogAction({ type: 'ATTACHMENT_RENAME_DIALOG', props })),
  openAttachmentUploadDialog: (reference: ReferenceType, referenceIndex: number, fileTypes?: string[]) =>
    dispatch(openDialogAction({ type: 'ATTACHMENT_UPLOAD_DIALOG', props: { reference, referenceIndex, fileTypes } })),
  openAutoUpdateDialog: (reference: ReferenceType) => dispatch(openAutoUpdateDialogAction(reference)),
  openEditDialog: (reference: ReferenceType) => dispatch(openEditDialogAction(reference)),
  openRemoveAttachmentConfirmationDialog: (authorAndYear: string, referenceIndex: number, attachment: Attachment) =>
    dispatch(
      openRemoveAttachmentConfirmationDialogAction(
        authorAndYear,
        () => dispatch(removeAttachmentThunkAction({ referenceIndex, attachment })),
        true
      )
    ),
  openShareDialog: (id: string) => {
    dispatch(openDialogAction({ type: 'ADHOC_SHARING_DIALOG', props: { forceReferenceIds: [id] } }));
  },
  openWebLink: (id: string) => dispatch(openWebLinkAction(id)),
  openLink: (url: string) => dispatch(openLinkAction(url)),
  removeFromCollection: (collection: Collection, reference: ReferenceType, libraryId: string) =>
    dispatch(removeFromCollectionThunkAction({ collection, references: { [reference._id]: true }, libraryId })),
  removeFromFolder: (referenceId: string, libraryId: string) =>
    dispatch(removeFromFolderAction(libraryId, referenceId)),
  searchGoogleForPDF: (reference: ReferenceType) => dispatch(searchGoogleForPDFAction(reference)),
  setActiveReference: (value: ActiveGridReference) => dispatch(setActiveReferenceAction(value)),
  setAttachmentAsMain: (referenceIndex: number, attachmentId: string, attachments: Attachment[]) =>
    dispatch(setAttachmentAsMainThunkAction({ referenceIndex, attachmentId, attachments })),
  showExtensionFeatureOnlyNotification: () => dispatch(showExtensionFeatureOnlyNotificationAction()),
  showNotification: (notification: Notification) => dispatch(showNotificationAction(notification)),
  showOfflineNotification: () => dispatch(showOfflineNotificationAction()),
  toggleTrashReference: (references: ReferenceType, trash: boolean) =>
    dispatch(
      toggleTrashSelectedReferencesThunkAction({
        selectedReferencesIds: { [references._id]: true },
        trashed: trash ? 1 : 0,
      })
    ),
  toggleSelectedReference: (id: string, disableUnselect: boolean = false, dragging: boolean = false) =>
    dispatch(toggleSelectedReferenceThunkAction(id, disableUnselect, dragging)),
  updateAttachment: (referenceIndex: number, attachment: Attachment, changes: Partial<Attachment>) =>
    dispatch(
      updateAttachmentThunkAction({
        referenceIndex,
        attachment,
        changes,
      })
    ),
  updateReferences: (reference: ReferenceType, changes: Partial<ReferenceType>, label?: string) =>
    dispatch(updateReferencesThunkAction({ referencesIds: { [reference._id]: true }, changes, notification: label })),

  createAttachment: (attachments: Attachment[], reference: ReferenceType, referenceIndex: number) =>
    dispatch(createAttachmentThunkAction({ attachments, reference, referenceIndex })),

  resetPdfDownloadStatus: () => dispatch(pdfProgressAction(undefined)),
});

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(React.memo(ConnectedReference));

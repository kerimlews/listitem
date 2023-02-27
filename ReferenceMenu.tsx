import React from 'react';
import { useSelector } from 'react-redux';
import Icon from 'pp-ui/v2/fundamentals/icons/Icon';
import MenuItem from 'pp-ui/v2/basic/dropdowns/MenuItem';
import Separator from 'pp-ui/v2/basic/dropdowns/Separator';
import { useTranslation } from 'react-i18next';

import { shortcutsHelpers } from '../../helpers';
import { collectionsSelector } from '../../TreePanel/slice';
import { RootState } from '../../rootReducer';
import Menu from '../../menus/Menu';
import useAllowedActions from '../../Permissions/useAllowedActions';

type Props = {
  onAutoUpdate: () => void;
  onCopyLink: () => void;
  onDeletePermanently: (open: boolean) => void;
  onEdit: () => void;
  onRemoveFromFolder: () => void;
  onRestoreFromTrash: (open: boolean) => void;
  onMakeCopy: () => void;
  onShare: () => void;
  onTrash: () => void;
  onToggle: (open: boolean) => void;
  menuType: 'library' | 'trashed';
};

const ReferenceMenu: React.FC<Props> = ({
  onAutoUpdate,
  onCopyLink,
  onDeletePermanently,
  onEdit,
  onRemoveFromFolder,
  onRestoreFromTrash,
  onMakeCopy,
  onShare,
  onTrash,
  onToggle,
  menuType,
}) => {
  const { t } = useTranslation(['grid', 'common']);
  const hasActiveFolder = useSelector((state: RootState) => {
    if (state.grid.activeFilters.includes('TRASHED')) return false;
    const folderCollections = collectionsSelector
      .selectAll(state.collections)
      .filter(c => c.collectionType === 'folder');
    return folderCollections.some(f => state.grid.activeFilters.includes(f._id));
  });

  const hasDuplicatesFilter = useSelector((state: RootState) => state.grid.activeFilters.includes('DUPLICATES'));

  const allowedActions = useAllowedActions('reference');

  const MenuContent =
    menuType === 'library' ? (
      <>
        <MenuItem
          label={t('referenceMenu.edit')}
          icon="pencil"
          hint={shortcutsHelpers.getShortcutKey('referenceActions', 'edit')}
          disabled={!allowedActions.actions.includes('editReference')}
          onClick={() => {
            onEdit();
          }}
          tooltip={{
            text: t('common:restrictedActionTooltipAndNotificationText', {
              name: allowedActions.activeLibraryOrFolderName || '',
            }),
            disabled: allowedActions.actions.includes('editReference'),
          }}
        />

        {!hasDuplicatesFilter && (
          <MenuItem
            label={t('referenceMenu.duplicate')}
            icon="copy"
            hint={shortcutsHelpers.getShortcutKey('referenceActions', 'duplicate')}
            onClick={() => {
              onMakeCopy();
            }}
          />
        )}
        <Separator />
        <MenuItem
          label={t('referenceMenu.autoUpdate')}
          icon="wand-magic-sparkles"
          hint={shortcutsHelpers.getShortcutKey('referenceActions', 'autoUpdate')}
          onClick={() => {
            onAutoUpdate();
          }}
          disabled={!allowedActions.actions.includes('editReference')}
          tooltip={{
            text: t('common:restrictedActionTooltipAndNotificationText', {
              name: allowedActions.activeLibraryOrFolderName || '',
            }),
            disabled: allowedActions.actions.includes('editReference'),
          }}
        />
        <Separator />
        <MenuItem
          label={t('referenceMenu.share')}
          icon="paper-plane"
          hint={shortcutsHelpers.getShortcutKey('sharing', 'shareViaLink')}
          onClick={() => {
            onShare();
          }}
        />
        <MenuItem
          label={t('referenceMenu.copyLink')}
          icon="link"
          hint={shortcutsHelpers.getShortcutKey('copy', 'copyLink')}
          onClick={() => {
            onCopyLink();
          }}
        />
        <Separator />
        {hasActiveFolder && (
          <MenuItem
            label={t('referenceMenu.removeFromFolder')}
            icon="folder-xmark"
            hint={shortcutsHelpers.getShortcutKey('referenceActions', 'removeFromCurrentFolder')}
            onClick={() => {
              onRemoveFromFolder();
            }}
            disabled={!allowedActions.actions.includes('addEditFolders')}
            tooltip={{
              text: t('common:restrictedActionTooltipAndNotificationText', {
                name: allowedActions.activeLibraryOrFolderName || '',
              }),
              disabled: allowedActions.actions.includes('addEditFolders'),
            }}
          />
        )}

        <MenuItem
          label={t('referenceMenu.trash')}
          icon="trash-can"
          hint={shortcutsHelpers.getShortcutKey('organize', 'trash')}
          disabled={!allowedActions.actions.includes('trashReference')}
          onClick={() => {
            onTrash();
          }}
          tooltip={{
            text: t('common:restrictedActionTooltipAndNotificationText', {
              name: allowedActions.activeLibraryOrFolderName || '',
            }),
            disabled: allowedActions.actions.includes('trashReference'),
          }}
        />
      </>
    ) : (
      <>
        <MenuItem
          icon="xmark-large"
          label={t('referenceMenu.deletePermanentlyOption')}
          onClick={() => {
            onDeletePermanently(false);
          }}
        />
        <MenuItem
          icon="rotate-right"
          label={t('referenceMenu.restoreFromTrashOption')}
          onClick={() => {
            onRestoreFromTrash(false);
          }}
        />
      </>
    );

  return (
    <Menu
      onToggle={open => {
        onToggle(open);
      }}
      placement="bottom-end"
      Trigger={() => (
        <button type="button" className="iconButton">
          <Icon name="ellipsis" size={16} />
        </button>
      )}
      width={300}
    >
      {MenuContent}
    </Menu>
  );
};

export default React.memo(ReferenceMenu);

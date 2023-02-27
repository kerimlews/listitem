/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/interactive-supports-focus */
import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'pp-ui/v2/fundamentals/icons/Icon';
import Label from 'pp-ui/v2/basic/misc/Label';
import { useTranslation } from 'react-i18next';
import { TooltipWithComponent } from 'pp-ui/ts/webapp';

import { RootState } from '../../rootReducer';
import { collectionsSelector } from '../../TreePanel/slice';
import { addFilterAndTriggerSearchAction } from '../slice';
import { Collection } from '../../TreePanel/types';
import useLocalSetting from '../../hooks/useLocalSetting';
import { treeHelpers } from '../../helpers';
import mixpanel from '../../mixpanel';
import useAllowedActions from '../../Permissions/useAllowedActions';
import { SelectedLibrary } from '../../Filters/slice';

type Props = {
  activeLibrary?: SelectedLibrary;
  collectionsId: string[];
  referenceId: string;
  type: 'label' | 'folder';
  onClear: (collection: Collection, libraryId: string) => void;
  onChange: () => void;
};

const ReferenceCollectionList: React.FC<Props> = ({
  activeLibrary,
  collectionsId,
  referenceId,
  onClear,
  onChange,
  type,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('grid');
  const tooltipRef = useRef<{ setOpen: (value: boolean) => void }>();
  const allowedActions = useAllowedActions('reference');
  const [labelSortKey = 'cName'] = useLocalSetting('labelSortKey', 'cName');

  const collections = useSelector((state: RootState) => {
    const filteredCollections = collectionsId.reduce((current, collectionId) => {
      const collectionData = collectionsSelector.selectById(state.collections, collectionId);
      if (collectionData) {
        return [...current, collectionData];
      }
      return current;
    }, [] as Collection[]);
    return type === 'label'
      ? treeHelpers.getOrderedCollections(
          filteredCollections,
          labelSortKey,
          state.collections.collectionCounts,
          false,
          'label'
        )
      : filteredCollections;
  });

  useLayoutEffect(() => {
    onChange();
  }, []);

  useLayoutEffect(() => {
    onChange();
  }, [collections]);

  const addAsFilter = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLSpanElement> | undefined,
      collection: Collection
    ) => {
      event?.stopPropagation();
      dispatch(addFilterAndTriggerSearchAction(collection._id));
      mixpanel.track({ name: 'View collection', type: collection.collectionType, origin: 'grid' });
    },
    []
  );

  const removeCollection = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLSpanElement> | undefined,
      collection: Collection
    ) => {
      event?.stopPropagation();
      if (collection) onClear(collection, activeLibrary?.id || 'personal');
    },
    [collections, referenceId, activeLibrary]
  );

  if (type === 'folder' && activeLibrary && !collections.length) {
    return (
      <div className="referenceFolder -no-hover">
        <Icon name={activeLibrary.type === 'shared-library' ? 'users' : 'folder-user'} size={18} />
        <span className="referenceFolder_collectionName" role="button">
          {activeLibrary.name}
        </span>
      </div>
    );
  }

  if (!collections.length) return null;

  if (type === 'label') {
    return (
      <>
        {collections.map(collection => (
          <Label
            className="referenceLabel"
            size="small"
            styleName={collection.cStyle}
            text={collection.cName}
            xMark={allowedActions.actions.includes('addEditLabels') ? 'onHover' : 'hidden'}
            onCrossClick={e => removeCollection(e, collection)}
            onClick={e => collection._id !== activeLibrary?.id && addAsFilter(e, collection)}
          />
        ))}
      </>
    );
  }

  const renderFolderItem = (collection: Collection) => {
    const showRemoveButton =
      type === 'folder' && allowedActions.actions.includes('addEditFolders') && collection._id !== activeLibrary?.id;

    const FolderItem = (
      <div
        className={`referenceFolder ${showRemoveButton ? '-show-remove-button' : ''} ${
          collections.length && collections.length > 1 ? '-show-margin' : ''
        }`}
        key={collection._id}
      >
        <Icon name={activeLibrary || collection.sharing_on === 1 ? 'folder-user' : 'folder'} size={18} />
        <span
          className="referenceFolder_collectionName"
          role="button"
          onClick={e => collection._id !== activeLibrary?.id && addAsFilter(e, collection)}
          onMouseDown={e => {
            e.stopPropagation();
          }}
        >
          {collection.cName}
        </span>
        {showRemoveButton && (
          <button
            className="gridReference_button"
            type="button"
            onMouseDown={e => {
              e.stopPropagation();
            }}
            onClick={e => removeCollection(e, collection)}
          >
            <Icon name="xmark" size={14} />
          </button>
        )}
      </div>
    );

    return FolderItem;
  };

  return (
    <>
      {renderFolderItem(collections[0])}
      {collections.length && collections.length > 1 && (
        <TooltipWithComponent
          componentRef={tooltipRef}
          tooltipClassName="referenceFolder_tooltip"
          placement="top"
          component={collections.slice(1).map(renderFolderItem)}
        >
          <span className="referenceFolder_more">{t('reference.moreFolders', { count: collections.length - 1 })}</span>
        </TooltipWithComponent>
      )}
    </>
  );
};

export default React.memo(ReferenceCollectionList);

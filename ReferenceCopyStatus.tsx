import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Tooltip from 'pp-ui/v2/basic/misc/Tooltip';
import { Icon, IconName } from 'pp-ui/ts/webapp';
import { useTranslation } from 'react-i18next';
import { searchReferencesByIdsAction } from '../../Search/slice';
import { importReferenceToOtherLibraryAction } from '../actions/importActions';
import dataClient from '../../dataClient';

type ReferenceCopyStatusType = 'hasCopy' | 'hasCopyAndOwner' | 'noCopy';

type Props = {
  referenceId: string;
  libraryId: string;
  idList?: string[];
  isOwner: boolean;
};

const typeIconMap: Record<ReferenceCopyStatusType, IconName> = {
  hasCopy: 'check',
  noCopy: 'plus',
  hasCopyAndOwner: 'bullet',
};

const ReferenceCopyStatus: React.FC<Props> = ({ referenceId, libraryId, idList, isOwner }) => {
  const { t } = useTranslation('grid');
  const dispatch = useDispatch();
  const [copyStatus, setCopyStatus] = useState<ReferenceCopyStatusType | undefined>('noCopy');
  const [duplicateIds, setDuplicateIds] = useState<string[]>([]);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.stopPropagation();
    if (!copyStatus) return;
    if (copyStatus !== 'noCopy') {
      dispatch(searchReferencesByIdsAction(duplicateIds, t('referenceCopyStatus.referencesInMyLibraryFilterName')));
      return;
    }
    dispatch(importReferenceToOtherLibraryAction([referenceId], libraryId, 'personal', undefined));
  };

  useEffect(() => {
    const getDuplicatesInPrivateLibrary = async (ids: string[]) => {
      const [duplicatesInPrivateLibrary] = await dataClient.forLibrary().getDuplicateEntries([ids]);
      if (!duplicatesInPrivateLibrary) return;

      const formattedDuplicatesIds = duplicatesInPrivateLibrary.reduce((current, dup) => {
        if (dup) {
          return [...current, dup.publication_id];
        }
        return current;
      }, [] as string[]);

      if (!formattedDuplicatesIds) return;

      if (formattedDuplicatesIds.length && isOwner) {
        setCopyStatus('hasCopyAndOwner');
        setDuplicateIds(formattedDuplicatesIds);
      } else if (formattedDuplicatesIds.length && !isOwner) {
        setCopyStatus('hasCopy');
        setDuplicateIds(formattedDuplicatesIds);
      } else {
        setCopyStatus('noCopy');
      }
    };
    if (idList) getDuplicatesInPrivateLibrary(idList);
  }, [referenceId, libraryId, idList, isOwner]);

  if (!copyStatus) return null;

  return (
    <Tooltip
      text={t(
        copyStatus === 'noCopy'
          ? 'referenceCopyStatus.addToMyLibraryTooltip'
          : 'referenceCopyStatus.showInMyLibraryTooltip'
      )}
      placement="bottom"
    >
      <button
        type="button"
        className="gridReference_button gridReference_contentPanel_body_menu -hover-toggle-visibility"
        onMouseDown={e => e.stopPropagation()}
        onClick={handleClick}
      >
        {copyStatus !== 'hasCopyAndOwner' ? <Icon name={typeIconMap[copyStatus]} size={16} /> : <span>&#9673;</span>}
      </button>
    </Tooltip>
  );
};

export default React.memo(ReferenceCopyStatus);

/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/interactive-supports-focus */
import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { RootState } from '../../rootReducer';

type Props = {
  onMarkAsNotDuplicate: () => void;
};

const ReferenceExtraButtons: React.FC<Props> = ({ children, onMarkAsNotDuplicate }) => {
  const { t } = useTranslation('grid');

  const isDuplicateFilter = useSelector((state: RootState) => {
    return state.grid.activeFilters.includes('DUPLICATES');
  });

  return (
    <div className="gridReference_extraButtons">
      {isDuplicateFilter && (
        <button
          className="gridReference_button gridReference_contentPanel_toolbar_viewButton"
          type="button"
          onMouseDown={onMarkAsNotDuplicate}
          onClick={onMarkAsNotDuplicate}
        >
          {t('reference.notDuplicateButton')}
        </button>
      )}
      {children}
    </div>
  );
};

export default ReferenceExtraButtons;

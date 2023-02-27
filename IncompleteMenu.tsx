/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import Icon from 'pp-ui/v2/fundamentals/icons/Icon';
import Tooltip from 'pp-ui/v2/basic/misc/Tooltip';
import Link from 'pp-ui/v2/basic/buttons/Link';
import styled from 'pp-ui/pp-styled-components';
import textTheme from 'pp-ui/v2/fundamentals/typography/Text.theme';

import { useTranslation } from 'react-i18next';
import DotSeparator from 'pp-ui/v2/basic/layout/DotSeparator';

import theme from './IncompleteMenu.theme';

const TooltipContent = styled.div`
  width: 367px;
  display: grid;
  grid-template-rows: max-content max-content;
  row-gap: 24px;
  padding: 0 4px;
`;

const LinksWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
`;

const MissingFields = styled.div`
  margin-top: 18px;
  color: ${theme.missingFieldsColor};
  display: flex;
  align-items: center;
  gap: 4px;
  ${textTheme.medium.medium}
`;

type Props = {
  missingFields: string[];
  onAutoUpdate: () => void;
  onEdit: () => void;
  onClear: () => void;
};

const IncompleteMenu: React.FC<Props> = ({ missingFields, onEdit, onClear, onAutoUpdate }) => {
  const { t } = useTranslation('grid');

  const TooltipContentComponent = (
    <TooltipContent
      className="grid-ignore-click-outside"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <div>
        {t('referenceMenu.missingFields')}
        <MissingFields>
          {missingFields.map((mf, index) => (
            <React.Fragment key={mf}>
              <span key={mf}>{mf}</span>
              {index !== missingFields.length - 1 && <DotSeparator />}
            </React.Fragment>
          ))}
        </MissingFields>
      </div>

      <LinksWrapper>
        <Link
          styleName="primary"
          size="large"
          tag="button"
          label={t('referenceMenu.edit')}
          onClick={e => {
            e.stopPropagation();
            onEdit();
          }}
        />
        <DotSeparator />
        <Link
          styleName="primary"
          size="large"
          tag="button"
          label={t('referenceMenu.autoUpdate')}
          onClick={e => {
            e.stopPropagation();
            onAutoUpdate();
          }}
        />
        <DotSeparator />
        <Link
          styleName="primary"
          size="large"
          tag="button"
          label={t('referenceMenu.clear')}
          onClick={e => {
            e.stopPropagation();
            onClear();
          }}
        />
      </LinksWrapper>
    </TooltipContent>
  );

  return (
    <span role="button" className="referenceIncompleteMenu" onMouseDown={e => e.stopPropagation()}>
      <Tooltip placement="top" component={TooltipContentComponent}>
        <div className="referenceIncompleteMenu_wrapper">
          &#8288;
          <Icon className="referenceIncompleteMenu_icon" name="bolt-lightning" size={16} />
          {t('reference.incomplete')}
        </div>
      </Tooltip>
    </span>
  );
};

export default React.memo(IncompleteMenu);

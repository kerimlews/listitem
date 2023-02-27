/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'pp-ui/pp-styled-components';
import Link from 'pp-ui/v2/basic/buttons/Link';
import MenuItem from 'pp-ui/v2/basic/dropdowns/MenuItem';
import Separator from 'pp-ui/v2/basic/dropdowns/Separator';
import Icon, { IconName } from 'pp-ui/v2/fundamentals/icons/Icon';
import textTheme from 'pp-ui/v2/fundamentals/typography/Text.theme';
import DotSeparator from 'pp-ui/v2/basic/layout/DotSeparator';
import Tooltip from 'pp-ui/v2/basic/misc/Tooltip';
import { detectBrowser } from 'pp-shared/src/core/Browser';

import { useTranslation } from 'react-i18next';

import type { Reference } from '../types';

import config from '../../../global/config';
import { clearAllPdfProgressAction, clearPdfProgressAction } from '../slice';
import { goToUrl } from '../../App/helpers';
import { RootState } from '../../rootReducer';
import { shortcutsHelpers } from '../../helpers';
import { reportCrawlerToBackendAction } from '../actions/crawlActions';
import Menu from '../../menus/Menu';

import theme from './PdfMenu.theme';
import { getWebsiteLink } from '../helpers';

const ProgressWrapper = styled.div`
  min-height: 20px;
  display: flex;
  align-items: center;
  gap: 3px;
  ${textTheme.medium.small}
  fill: ${theme.progressIconColor};
  color: ${theme.progressColor};
`;

const TooltipContent = styled.div`
  max-width: 367px;
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

const StyledLink = styled(Link)`
  ${textTheme.medium.medium}

  &:hover {
    background: transparent;
  }
`;

const StatusInfo = styled.div`
  text-align: left;
  white-space: normal;
`;

const MessageWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  fill: ${theme.resultIconColor};
  color: ${theme.resultColor};
  ${textTheme.medium.small}
  &:hover {
    color: ${theme.resultHoverColor};
  }
`;

const PDF_RESULT_ICON_MAP: Record<string, IconName> = {
  PDF_NOT_FOUND: 'square-question',
  NO_URL: 'square-question',
  ACCESS_RESTRICTED: 'lock-keyhole',
  SITE_NOT_SUPPORTED: 'square-question',
  CRAWLER_FAILED: 'triangle-exclamation',
  LOGIN_REQUIRED: 'square-question',
  DOWNLOAD_SIZE_EXCEEDED: 'triangle-exclamation',
};

type Props = {
  isProxyActive: boolean;
  isTrashed: boolean;
  pub: Reference;
  referenceId: string;
  showAddPdfButton: boolean;
  onBrowsePDF: () => void;
  onChooseFile: () => void;
  onFindPDF: () => void;
  onSearchPDF: () => void;
};

const PdfMenu: React.FC<Props> = ({
  isProxyActive,
  isTrashed,
  pub,
  referenceId,
  showAddPdfButton,
  onBrowsePDF,
  onChooseFile,
  onFindPDF,
  onSearchPDF,
}) => {
  const dispatch = useDispatch();
  const progress = useSelector((state: RootState) => state.grid.pdfProgress[referenceId]);
  const { t } = useTranslation('grid');

  if (isTrashed) return null;

  if (progress && progress.type !== 'result') {
    return (
      <ProgressWrapper>
        <>
          <Icon name="animated-down" size={18} />

          {(() => {
            if (progress.type === 'url') {
              return progress.text;
            }
            if (progress.type === 'text') {
              return t(`pdfMenu.${progress.text}`);
            }
            if (progress.type === 'progress') {
              return `${t('pdfMenu.downloading')} ${progress.text}`;
            }
            return '';
          })()}
        </>
      </ProgressWrapper>
    );
  }

  const pdfStatus = progress && progress.type === 'result' && progress.message && (
    <Tooltip
      placement="top"
      component={
        <TooltipContent
          className="grid-ignore-click-outside"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <StatusInfo>
            {t(`pdfMenu.${progress.message}.info`)}{' '}
            <StyledLink
              tag="button"
              label={t('pdfMenu.learnMore')}
              styleName="primary"
              size="large"
              onClick={e => {
                goToUrl(config.contentUrl, 'h/troubleshooting-pdf-downloads/');
                e.stopPropagation();
              }}
            />
          </StatusInfo>
          <LinksWrapper>
            <Link
              tag="button"
              size="large"
              label={t('pdfMenu.reportButtonText')}
              styleName="primary"
              onClick={e => {
                const url = pub.id_list?.filter(id => id.startsWith('url:'))[0] || '';
                dispatch(
                  reportCrawlerToBackendAction(pub, url.replace(/^url:/, ''), isProxyActive, {
                    PP_ENV: process.env.PP_ENV,
                    browser: detectBrowser(),
                  })
                );
                e.stopPropagation();
              }}
            />
            <DotSeparator />
            <Link
              tag="button"
              size="large"
              label={t('pdfMenu.retryButtonText')}
              styleName="primary"
              onClick={e => {
                dispatch(clearPdfProgressAction(referenceId));
                e.stopPropagation();
                onFindPDF();
              }}
            />
            <DotSeparator />
            <Link
              tag="button"
              size="large"
              styleName="primary"
              onClick={e => {
                dispatch(clearAllPdfProgressAction());
                e.stopPropagation();
              }}
              label={t('pdfMenu.clearAllButtonText')}
            />
            <DotSeparator />
            <Link
              tag="button"
              size="large"
              styleName="primary"
              onClick={e => {
                dispatch(clearPdfProgressAction(referenceId));
                e.stopPropagation();
              }}
              label={t('pdfMenu.clearButtonText')}
            />
          </LinksWrapper>
        </TooltipContent>
      }
    >
      <MessageWrapper>
        {PDF_RESULT_ICON_MAP[progress.message] && <Icon name={PDF_RESULT_ICON_MAP[progress.message]} size={18} />}
        {t(`pdfMenu.${progress.message}.label`)}
      </MessageWrapper>
    </Tooltip>
  );

  return (
    <div className="referencePdfMenu_statusWrapper" onMouseDown={e => e.stopPropagation()}>
      {pdfStatus}
      {pdfStatus && showAddPdfButton && <DotSeparator />}
      {showAddPdfButton && (
        <Menu
          placement="bottom-end"
          Trigger={() => (
            <Link tag="button" styleName="neutral" size="small" label={t('pdfMenu.addPDFButtonText')} dropdown />
          )}
          width={300}
        >
          <MenuItem
            label={t('pdfMenu.findPDFOnline')}
            hint={shortcutsHelpers.getShortcutKey('referenceActions', 'findPDF')}
            icon="arrow-down-bolt-custom"
            onClick={() => {
              onFindPDF();
            }}
          />
          <Separator />
          <MenuItem
            label={t('pdfMenu.attachPDF')}
            hint={shortcutsHelpers.getShortcutKey('referenceActions', 'attachFile')}
            icon="paperclip-vertical"
            onClick={() => {
              onChooseFile();
            }}
          />
          <MenuItem
            label={t('pdfMenu.browsePDF')}
            icon="location-crosshairs"
            disabled={!getWebsiteLink(pub)}
            onClick={() => {
              onBrowsePDF();
            }}
          />
          <MenuItem
            label={t('pdfMenu.searchGoogleForPDF')}
            icon="magnifying-glass"
            onClick={() => {
              onSearchPDF();
            }}
          />
        </Menu>
      )}
    </div>
  );
};

export default React.memo(PdfMenu);

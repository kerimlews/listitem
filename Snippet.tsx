/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { Snippet as SnippetType } from 'pp-shared/src/library/Snippets';
import type { UserSearchSettings } from 'pp-shared/src/schema/ts';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuid } from 'uuid';
import type { DataLayerTypes } from 'pp-shared/types';
import { useSelector } from 'react-redux';
import { RootState } from '../../rootReducer';

export const renderSnippet = (
  dataRender?: DataLayerTypes.DB.DataRender | (DataLayerTypes.DB.DataRender | string)[] | string
): React.ReactElement | string | null | undefined => {
  if (!dataRender) return null;
  if (typeof dataRender === 'string') {
    return <span>{(dataRender || '').replace(/&hellip;/g, ' ... ')}</span>;
  }
  if (Array.isArray(dataRender)) {
    return <>{dataRender.map((data: DataLayerTypes.DB.DataRender | string) => renderSnippet(data))}</>;
  }
  const { className } = dataRender;
  const content = (
    <>
      {(dataRender.content || '').replace(/&hellip;/g, ' ... ')}
      {dataRender.children && dataRender.children.length > 0 && renderSnippet(dataRender.children)}
    </>
  );

  const id = uuid();
  if (dataRender.type === '<i>') {
    return (
      <i key={id} className={className}>
        {content}
      </i>
    );
  }

  if (dataRender.type === '<sup>') {
    return (
      <sup key={id} className={className}>
        {content}
      </sup>
    );
  }

  if (dataRender.type === '<sub>') {
    return (
      <sub key={id} className={className}>
        {content}
      </sub>
    );
  }

  if (dataRender.type === '<div>') {
    return (
      <div key={id} className={className}>
        {content}
      </div>
    );
  }

  if (dataRender.type === '<span>') {
    return (
      <span key={id} className={className}>
        {content}
      </span>
    );
  }

  return <span>{dataRender.content}</span>;
};

type Props = {
  snippets: SnippetType[];
  showBottomMargin: boolean;
  onMouseEvent?: React.MouseEventHandler<HTMLDivElement>;
  onSnippetClick?: (snippetType: SnippetType['type']) => void;
};

const Snippet: React.FC<Props> = ({ snippets, showBottomMargin, onMouseEvent, onSnippetClick }) => {
  const { t } = useTranslation('grid');
  const searchSettings = useSelector((state: RootState) => {
    if (state.settings.userSettings?.search_settings) {
      const parsedSearchSettings: UserSearchSettings = JSON.parse(state.settings.userSettings.search_settings);
      return parsedSearchSettings;
    }
    return {
      abstracts: false,
      fullText: true,
      notes: true,
    };
  });
  const getSnippetLabel = (snippet: SnippetType) => {
    if (snippet.type === 'abstract') return t('referenceSnippet.abastractSnippetLabel');
    if (snippet.type === 'note') return t('referenceSnippet.noteSnippetLabel');
    if (snippet.type === 'fullText') return t('referenceSnippet.fullTextSnippetLabel');
    return '';
  };

  return (
    <>
      {snippets.map(s => {
        if (
          (s.type === 'note' && !searchSettings.notes) ||
          (s.type === 'abstract' && !searchSettings.abstracts) ||
          (s.type === 'fullText' && !searchSettings.fullText)
        ) {
          return null;
        }
        const rendered = renderSnippet(s.renderData);
        return (
          <div
            key={uuid()}
            className={
              showBottomMargin ? ['gridReference_bottomPanel', '-bottom-margin'].join(' ') : 'gridReference_bottomPanel'
            }
            onMouseMove={onMouseEvent}
            onMouseEnter={onMouseEvent}
          >
            <span className="referenceSnippet_label">{getSnippetLabel(s)} </span>
            <span role="button" className="referenceSnippet_text" onClick={() => onSnippetClick?.(s.type)}>
              {rendered}
            </span>
          </div>
        );
      })}
    </>
  );
};

export default Snippet;

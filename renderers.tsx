import PP from 'pp-library-webapp-main';
import { Icon } from 'pp-ui/ts/webapp';
import PubTypes from 'pp-shared/src/library/Pubtypes';
import * as Publication from 'pp-shared/src/library/Publication';
import { v4 as uuid } from 'uuid';

import React from 'react';
import i18n from '../../../translations/i18n';
import { getReferenceTypeLabel } from '../commonHelpers';
import type { AuthorType, DateType, Reference } from '../types';
import type { Field } from '../../AddEditDialog/types';

const pubTypes = new PubTypes();

export type FormattedReferenceField = {
  name: keyof Reference | 'type';
  label: string;
  value: any;
};

const filterUrls = (urls?: string[]) => {
  if (!urls) {
    return [];
  }

  return urls.filter(url => {
    if (url.match(/ncbi/i) && !url.match(/\/books\/NBK/i)) return false;
    if (url.match(/pubmed/i)) return false;
    if (url.match(/dx\.doi\.org/i)) return false;

    return true;
  });
};

const renderUrl = (
  referenceId: string,
  fieldLabel: string,
  urls: string[],
  uncleandeUrls: string[],
  defaultProps: React.HTMLAttributes<HTMLSpanElement>,
  proxylist?: string
) => {
  return (
    <React.Fragment key={`${referenceId}-${fieldLabel}`}>
      <span className="gridReference_contentPanel_details_fieldLabel">{fieldLabel}</span>
      <span className="gridReference_contentPanel_details_fieldValue" {...defaultProps}>
        {urls.map((url, index) => {
          let uncleanedUrl = uncleandeUrls[index];
          if (uncleanedUrl) {
            uncleanedUrl = PP.DOMPurify.escapeHTML(uncleanedUrl.replace(/^[\r\n\t\s]+/, '').replace(/\s.*/, ''), ['"']);
          } else {
            uncleanedUrl = '';
          }
          return (
            <div key={uuid()} className="gridReference_contentPanel_details_fieldValue_url">
              <span className="-with-ellipsis">{PP.DOMPurify.escapeHTML(url, ['"'])}</span>
              <a
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  const proxy = proxylist ? PP.Utils.decodeProxyString(proxylist).filter(p => p.active) : null;
                  const proxifiedUrl =
                    proxy && proxy.length > 0
                      ? PP.crawling.Proxy.getLoginUrl(proxy[0].url, uncleanedUrl)
                      : uncleanedUrl;
                  window.open(proxifiedUrl, '_blank');
                }}
                href={uncleanedUrl}
              >
                <Icon name="open-external" size={17} />
              </a>
            </div>
          );
        })}
      </span>
    </React.Fragment>
  );
};

const renderAffiliation = (
  referenceId: string,
  fieldLabel: string,
  affiliation: string,
  defaultProps: React.HTMLAttributes<HTMLSpanElement>
) => {
  const affiliationRegEx = /((([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})))/g;
  const hasMail = affiliation.match(affiliationRegEx);

  return (
    <React.Fragment key={`${referenceId}-${fieldLabel}`}>
      <span className="gridReference_contentPanel_details_fieldLabel">{fieldLabel}</span>
      <span className="gridReference_contentPanel_details_fieldValue" {...defaultProps}>
        {/* Add e-mail link if affiliation contains an e-mail */}
        {hasMail
          ? affiliation.split(/\s/).map((str, index) => {
              if (hasMail.includes(str)) {
                return (
                  <>
                    {index !== 0 && ' '}
                    <span className="gridReference_contentPanel_details_fieldValue_mail">
                      {str}
                      <a href={`mailto:${str}`} target="_blank" rel="noopener noreferrer">
                        <Icon name="reply" size={17} />
                      </a>
                    </span>
                  </>
                );
              }
              return index === 0 ? str : ` ${str}`;
            })
          : affiliation}
      </span>
    </React.Fragment>
  );
};

const renderString = (
  referenceId: string,
  fieldLabel: string,
  fieldValue: string | number,
  defaultProps: React.HTMLAttributes<HTMLSpanElement>
) => (
  <React.Fragment key={`${referenceId}-${fieldLabel}`}>
    <span className="gridReference_contentPanel_details_fieldLabel">{fieldLabel}</span>
    <span className="gridReference_contentPanel_details_fieldValue" {...defaultProps}>
      {fieldValue}
    </span>
  </React.Fragment>
);

const renderArray = (
  referenceId: string,
  fieldLabel: string,
  fieldValue: any[],
  defaultProps: React.HTMLAttributes<HTMLSpanElement>
) => (
  <React.Fragment key={`${referenceId}-${fieldLabel}`}>
    <span className="gridReference_contentPanel_details_fieldLabel">{fieldLabel}</span>
    <span className="gridReference_contentPanel_details_fieldValue" {...defaultProps}>
      {fieldValue.map(value => (
        <div key={uuid()}>{value}</div>
      ))}
    </span>
  </React.Fragment>
);

type RenderersMap = {
  string: (
    referenceId: string,
    fieldLabel: string,
    fieldValue: string | number,
    defaultProps: React.HTMLAttributes<HTMLSpanElement>
  ) => React.ReactNode;
  array: (
    referenceId: string,
    fieldLabel: string,
    fieldValue: any[],
    defaultProps: React.HTMLAttributes<HTMLSpanElement>
  ) => React.ReactNode;
  affiliation: (
    referenceId: string,
    fieldLabel: string,
    affiliation: string,
    defaultProps: React.HTMLAttributes<HTMLSpanElement>
  ) => React.ReactNode;
  url: (
    referenceId: string,
    fieldLabel: string,
    urls: string[],
    uncleandeUrls: string[],
    defaultProps: React.HTMLAttributes<HTMLSpanElement>,
    proxylist?: string
  ) => React.ReactNode;
};

// eslint-disable-next-line import/prefer-default-export
export const renderReferenceFieldsAndValues = (
  reference: Reference,
  renderFields: boolean,
  ignoreFields: (keyof Reference)[] = [],
  proxylist?: string,
  eventsCallbacks: {
    enter: (e: React.MouseEvent<HTMLSpanElement>) => void;
    leave: (e: React.MouseEvent<HTMLSpanElement>) => void;
  } = {
    enter: () => {},
    leave: () => {},
  },
  renderers: RenderersMap = {
    string: renderString,
    array: renderArray,
    affiliation: renderAffiliation,
    url: renderUrl,
  }
): FormattedReferenceField[] | React.ReactNode[] => {
  const sanitizedReference = PP.DOMPurify.purifyPubObject(reference);

  const pubFields = PP.library.PublicationFields.getFieldsForPubType(reference.pubtype).map(field => {
    // eslint-disable-next-line no-underscore-dangle
    const { category, pos } = pubTypes._resolveField(field.name, {}, [[], []], 'en', 'paperpile');

    return { ...field, category, pos };
  });

  const categoriesWithFields = pubTypes.getCategories('en', 'paperpile').reduce((previous, category) => {
    // add fields to category and sort them
    const categoryFields = pubFields.filter(field => field.category === category.id).sort((a, b) => a.pos - b.pos);

    return { ...previous, [category.id]: categoryFields };
  }, {} as Record<'what' | 'ids' | 'type' | 'where', Field[]>);

  const fields = [
    ...categoriesWithFields.type,
    ...categoriesWithFields.what,
    ...categoriesWithFields.where,
    ...categoriesWithFields.ids,
  ];

  let formattedFields: FormattedReferenceField[] = [
    {
      name: 'type',
      label: i18n.t('grid:referenceDetails:typeLabel'),
      value: getReferenceTypeLabel(reference),
    },
  ];

  let renderedFields: React.ReactNode[] = [];

  let defaultProps: React.HTMLAttributes<HTMLSpanElement> = {};
  if (renderFields) {
    defaultProps = {
      onClick: e => e.stopPropagation(),
      onMouseDown: e => e.stopPropagation(),
      onMouseEnter: eventsCallbacks.enter,
      onMouseLeave: eventsCallbacks.leave,
    };
  }

  for (const field of fields) {
    if (ignoreFields.includes(field.name)) {
      continue;
    }

    const fieldLabel = field.shortLabel ? field.shortLabel : field.label;
    if (field.dataType === 'author') {
      const author = reference[field.name as keyof Reference] as AuthorType;
      if (author && Array.isArray(author) && author.length > 0) {
        const formatParams = {
          delim: ', ',
          output: 'display',
        };

        const authorString = PP.library.Author.toString(author, formatParams);

        formattedFields = [
          ...formattedFields,
          {
            name: field.name,
            label: fieldLabel,
            value: authorString,
          },
        ];

        if (renderFields) {
          renderedFields = [...renderedFields, renderers.string(reference._id, fieldLabel, authorString, defaultProps)];
        }
      }
    } else if (field.dataType === 'date') {
      const date = reference[field.name as keyof Reference] as DateType;
      if (PP.library.Date.hasValue(date)) {
        const dateString = PP.library.Date.toString(date);

        formattedFields = [
          ...formattedFields,
          {
            name: field.name,
            label: fieldLabel,
            value: dateString,
          },
        ];

        if (renderFields) {
          renderedFields = [...renderedFields, renderers.string(reference._id, fieldLabel, dateString, defaultProps)];
        }
      }
    } else if (field.name === 'url') {
      const filteredUrls = filterUrls(sanitizedReference.url);
      const uncleanedFilteredUrls = filterUrls(reference.url);
      if (filteredUrls.length > 0) {
        formattedFields = [
          ...formattedFields,
          {
            name: field.name,
            label: fieldLabel,
            value: filteredUrls,
          },
        ];

        if (renderFields) {
          renderedFields = [
            ...renderedFields,
            renderers.url(reference._id, fieldLabel, filteredUrls, uncleanedFilteredUrls, defaultProps, proxylist),
          ];
        }
      }
    } else if (field.name === 'affiliation') {
      if (reference.affiliation) {
        formattedFields = [
          ...formattedFields,
          {
            name: field.name,
            label: fieldLabel,
            value: reference[field.name as keyof Reference],
          },
        ];

        if (renderFields) {
          renderedFields = [
            ...renderedFields,
            renderers.affiliation(reference._id, fieldLabel, reference.affiliation, defaultProps),
          ];
        }
      }
    } else if (
      ['pmid', 'doi', 'associated_doi', 'pmc', 'arxivid', 'lccn', 'mr', 'zbl'].includes(field.name) &&
      typeof reference[field.name as keyof Reference] !== 'undefined' &&
      reference[field.name as keyof Reference] !== null
    ) {
      let url;
      if (field.name === 'pmid') {
        url = Publication.getPubMedLink(reference);
      } else if (field.name === 'doi') {
        url = Publication.getDoiLink(reference);
      } else if (field.name === 'associated_doi') {
        url = Publication.getDoiLink(reference);
      } else if (field.name === 'pmc') {
        url = Publication.getPMCLink(reference);
      } else if (field.name === 'arxivid') {
        url = Publication.getArxivLink(reference);
      } else if (field.name === 'lccn') {
        url = Publication.getLCCNLink(reference);
      } else if (field.name === 'mr') {
        url = Publication.getMRLink(reference);
      } else if (field.name === 'zbl') {
        url = Publication.getZBLLink(reference);
      }
      url = PP.DOMPurify.escapeHTML(url, ['"']);

      formattedFields = [
        ...formattedFields,
        {
          name: field.name,
          label: fieldLabel,
          value: reference[field.name as keyof Reference],
        },
      ];

      if (renderFields) {
        renderedFields = [
          ...renderedFields,
          // @ts-ignore
          renderers.url(reference._id, fieldLabel, [reference[field.name]], [url], defaultProps, proxylist),
        ];
      }
    } else if (typeof reference[field.name as keyof Reference] !== 'undefined') {
      const fieldValue = reference[field.name as keyof Reference];
      let formattedFieldValue;

      if (typeof fieldValue === 'number' || typeof fieldValue === 'string') {
        formattedFieldValue = fieldValue;
        if (renderFields) {
          renderedFields = [...renderedFields, renderers.string(reference._id, fieldLabel, fieldValue, defaultProps)];
        }
      } else if (field.dataType === 'array' && Array.isArray(fieldValue) && fieldValue.length > 0) {
        formattedFieldValue = fieldValue.join(',');
        if (renderFields) {
          // @ts-ignore
          renderedFields = [...renderedFields, renderers.array(reference._id, fieldLabel, fieldValue, defaultProps)];
        }
      } else if (field.dataType === 'object' && !Array.isArray(fieldValue) && fieldValue !== null) {
        formattedFieldValue = PP.Utils.objectToHtml(fieldValue);
        if (renderFields) {
          renderedFields = [
            ...renderedFields,
            renderers.string(reference._id, fieldLabel, PP.Utils.objectToHtml(fieldValue), defaultProps),
          ];
        }
      }

      formattedFields = [
        ...formattedFields,
        {
          name: field.name,
          label: fieldLabel,
          value: formattedFieldValue,
        },
      ];
    }
  }

  return renderFields
    ? [
        renderString(
          reference._id,
          i18n.t('grid:referenceDetails:typeLabel'),
          getReferenceTypeLabel(reference),
          defaultProps
        ),
        ...renderedFields,
        reference.created
          ? renderString(
              reference._id,
              i18n.t('grid:referenceDetails:createdLabel'),
              PP.library.Date.toString(reference.created),
              defaultProps
            )
          : undefined,
      ]
    : formattedFields;
};

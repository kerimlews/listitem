import { css } from 'pp-ui/pp-styled-components';
import { fontSizes, fontWeights, lineHeights } from 'pp-ui/v2/fundamentals/typography/Text.theme';
import buttonTheme from 'pp-ui/v2/basic/buttons/Button.theme';
import iconButtonTheme from 'pp-ui/v2/basic/buttons/Icon.theme';
import referenceTheme, { variables as referenceVariables } from 'pp-ui/v2/basic/misc/reference/Reference.theme';

import { themeMapper, uiConstants } from 'pp-ui/v2/theme';

const {
  colors: { light },
} = uiConstants;

const theme = {
  referenceActiveBorderColor: themeMapper({
    'webapp-light': light.blue[800],
  }),
  referenceDraggingOverBackgroundColor: themeMapper({
    'webapp-light': light.blue[50],
  }),
  referenceSeparatorColor: themeMapper({
    'webapp-light': light.gray[400],
  }),
  attachmentsPanelColor: themeMapper({
    'webapp-light': light.gray[500],
  }),
  attachmentsPanelHoverColor: themeMapper({
    'webapp-light': light.gray[600],
  }),
  attachmentsPanelFileColor: themeMapper({
    'webapp-light': light.blue[600],
  }),
  attachmentsPanelInfoColor: themeMapper({
    'webapp-light': light.gray[400],
  }),
  folders: {
    textColor: themeMapper({
      'webapp-light': light.gray[600],
    }),
    iconColor: themeMapper({
      'webapp-light': light.gray[400],
    }),
    labelColor: themeMapper({
      'webapp-light': light.gray[500],
    }),
  },
  notes: {
    borderColor: themeMapper({
      'webapp-light': light.gray[300],
    }),
    textColor: themeMapper({
      'webapp-light': light.gray[900],
    }),
    hintTextColor: themeMapper({
      'webapp-light': light.gray[500],
    }),
    activeBackgroundColor: themeMapper({
      'webapp-light': 'white',
    }),
  },
};

export default theme;

// eslint-disable-next-line import/prefer-default-export
export const variables = css`
  --small-font-size: ${fontSizes.small}px;
  --small-line-height: ${lineHeights.small}px;
  --medium-font-size: ${fontSizes.medium}px;
  --medium-line-height: ${lineHeights.medium}px;
  --regular-font-weight: ${fontWeights.regular};
  --medium-font-weight: ${fontWeights.medium};
  --semi-font-weight: ${fontWeights['semi-bold']};

  --icon-button-color: ${iconButtonTheme['neutral-1'].color};
  --icon-button-hover-background-color: ${iconButtonTheme['neutral-1'].hoverBackground};

  --reference-active-border-color: ${theme.referenceActiveBorderColor};
  --reference-dragging-over-background-color: ${theme.referenceDraggingOverBackgroundColor};
  --reference-separator-color: ${theme.referenceSeparatorColor};
  --reference-search-highlight-background-color: ${referenceTheme.highlightBackgroundColor};

  --reference-icon-button-color: ${buttonTheme['neutral-1'](false).icon.fill};
  --reference-icon-button-disabled-color: ${buttonTheme['neutral-1'](true).icon.fill};
  --reference-icon-button-disabled-opacity: ${buttonTheme['neutral-1'](true).icon.opacity};

  --reference-pdf-button-font-size: ${fontSizes.medium}px;
  --reference-pdf-button-line-height: ${lineHeights.medium}px;
  --reference-pdf-button-font-weight: ${fontWeights['semi-bold']};
  --reference-pdf-button-border: ${buttonTheme['neutral-1'](false).wrapper.border};
  --reference-pdf-button-box-shadow: ${buttonTheme['neutral-1'](false).wrapper.enabledBoxShadow};
  --reference-pdf-button-opacity: ${buttonTheme['neutral-1'](false).icon.opacity};
  --reference-pdf-button-fill: ${buttonTheme['neutral-1'](false).icon.fill};
  --reference-pdf-button-color: ${buttonTheme['neutral-1'](false).label.color};
  --reference-pdf-button-disabled-opacity: ${buttonTheme['neutral-1'](true).icon.opacity};
  --reference-pdf-button-disabled-fill: ${buttonTheme['neutral-1'](true).icon.fill};
  --reference-pdf-button-hover-background: ${buttonTheme['primary-2'](false).wrapper.backgroundColor};
  --reference-pdf-button-hover-border-color: ${buttonTheme['primary-2'](false).wrapper.border};
  --reference-pdf-button-hover-color: ${buttonTheme['primary-2'](false).label.color};

  --reference-attachments-panel-color: ${theme.attachmentsPanelColor};
  --reference-attachments-panel-hover-color: ${theme.attachmentsPanelHoverColor};
  --reference-attachments-panel-file-color: ${theme.attachmentsPanelFileColor};
  --reference-attachments-panel-info-color: ${theme.attachmentsPanelInfoColor};
  --reference-attachments-panel-font-weight: ${fontWeights['semi-bold']};
  --reference-attachment-panel-action-color: ${buttonTheme['neutral-1'](false).icon.fill};

  --reference-folder-text-color: ${theme.folders.textColor};
  --reference-folder-icon-color: ${theme.folders.iconColor};
  --reference-folder-label-color: ${theme.folders.labelColor};

  --reference-notes-border-color: ${theme.notes.borderColor};
  --reference-notes-text-color: ${theme.notes.textColor};
  --reference-notes-hint-text-color: ${theme.notes.hintTextColor};
  --reference-notes-active-background-color: ${theme.notes.activeBackgroundColor};
  ${referenceVariables}
`;

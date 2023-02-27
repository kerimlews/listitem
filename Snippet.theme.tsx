import { css } from 'pp-ui/pp-styled-components';

import { themeMapper, uiConstants } from 'pp-ui/v2/theme';

const {
  colors: { light },
} = uiConstants;

const theme = {
  labelColor: themeMapper({
    'webapp-light': light.gray[500],
  }),
  hoverBackgroundColor: themeMapper({
    'webapp-light': light.gray[200],
  }),
};

export default theme;

// eslint-disable-next-line import/prefer-default-export
export const variables = css`
  --reference-snippet-label-color: ${theme.labelColor};
  --reference-snippet-hover-background-color: ${theme.hoverBackgroundColor};
`;

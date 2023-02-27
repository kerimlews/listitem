import { themeMapper, uiConstants } from 'pp-ui/v2/theme';
import { fontSizes, fontWeights, lineHeights } from 'pp-ui/v2/fundamentals/typography/Text.theme';
import { css } from 'styled-components';

const {
  colors: { light, dark },
} = uiConstants;

const theme = {
  borderColor: themeMapper({
    'webapp-light': light.gray[300],
  }),
  labelColor: themeMapper({
    'webapp-light': light.gray[500],
  }),
  iconColor: themeMapper({
    'webapp-light': light.gray[300],
  }),
  missingFieldsColor: themeMapper({
    'webapp-light': dark.red[300],
    'webapp-dark': dark.red[300],
  }),
};

export default theme;

export const variables = css`
  --reference-incomplete-menu-color: ${theme.labelColor};
  --reference-incomplete-menu-icon-color: ${theme.iconColor};
  --reference-incomplete-menu-border-color: ${theme.borderColor};
  --reference-incomplete-menu-font-size: ${fontSizes.small}px;
  --reference-incomplete-menu-line-height: ${lineHeights.small}px;
  --reference-incomplete-menu-font-weight: ${fontWeights.medium};
`;

import { themeMapper, uiConstants } from 'pp-ui/v2/theme';

const {
  colors: { light },
} = uiConstants;

const theme = {
  progressColor: themeMapper({
    'webapp-light': light.gray[400],
  }),
  progressIconColor: themeMapper({
    'webapp-light': light.gray[400],
  }),
  resultColor: themeMapper({
    'webapp-light': light.gray[400],
  }),
  resultIconColor: themeMapper({
    'webapp-light': light.gray[400],
  }),
  resultHoverColor: themeMapper({
    'webapp-light': light.gray[500],
  }),
};

export default theme;

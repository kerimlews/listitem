import { themeMapper, uiConstants } from 'pp-ui/v2/theme';

const {
  colors: { light },
} = uiConstants;

const theme = {
  nameColor: themeMapper({
    'webapp-light': light.gray[100],
    'webapp-dark': light.gray[100],
  }),
  timeColor: themeMapper({
    'webapp-light': light.gray[500],
    'webapp-dark': light.gray[500],
  }),
};

export default theme;

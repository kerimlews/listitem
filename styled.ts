import { textTheme } from 'pp-ui/ts/webapp';

import styled from 'pp-ui/pp-styled-components';

import theme from './Reference.theme';

// eslint-disable-next-line import/prefer-default-export
export const LinkButton = styled.button.attrs({ type: 'button' })`
  padding: 0;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: ${theme.attachmentsPanelColor};
  border-left: 1px solid ${theme.attachmentsPanelColor};
  padding: 0 9px;

  &:first-of-type {
    border-left: none;
  }

  &:hover {
    color: ${theme.attachmentsPanelHoverColor};
  }
  ${textTheme.small.normal}
`;

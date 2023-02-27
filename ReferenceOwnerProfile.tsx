import React, { useEffect, useState } from 'react';
import ReactTimeAgo from 'react-time-ago';
import styled from 'pp-ui/pp-styled-components';
import Tooltip from 'pp-ui/v2/basic/misc/Tooltip';
import Icon from 'pp-ui/v2/fundamentals/icons/Icon';
import textTheme from 'pp-ui/v2/fundamentals/typography/Text.theme';

import { useTranslation } from 'react-i18next';
import { Profiles } from 'pp-shared/dist/src/types/backend/index';

import dataClient from '../../dataClient';

import theme from './ReferenceOwnerProfile.theme';

type Props = {
  showOnlyName?: boolean;
  time?: number;
  ownerId?: string;
};

const TooltipContent = styled.div`
  display: grid;
  grid-template-rows: auto auto;
  text-align: left;
`;

const Name = styled.div`
  color: ${theme.nameColor};
  ${textTheme.medium.medium}
`;

const Time = styled.time`
  color: ${theme.timeColor};
  ${textTheme.medium.small}
`;

const ReferenceOwnerProfile: React.FC<Props> = ({ ownerId, time, showOnlyName }) => {
  const [owner, setOwner] = useState<Profiles.Schema>();
  const { t, i18n } = useTranslation('grid');

  useEffect(() => {
    const getOwner = async (id: string) => {
      const ownerProfile = await dataClient.forLibrary().getProfiles([id]);
      setOwner(ownerProfile[0]);
    };
    if (ownerId) getOwner(ownerId);
  }, [ownerId]);
  return (
    <div className="gridReference_profile">
      <Tooltip
        component={
          <TooltipContent>
            <Name>
              {showOnlyName
                ? owner?.google_name
                : t('referenceOwnerProfile.inLibraryTooltip', { name: owner?.google_given_name || owner?.google_name })}
            </Name>
            {typeof time !== 'undefined' && (
              <ReactTimeAgo
                component={({ date, children }) => {
                  return <Time dateTime={date}>{`${t('referenceOwnerProfile.addedTooltip')} ${children}`}</Time>;
                }}
                date={new Date(time * 1000)}
                locale={i18n.language}
              />
            )}
          </TooltipContent>
        }
        disabled={!owner}
        placement="bottom"
      >
        {owner?.google_photo_url ? (
          <img className="gridReference_profile_image" src={owner?.google_photo_url} alt="img" />
        ) : (
          <div className="gridReference_profile_placeholder">
            <Icon name="user" size={20} />
          </div>
        )}
      </Tooltip>
    </div>
  );
};

export default React.memo(ReferenceOwnerProfile);

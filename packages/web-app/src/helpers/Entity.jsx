import React from 'react';
import { styled } from '@mui/material/styles';
import {
  bibliographyIcon,
  entranceIcon,
  organizationIcon,
  caverIcon,
  massifIcon
} from '../assets/icons';

export const EntityIcon = styled('img')`
  height: 30px;
  margin-right: 10px;
  width: 30px;
`;

const EntityTitle = styled('div')`
  font-size: 1.5rem;
  white-space: nowrap;
  margin: 0;
`;

const EntityId = styled('i')`
  font-size: 1rem;
  color: #4f4f4ff2;
`;

const EntitySubtitle = styled('div')`
  font-size: 1.2rem;
  white-space: nowrap;
  margin: 0;
`;

export const nomelizeSearchEntity = option => {
  let iconSrc;
  let title = option.name; // Default for all entities
  let subtitle = '';
  // eslint-disable-next-line no-underscore-dangle
  switch (option._type) {
    case 'persons':
      if (!option.name && !option.surname) {
        title = option.nickname;
      } else {
        title = '';
        if (option.name) title = option.name;
        if (option.surname) title += ` ${option.surname}`;
        title = title.trim();
        if (title !== option.nickname) subtitle = option.nickname;
      }

      iconSrc = caverIcon;
      break;

    case 'documents': {
      iconSrc = bibliographyIcon;
      title = `[${option.type}] ${option.title}`;
      const maxSubTitleLength = Math.max((title.length - 3) * 1.2, 80);
      subtitle = (option.description ?? '').slice(0, maxSubTitleLength);
      if (option.description?.length > maxSubTitleLength) subtitle += '...';
      break;
    }

    case 'caves':
    case 'entrances': {
      iconSrc = entranceIcon;
      subtitle = option.region ?? '';
      const caveInfo = [];
      if (option.cave?.depth) caveInfo.push(`↕ ${option.cave?.depth}m`);
      if (option?.depth) caveInfo.push(`↕ ${option?.depth}m`);
      if (option.cave?.length) caveInfo.push(`↔ ${option.cave?.length}m`);
      if (option?.length) caveInfo.push(`↔ ${option?.length}m`);
      if (caveInfo.length !== 0)
        subtitle += `${subtitle.length === 0 ? '' : ', '}${caveInfo.join(' ')}`;
      break;
    }

    case 'organizations':
      iconSrc = organizationIcon;
      break;

    case 'massifs':
      iconSrc = massifIcon;
      break;

    default:
      break;
  }
  return { iconSrc, title, subtitle, id: option.id };
};

export const entityOptionForSelector = (props, option) => {
  const { iconSrc, title, subtitle, id } = nomelizeSearchEntity(option);
  const { key, ...otherProps } = props;
  return (
    <li key={key || `${option._type}-${id}`} {...otherProps}>
      {iconSrc && (
        <EntityIcon src={iconSrc} alt={`${option.type} icon`} />
      )}
      <div>
        <EntityTitle>
          {title} <EntityId>{id}</EntityId>
        </EntityTitle>
        <EntitySubtitle>{subtitle}</EntitySubtitle>
      </div>
    </li>
  );
};

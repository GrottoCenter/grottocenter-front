import React from 'react';
import { styled } from '@mui/material/styles';

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
  let iconName;
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

      iconName = 'caver.svg';
      break;

    case 'documents': {
      iconName = 'bibliography.svg';
      title = `[${option.type}] ${option.title}`;
      const maxSubTitleLength = Math.max((title.length - 3) * 1.2, 80);
      subtitle = (option.description ?? '').slice(0, maxSubTitleLength);
      if (option.description?.length > maxSubTitleLength) subtitle += '...';
      break;
    }

    case 'caves':
    case 'entrances': {
      iconName = 'entry.svg';
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
      iconName = 'club.svg';
      break;

    case 'massifs':
      iconName = 'massif.svg';
      break;

    default:
      break;
  }
  return { iconName, title, subtitle, id: option.id };
};

export const entityOptionForSelector = (props, option) => {
  const { iconName, title, subtitle, id } = nomelizeSearchEntity(option);
  const { key, ...otherProps } = props;
  return (
    <li key={key} {...otherProps}>
      {iconName && (
        <EntityIcon src={`/images/${iconName}`} alt={`${option.type} icon`} />
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

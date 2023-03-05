import React from 'react';
import styled from 'styled-components';

//
//
// H E L P E R - F U N C T I O N S
//
//

export const isMappable = entity => entity.latitude && entity.longitude;

const EntityIcon = styled.img`
  height: 30px;
  margin-right: 10px;
  width: 30px;
`;

const EntityTitle = styled.div`
  font-size: 1.5rem;
  white-space: nowrap;
  margin: 0;
`;

const EntitySubtitle = styled.div`
  font-size: 1.2rem;
  white-space: nowrap;
  margin: 0;
`;

export const entityOptionForSelector = option => {
  let iconName;
  let title = option.name; // Default for all entities
  let subtitle = '';
  switch (option.type) {
    case 'caver':
      if (!option.name && !option.surname) {
        title = option.nickname;
      } else if (option.name) {
        title = option.name;
        if (option.surname) {
          title += ` ${option.surname.toUpperCase()}`;
        }
      } else {
        title = option.surname.toUpperCase();
      }

      iconName = 'caver.svg';
      break;

    case 'document-collection':
    case 'document-issue':
    case 'document': {
      iconName = 'bibliography.svg';
      title = `[${option.documentType.name}] ${option.name}`;
      const maxSubTitleLength = Math.max((title.length - 3) * 1.2, 80);
      subtitle = (option.description ?? '').slice(0, maxSubTitleLength);
      if (option.description?.length > maxSubTitleLength) subtitle += '...';
      break;
    }

    case 'cave':
    case 'entrance': {
      iconName = 'entry.svg';
      subtitle = option.region ?? '';
      const caveInfo = [];
      if (option.cave?.depth) caveInfo.push(`↕ ${option.cave?.depth}m`);
      if (option.cave?.length) caveInfo.push(`↔ ${option.cave?.length}m`);
      if (caveInfo.length !== 0)
        subtitle += `${subtitle.length === 0 ? '' : ', '}${caveInfo.join(' ')}`;
      break;
    }

    case 'grotto':
      iconName = 'club.svg';
      break;

    case 'massif':
      iconName = 'massif.svg';
      break;

    case 'language':
      title = option.refName;
      break;

    default:
      break;
  }

  return (
    <>
      {iconName && (
        <EntityIcon src={`/images/${iconName}`} alt={`${option.type} icon`} />
      )}
      <div>
        <EntityTitle>{title}</EntityTitle>
        <EntitySubtitle>{subtitle}</EntitySubtitle>
      </div>
    </>
  );
};

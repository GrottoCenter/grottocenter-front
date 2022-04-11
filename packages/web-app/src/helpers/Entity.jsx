import React from 'react';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import Translate from '../components/common/Translate';

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

const EntityLabel = styled.span`
  font-size: 1.5rem;
  white-space: nowrap;
`;

// The hightlighted words are inside <em> tags.
const HighlightText = withTheme(styled.span`
  color: #888;
  font-size: 1.1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: baseline;
  white-space: nowrap;
  em {
    background-color: ${props => props.theme.palette.accent1Color};
    color: white;
    font-style: normal;
    font-weight: bold;
  }
`);

const HighlightTextKey = styled.span`
  color: #888;
  font-size: 1.1rem;
  font-weight: bold;
  margin-left: 10px;
  margin-right: 2px;
  vertical-align: baseline;
  white-space: nowrap;
`;

export const entityOptionForSelector = option => {
  const highlights = [];
  if (option.highlights) {
    Object.keys(option.highlights).forEach(key => {
      highlights.push({ [key]: option.highlights[key].join(' [...] ') });
    });
  }

  let iconName;
  let textToDisplay = option.name; // Default for all entities
  switch (option.type) {
    case 'caver':
      if (!option.name && !option.surname) {
        textToDisplay = option.nickname;
      } else if (option.name) {
        textToDisplay = option.name;
        if (option.surname) {
          textToDisplay += ` ${option.surname.toUpperCase()}`;
        }
      } else {
        textToDisplay = option.surname.toUpperCase();
      }

      iconName = 'caver.svg';
      break;
    case 'document-collection':
    case 'document-issue':
    case 'document':
      textToDisplay = `${option.name} [${option.documentType.name}]`;
      iconName = 'bibliography.svg';
      break;
    case 'cave':
    case 'entrance':
      iconName = 'entry.svg';
      break;
    case 'grotto':
      iconName = 'club.svg';
      break;

    case 'massif':
      iconName = 'massif.svg';
      break;

    // TODO : language icon
    // case 'language':

    default:
      break;
  }

  return (
    <>
      {iconName && (
        <EntityIcon src={`/images/${iconName}`} alt={`${option.type} icon`} />
      )}
      <EntityLabel>{textToDisplay}</EntityLabel>

      {highlights.map(hl => {
        const key = Object.keys(hl)[0];
        return (
          <React.Fragment key={key}>
            <HighlightTextKey>
              <Translate>{key}</Translate>:
            </HighlightTextKey>
            <HighlightText
              dangerouslySetInnerHTML={{
                __html: `${hl[key]}`
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

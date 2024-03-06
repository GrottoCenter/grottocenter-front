import React from 'react';
import { useIntl } from 'react-intl';
import { propOr, map, pipe, join, head, isNil, reject, isEmpty } from 'ramda';
import UpdateIcon from '@mui/icons-material/Update';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';

const useMakeCustomCellRenders = () => {
  const { formatDate, formatMessage, formatTime } = useIntl();
  return [
    {
      id: 'modifiedDocJson',
      customRender: json =>
        isNil(json) ? <NewReleasesOutlinedIcon /> : <UpdateIcon />
    },
    {
      id: 'dateInscription',
      customRender: date =>
        date
          ? `${formatDate(new Date(date))} ${formatTime(new Date(date))}`
          : null
    },
    {
      id: 'dateValidation',
      customRender: date => (date ? formatDate(new Date(date)) : null)
    },
    {
      id: 'authors',
      customRender: pipe(
        map(propOr('', 'nickname')),
        reject(isEmpty),
        join(' - ')
      )
    },
    {
      id: 'author',
      customRender: v => v?.nickname ?? ''
    },
    {
      id: 'creator',
      customRender: v => v?.nickname ?? ''
    },
    {
      id: 'identifierType',
      customRender: v => v?.text ?? ''
    },
    {
      id: 'isValidated',
      customRender: isValidated =>
        formatMessage({ id: isValidated ? 'Yes' : 'No' })
    },
    {
      id: 'languages',
      customRender: pipe(
        map(propOr('', 'refName')),
        reject(isEmpty),
        join('; ')
      )
    },
    {
      id: 'license',
      customRender: v => v?.name ?? ''
    },
    {
      id: 'regions',
      customRender: pipe(map(propOr('', 'code')), reject(isEmpty), join('; '))
    },
    {
      id: 'subjects',
      customRender: v => v.map(e => e?.id).join('; ')
    },
    {
      id: 'library',
      customRender: propOr('', 'name')
    },
    {
      id: 'editor',
      customRender: propOr('', 'name')
    },
    {
      id: 'iso3166',
      customRender: v => v.map(e => e.iso).join(' - ')
    },
    {
      id: 'entrance',
      customRender: entrance =>
        `${formatMessage({ id: 'City' })}: ${propOr('', 'city', entrance)}`
    },
    {
      id: 'descriptions',
      customRender: pipe(head, propOr('', 'text'))
    },
    {
      id: 'intactDescriptions',
      customRender: pipe(head, propOr('', 'title'))
    },
    {
      id: 'titles',
      customRender: pipe(head, propOr('', 'text'))
    },
    {
      id: 'parent',
      customRender: parent =>
        !isNil(parent) &&
        !isNil(parent.refBbs) &&
        `${formatMessage({ id: 'BBS Reference' })}: ${propOr(
          '',
          'refBbs',
          parent
        )}`
    },
    {
      id: 'option',
      customRender: propOr('', 'name')
    },
    {
      id: 'authorizationDocument',
      customRender: pipe(propOr({}, 'titles'), head, propOr('', 'text'))
    },
    {
      id: 'files',
      customRender: pipe(
        map(propOr('', 'fileName')),
        reject(isEmpty),
        join(' - ')
      )
    }
  ];
};

export default useMakeCustomCellRenders;

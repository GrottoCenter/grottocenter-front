import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { isEmpty, pathOr } from 'ramda';

import Ratings from '../../Ratings';
import Duration from '../../../../common/Properties/Duration';
import GenericSnapshots from './GenericSnapshots';

function convertMinutes(totalMinutes) {
  const time = `${totalMinutes}`;
  if (time.includes(':')) return time;

  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  return `${hours}:${minutes}:00`;
}

const HalfSplitContainer = styled.div(
  ({ theme }) => `
    display: flex;
    flex-direction: column;
    ${theme.breakpoints.up('md')} {
      flex-direction: row;
    }
  `
);

const CommentSnapshots = ({ comment, previous }) => {
  const {
    body,
    aestheticism,
    caving,
    approach,
    interest,
    progression,
    access,
    eTUnderground,
    eTTrail
  } = comment;
  return (
    <>
      <GenericSnapshots data={{ body }} previous={previous} />
      <HalfSplitContainer>
        {!isEmpty(eTTrail) && (
          <Duration
            image="/images/time-to-go.svg"
            durationStr={convertMinutes(pathOr(eTTrail, ['minutes'], eTTrail))}
            title="Time to go"
          />
        )}
        {!isEmpty(eTUnderground) && (
          <Duration
            image="/images/underground_time.svg"
            durationStr={convertMinutes(
              pathOr(eTUnderground, ['minutes'], eTUnderground)
            )}
            title="Underground time"
          />
        )}
        <Ratings
          interest={aestheticism ?? interest}
          progression={caving ?? progression}
          access={approach ?? access}
          size="small"
        />
      </HalfSplitContainer>
    </>
  );
};

CommentSnapshots.propTypes = {
  comment: PropTypes.shape({
    body: PropTypes.string,
    aestheticism: PropTypes.string,
    caving: PropTypes.string,
    approach: PropTypes.string,
    interest: PropTypes.number,
    progression: PropTypes.number,
    access: PropTypes.number,
    eTUnderground: PropTypes.shape({
      minutes: PropTypes.number
    }),
    eTTrail: PropTypes.shape({
      minutes: PropTypes.number
    })
  }),
  previous: PropTypes.shape({
    body: PropTypes.string,
    aestheticism: PropTypes.string,
    caving: PropTypes.string,
    approach: PropTypes.string,
    interest: PropTypes.number,
    progression: PropTypes.number,
    access: PropTypes.number,
    eTUnderground: PropTypes.shape({
      minutes: PropTypes.number
    }),
    eTTrail: PropTypes.shape({
      minutes: PropTypes.number
    })
  })
};
export default CommentSnapshots;

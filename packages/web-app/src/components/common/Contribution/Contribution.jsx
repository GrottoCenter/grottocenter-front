import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Typography } from '@mui/material';
import Linkify from 'linkify-react';
import MultilinesTypography from '../MultilinesTypography';
import ContributionMetadata from './ContributionMetadata';
import authorType from '../../../types/author.type';
import linkifyOptions from '../../../helpers/linkifyOptions';

const languageType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    refName: PropTypes.string
  })
]);

const Contribution = ({
  author,
  body,
  dateInscription,
  reviewer,
  dateReviewed,
  language,
  withHours = false,
  isDeleted = false,
  isDeletedWithHeader = false,
  hideAttribution = false
}) => {
  const { formatMessage } = useIntl();

  let bodyStyle;
  if (isDeleted || isDeletedWithHeader)
    bodyStyle = { fontStyle: 'italic', opacity: 0.6 };
  return (
    <>
      {body && isDeletedWithHeader && (
        <Typography
          variant="body1"
          component="span"
          noWrap
          sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
          [{formatMessage({ id: 'deleted' })}]&nbsp;
        </Typography>
      )}
      {body && (
        <MultilinesTypography variant="body1" component="span" sx={bodyStyle}>
          <Linkify options={linkifyOptions}>{body}</Linkify>
        </MultilinesTypography>
      )}
      {!hideAttribution && (author || reviewer || language) && (
        <ContributionMetadata
          createdBy={author}
          createdAt={dateInscription}
          updatedBy={reviewer}
          updatedAt={dateReviewed}
          language={language}
          creationVerb="Posted"
          withHours={withHours}
        />
      )}
    </>
  );
};

Contribution.propTypes = {
  author: authorType,
  body: PropTypes.string,
  dateInscription: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.number
  ]),
  reviewer: authorType,
  dateReviewed: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string,
    PropTypes.number
  ]),
  language: languageType,
  withHours: PropTypes.bool,
  isDeleted: PropTypes.bool,
  isDeletedWithHeader: PropTypes.bool,
  hideAttribution: PropTypes.bool
};

export default Contribution;

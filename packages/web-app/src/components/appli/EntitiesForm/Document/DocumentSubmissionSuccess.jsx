import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import ReplayIcon from '@mui/icons-material/Replay';
import { styled } from '@mui/material/styles';

import Translate from '../../../common/Translate';

const CenteredBlock = styled('div')`
  text-align: center;
`;

const DocumentSubmissionSuccess = ({
  isArticle,
  isNewDocument,
  onSubmitAnotherArticle,
  onSubmitAnotherDocument,
  onFinish
}) => {
  const { formatMessage } = useIntl();

  return (
    <CenteredBlock>
      <Alert severity="success" variant="outlined">
        {isNewDocument
          ? `${formatMessage({
              id: 'Your document has been successfully submitted, thank you!'
            })} ${formatMessage({
              id: 'It will be verified by one of ours moderators.'
            })}`
          : formatMessage({ id: 'Document successfully updated.' })}
      </Alert>

      {isNewDocument && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            mt: 3
          }}>
          {isArticle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 760 }}>
              {formatMessage({
                id: 'Adding another article will preserve the parent document, publication date, editor and library.'
              })}
            </Typography>
          )}

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'center',
              gap: 1,
              width: '100%'
            }}>
            {isArticle && (
              <Button
                color="primary"
                onClick={onSubmitAnotherArticle}
                startIcon={<ReplayIcon />}
                variant="outlined"
                sx={{ width: { xs: '100%', sm: 'auto' } }}>
                <Translate>Add another article</Translate>
              </Button>
            )}
            <Button
              onClick={onSubmitAnotherDocument}
              variant="outlined"
              sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Translate>Add another document</Translate>
            </Button>
            <Button
              onClick={onFinish}
              variant="contained"
              sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <Translate>Finish</Translate>
            </Button>
          </Box>
        </Box>
      )}
    </CenteredBlock>
  );
};

DocumentSubmissionSuccess.propTypes = {
  isArticle: PropTypes.bool.isRequired,
  isNewDocument: PropTypes.bool.isRequired,
  onSubmitAnotherArticle: PropTypes.func.isRequired,
  onSubmitAnotherDocument: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired
};

export default DocumentSubmissionSuccess;

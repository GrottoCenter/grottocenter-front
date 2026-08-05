import { useIntl } from 'react-intl';
import { Box } from '@mui/material';

import { PersonPropTypes } from '@/types/person.type';
import SectionStack from '@/components/common/Layouts/SectionStack';
import ScrollableContent from '@/components/common/Layouts/Fixed/ScrollableContent';
import Alert from '@/components/common/Alert';
import DocumentsList from '@/components/common/DocumentsList/DocumentsList';
import PersonProperties from '@/components/common/Person/PersonProperties';

const AuthorBody = ({ person }) => {
  const { formatMessage } = useIntl();
  const nbDocuments = (person?.documents ?? []).length;

  return (
    <SectionStack>
      <ScrollableContent
        content={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert
              disableMargins
              severity="info"
              content={formatMessage({
                id: 'This person is a reference used to attribute documents. It is not a caver account.'
              })}
            />
            <PersonProperties person={person} />
          </Box>
        }
      />
      <ScrollableContent
        anchorId="documents"
        title={formatMessage({ id: 'Documents' })}
        count={nbDocuments}
        defaultExpanded={nbDocuments > 0}
        content={
          <DocumentsList
            documents={person.documents}
            emptyMessageComponent={
              <Alert
                severity="info"
                content={formatMessage({
                  id: 'This person has no documents listed yet.'
                })}
              />
            }
          />
        }
      />
    </SectionStack>
  );
};

AuthorBody.propTypes = {
  person: PersonPropTypes.isRequired
};

export default AuthorBody;

import { useIntl } from 'react-intl';
import { Box } from '@mui/material';

import { PersonPropTypes } from '@/types/person.type';
import SectionStack from '@/components/common/Layouts/SectionStack';
import ScrollableContent from '@/components/common/Layouts/Fixed/ScrollableContent';
import Alert from '@/components/common/Alert';
import DocumentReferences from '@/components/common/DocumentsList/DocumentReferences';
import PersonProperties from '@/components/common/Person/PersonProperties';

const AuthorBody = ({ person }) => {
  const { formatMessage } = useIntl();
  const nbDocuments = person.authoredCount ?? 0;

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
          <DocumentReferences
            documents={person.documents}
            totalCount={nbDocuments}
            searchFilter={{ 'authors.nickname': person.nickname }}
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

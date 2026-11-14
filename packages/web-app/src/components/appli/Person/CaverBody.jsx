import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Divider, Typography } from '@mui/material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import PermMediaOutlinedIcon from '@mui/icons-material/PermMediaOutlined';

import { PersonPropTypes } from '@/types/person.type';
import PageTabs from '@/components/common/Layouts/PageTabs';
import SectionStack from '@/components/common/Layouts/SectionStack';
import ScrollableContent from '@/components/common/Layouts/Fixed/ScrollableContent';
import Alert from '@/components/common/Alert';
import DocumentReferences, {
  DocumentReferencesSubheader
} from '@/components/common/DocumentsList/OrganizationDocumentReferences';
import EntitiesList from '@/components/common/entitiesList/EntitiesList';
import RelatedCaves from '@/components/common/RelatedCaves/RelatedCaves';
import PersonProperties from '@/components/common/Person/PersonProperties';
import ProfileAvatar from '@/components/common/ProfileAvatar';
import InfoSection from '@/components/common/InfoSection';

const CaverBody = ({ person, onRefresh }) => {
  const { formatMessage } = useIntl();
  const nbOrganizations = (person.organizations ?? []).length;
  const nbEntrances = (person.exploredEntrances ?? []).length;
  const nbDocuments = person.authoredCount ?? 0;

  const tabs = [
    {
      id: 'profil',
      label: formatMessage({ id: 'Profile' }),
      icon: <AccountCircleOutlinedIcon fontSize="small" />
    },
    {
      id: 'activities',
      label: formatMessage({ id: 'Caving practice' }),
      icon: <TravelExploreOutlinedIcon fontSize="small" />,
      count: nbOrganizations + nbEntrances,
      disabled: nbOrganizations + nbEntrances === 0
    },
    {
      id: 'documents',
      label: formatMessage({ id: 'Documents' }),
      icon: <PermMediaOutlinedIcon fontSize="small" />,
      count: nbDocuments,
      disabled: nbDocuments === 0
    }
  ];

  return (
    <PageTabs tabs={tabs}>
      {/* Tab Profil */}
      <div>
        <SectionStack>
          <ScrollableContent
            content={
              <Box data-testid="caver-profile">
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'minmax(0, 1fr)',
                      sm: 'auto minmax(0, 1fr)'
                    },
                    gap: { xs: 2, sm: 3 },
                    alignItems: 'start'
                  }}>
                  <ProfileAvatar
                    avatarUrl={person.avatarUrl}
                    name={person.nickname}
                    size={96}
                  />
                  <PersonProperties person={person} />
                </Box>
                {person.customMessage && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <InfoSection
                      component="h2"
                      title={formatMessage({ id: 'profile.about' })}>
                      <Typography
                        sx={{
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'anywhere',
                          maxWidth: '75ch'
                        }}>
                        {person.customMessage}
                      </Typography>
                    </InfoSection>
                  </>
                )}
              </Box>
            }
          />
        </SectionStack>
      </div>

      {/* Tab Caving practice */}
      <div>
        <SectionStack>
          <ScrollableContent
            anchorId="organizations"
            title={formatMessage({ id: 'Organizations' })}
            defaultExpanded={nbOrganizations > 0}
            count={nbOrganizations}
            content={
              <EntitiesList
                type="organization"
                entities={person.organizations}
                emptyMessage={
                  <Alert
                    severity="info"
                    content={formatMessage({
                      id: 'This person is not a member of any organization yet.'
                    })}
                  />
                }
              />
            }
          />
          <ScrollableContent
            anchorId="related-caves"
            title={formatMessage({ id: 'Explored entrances' })}
            defaultExpanded={nbEntrances > 0}
            count={nbEntrances}
            content={
              <RelatedCaves
                exploredEntrances={person.exploredEntrances}
                entityId={person.id}
                isOrganization={false}
                canManageCaves={false}
                onRefresh={onRefresh}
                userId={person.id}
              />
            }
          />
        </SectionStack>
      </div>

      {/* Tab Documents */}
      <div>
        <SectionStack>
          <ScrollableContent
            dense
            collapsible={false}
            title={formatMessage({ id: 'Documents' })}
            count={nbDocuments}
            subheader={
              <DocumentReferencesSubheader
                visibleCount={person.documents?.length ?? 0}
                totalCount={nbDocuments}
              />
            }
            content={
              <DocumentReferences
                documents={person.documents}
                totalCount={nbDocuments}
                searchFilter={{
                  'authors.nickname': person.nickname ?? ''
                }}
              />
            }
          />
        </SectionStack>
      </div>
    </PageTabs>
  );
};

CaverBody.propTypes = {
  person: PersonPropTypes.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default CaverBody;

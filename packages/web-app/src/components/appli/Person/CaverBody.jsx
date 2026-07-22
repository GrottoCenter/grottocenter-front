import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import PermMediaOutlinedIcon from '@mui/icons-material/PermMediaOutlined';

import { PersonPropTypes } from '../../../types/person.type';
import PageTabs from '../../common/Layouts/PageTabs';
import SectionStack from '../../common/Layouts/SectionStack';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import Alert from '../../common/Alert';
import DocumentsList from '../../common/DocumentsList/DocumentsList';
import EntitiesList from '../../common/entitiesList/EntitiesList';
import RelatedCaves from '../../common/RelatedCaves/RelatedCaves';
import PersonProperties from '../../common/Person/PersonProperties';

const CaverBody = ({ person, canEdit, onRefresh }) => {
  const { formatMessage } = useIntl();
  const nbOrganizations = (person.organizations ?? []).length;
  const nbEntrances = (person.exploredEntrances ?? []).length;
  const nbDocuments = (person.documents ?? []).length;

  const tabs = [
    {
      id: 'profil',
      label: formatMessage({ id: 'Profile' }),
      icon: <AccountCircleOutlinedIcon fontSize="small" />
    },
    {
      id: 'activities',
      label: formatMessage({ id: 'Activities' }),
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
            content={<PersonProperties person={person} canEdit={canEdit} />}
          />
        </SectionStack>
      </div>

      {/* Tab Activités */}
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
            collapsible={false}
            content={<DocumentsList documents={person.documents} />}
          />
        </SectionStack>
      </div>
    </PageTabs>
  );
};

CaverBody.propTypes = {
  person: PersonPropTypes.isRequired,
  canEdit: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default CaverBody;

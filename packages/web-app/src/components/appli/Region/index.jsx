import { lazy, Suspense, useMemo, useState } from 'react';
import Skeleton from '@mui/material/Skeleton';
import { useIntl } from 'react-intl';
import { Marker } from 'react-leaflet';
import { Button, Card, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { Download } from '@mui/icons-material';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { isMobile } from 'react-device-detect';
import { useUserProperties } from '@/hooks/useUserProperties';
import PageTabs from '@/components/common/Layouts/PageTabs';
import RecentChangesSection from '@/components/appli/RecentChanges/Section';
import { useRecentChangesTabs } from '@/hooks/useRecentChangesTabs';
import { getRegionIsoCode } from '@/utils/recentChanges';
import CustomIcon from '../../common/CustomIcon';

import Guidelines from '../Guidelines';
import StatisticsDataDashboard from '../StatisticsDataDashboard';
import CustomMapContainer from '../../common/Maps/common/MapContainer';
import PageContainer from '../../common/Layouts/PageContainer';
import PageHeader from '../../common/Layouts/PageHeader';
import SectionStack from '../../common/Layouts/SectionStack';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import FetchErrorState from '../../common/FetchErrorState';
import GuidelinePropTypes from '../../../types/guideline.type';
import { CoordinatesMarker } from '../../common/Maps/common/Markers/Components';
import {
  usePermissions,
  useStatisticsRegion,
  useSubscriptions,
  useScrollToHashOnLoad,
  useSharePage
} from '../../../hooks';
import AssociationSection from '../OrganizationAssociation';

const PdfExport = lazy(() => import('@/components/appli/PdfExport'));

const Region = ({
  canSubscribe,
  region,
  error,
  isPaused = false,
  isFetching = false,
  onRetry = null,
  onSubscribe,
  onUnsubscribe,
  countryId,
  regionId
}) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [hasOpenedPdfExport, setHasOpenedPdfExport] = useState(false);
  const userId = useUserProperties()?.id ?? null;
  const pdfEntity = useMemo(
    () => (region ? { ...region, id: regionId, countryId } : null),
    [region, regionId, countryId]
  );
  const permissions = usePermissions();
  const isLoading = isFetching && !region;
  const handleShare = useSharePage();

  const {
    isSubscribed: isSubscribedMethod,
    isRegionLoading: isSubscribeLoading
  } = useSubscriptions();
  const isSubscribed = region ? isSubscribedMethod(region.id) : false;

  const { data: dataRegion } = useStatisticsRegion(countryId, regionId);
  useScrollToHashOnLoad(dataRegion);

  const handleChangeSubscribe = () => {
    if (!isSubscribed) {
      onSubscribe();
    } else {
      onUnsubscribe();
    }
  };

  const position =
    region?.latitude && region?.longitude
      ? [region.latitude, region.longitude]
      : null;

  let SubscribeIcon = <CircularProgress size={20} />;
  if (!isSubscribeLoading) {
    SubscribeIcon = isSubscribed ? (
      <NotificationsActiveIcon />
    ) : (
      <NotificationsNoneIcon />
    );
  }

  const actions = region ? (
    <ResponsiveActions
      items={[
        {
          key: 'subscribe',
          icon: SubscribeIcon,
          label: formatMessage({
            id: isSubscribed ? 'Unsubscribe' : 'Subscribe'
          }),
          onClick: handleChangeSubscribe,
          color: isSubscribed ? 'secondary' : 'primary',
          hidden: !canSubscribe
        },
        {
          key: 'pdf',
          icon: <Download />,
          label: formatMessage({ id: 'pdf.download' }),
          onClick: () => {
            setHasOpenedPdfExport(true);
            setIsPdfExportOpen(true);
          }
        },
        {
          key: 'share',
          icon: <ShareIcon />,
          label: formatMessage({ id: 'Copy link' }),
          onClick: handleShare
        }
      ]}
    />
  ) : null;

  const subheader = (
    <Button
      variant="outlined"
      onClick={() => navigate(`/ui/countries/${countryId}`)}
      startIcon={<ArrowBackIcon />}
      size="small"
      color="primary">
      {formatMessage({ id: 'Back to Country' })}
    </Button>
  );

  const tabs = useRecentChangesTabs();

  return (
    <PageContainer>
      <div>
        <PageHeader
          title={region?.name ?? (isLoading ? undefined : '')}
          subheader={subheader}
          actions={actions}
        />
        {isLoading && (
          <SectionStack>
            <Card sx={{ p: 2 }}>
              <Skeleton height={150} />
            </Card>
          </SectionStack>
        )}
        {(error || isPaused) && (
          <SectionStack>
            <Card sx={{ p: 2 }}>
              <FetchErrorState
                error={error}
                isPaused={isPaused}
                onRetry={onRetry}
                messageId="Error, the region data you are looking for is not available."
              />
            </Card>
          </SectionStack>
        )}
        {region && (
          <PageTabs tabs={tabs}>
            <SectionStack>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={<CustomIcon type="entrance" size={24} />}
                onClick={() =>
                  navigate(
                    `/ui/countries/${countryId}/regions/${regionId}/entrances`
                  )
                }>
                {formatMessage({ id: 'Entrances list' })}
                {dataRegion?.nb_caves ? ` (${dataRegion.nb_caves})` : ''}
              </Button>
              {position && (
                <ScrollableContent
                  content={
                    <CustomMapContainer
                      center={position}
                      dragging={!isMobile}
                      forceCentering
                      scrollWheelZoom={false}
                      wholePage={false}
                      shouldChangeControlInFullscreen={false}
                      zoom={6}>
                      <Marker icon={CoordinatesMarker} position={position} />
                    </CustomMapContainer>
                  }
                />
              )}
              <StatisticsDataDashboard
                regionId={regionId}
                countryId={countryId}
                description={formatMessage({
                  id: 'Discover the numbers about this region and its caves.'
                })}
              />
              {(region.guidelines?.length > 0 || permissions.isAuth) && (
                <Guidelines
                  entityType="regions"
                  entityId={region.id}
                  entityName={region.name}
                  guidelines={region.guidelines}
                />
              )}
              <AssociationSection
                organizations={region?.organizations}
                entityType="region"
                entityId={regionId}
                parentEntityId={countryId}
                isLoading={isLoading}
              />
            </SectionStack>
            <RecentChangesSection
              scopeType="region"
              scopeId={getRegionIsoCode(countryId, regionId)}
            />
          </PageTabs>
        )}
        {hasOpenedPdfExport && pdfEntity && (
          <Suspense
            fallback={
              <CircularProgress
                aria-label={formatMessage({ id: 'Loading ...' })}
              />
            }>
            <PdfExport
              key={`${countryId}-${regionId}-${userId}-${permissions.isAdmin}`}
              entity={pdfEntity}
              entityType="region"
              statistics={dataRegion}
              isAdmin={permissions.isAdmin}
              open={isPdfExportOpen}
              onClose={() => setIsPdfExportOpen(false)}
            />
          </Suspense>
        )}
      </div>
    </PageContainer>
  );
};

Region.propTypes = {
  canSubscribe: PropTypes.bool,
  region: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    guidelines: PropTypes.arrayOf(GuidelinePropTypes),
    organizations: PropTypes.arrayOf(PropTypes.shape({}))
  }),
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  isPaused: PropTypes.bool,
  isFetching: PropTypes.bool,
  onRetry: PropTypes.func,
  onSubscribe: PropTypes.func,
  onUnsubscribe: PropTypes.func,
  countryId: PropTypes.string,
  regionId: PropTypes.string
};

export default Region;

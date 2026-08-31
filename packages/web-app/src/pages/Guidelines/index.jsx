import { useEffect, useRef, useState } from 'react';
import { Alert, Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import EntityTable from '@/components/common/EntityTable';
import CustomIcon from '@/components/common/CustomIcon';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
import { useGuidelines, useNotification } from '@/hooks';

const GuidelinesPage = () => {
  const { formatMessage } = useIntl();
  const { onError } = useNotification();
  const [pagination, setPagination] = useState({ limit: 20, skip: 0 });
  const { data, error, isFetching } = useGuidelines(pagination);
  const previousError = useRef(null);
  const guidelines = data?.guidelines ?? [];

  useEffect(() => {
    if (!error || error === previousError.current) return;
    const fallback = formatMessage({ id: 'guidelines.public.fetch_error' });
    let message = error.body?.message || error.message || fallback;
    if (error.status >= 500) message = fallback;
    else if (error.body?.code) {
      message = formatMessage({
        id: error.body.code,
        defaultMessage: error.body.message || fallback
      });
    }
    onError(message);
    previousError.current = error;
  }, [error, formatMessage, onError]);

  let content = (
    <EntityTable
      entityType="guidelines"
      pageSizeOptions={[20, 50, 100]}
      isLoading={isFetching}
      pageRows={guidelines}
      nbTotalRows={data?.totalCount ?? 0}
      onPageChange={(pageNumber, pageSize) =>
        setPagination({ limit: pageSize, skip: pageNumber * pageSize })
      }
    />
  );

  if (!isFetching && !error && guidelines.length === 0) {
    content = (
      <Alert severity="info">
        {formatMessage({ id: 'guidelines.public.empty' })}
      </Alert>
    );
  }

  return (
    <Layout
      title={formatMessage({ id: 'Guidelines' })}
      icon={<CustomIcon type="guidelines" size={32} />}
      subheader={
        <Typography variant="body2" color="text.secondary">
          {formatMessage({ id: 'guidelines.public.introduction' })}
        </Typography>
      }
      content={content}
    />
  );
};

export default GuidelinesPage;

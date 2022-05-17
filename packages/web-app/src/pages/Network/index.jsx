import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import DescriptionIcon from '@material-ui/icons/Description';
import DocumentIcon from '@material-ui/icons/Filter';
import Network from '../../components/appli/Network';
import EntrancesList from '../../components/appli/Network/EntrancesList';
import { fetchCave } from '../../actions/Cave';
import Content from './Content';
import { getSafeData } from './transformer';

const NetworkPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { loading, data, error } = useSelector(state => state.cave);
  const { formatMessage } = useIntl();

  useEffect(() => {
    dispatch(fetchCave(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <Network loading={loading || !isNil(error)} data={getSafeData(data)}>
      <>
        <EntrancesList />
        <Content
          title={formatMessage({ id: 'Description' })}
          icon={<DescriptionIcon color="primary" />}
        />
        <Content
          title={formatMessage({ id: 'Documents' })}
          icon={<DocumentIcon color="primary" />}
        />
      </>
    </Network>
  );
};

export default NetworkPage;

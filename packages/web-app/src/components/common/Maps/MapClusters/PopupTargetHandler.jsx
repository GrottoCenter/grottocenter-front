import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import PropTypes from 'prop-types';
import {
  EntrancePopup,
  MassifPopup,
  NetworkPopup,
  OrganizationPopup
} from '../common/Markers/Components';
import useRenderPopup from '../common/Markers/useRenderPopup';
import {
  getEntranceUrl,
  getCaveUrl,
  getMassifUrl,
  getOrganizationUrl,
  getStatisticsMassifUrl
} from '../../../../conf/apiRoutes';

const fetchPopupData = async (type, id, signal) => {
  switch (type) {
    case 'entrance': {
      const data = await fetch(`${getEntranceUrl}${id}`, { signal }).then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
      return {
        lat: data.latitude,
        lng: data.longitude,
        popup: (
          <EntrancePopup
            entrance={{
              ...data,
              depth: data.depth ?? data.cave?.depth,
              length: data.length ?? data.cave?.length,
              caveName: data.caveName ?? data.cave?.name,
              caveId: data.caveId ?? data.cave?.id
            }}
          />
        )
      };
    }
    case 'network': {
      const data = await fetch(`${getCaveUrl}${id}`, { signal }).then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
      const entrance = data.entrances?.[0];
      if (!entrance) return null;
      return {
        lat: entrance.latitude,
        lng: entrance.longitude,
        popup: <NetworkPopup network={data} />
      };
    }
    case 'massif': {
      const [detail, stats] = await Promise.all([
        fetch(`${getMassifUrl}${id}`, { signal }).then(r => {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        }),
        fetch(getStatisticsMassifUrl(id), { signal })
          .then(r => {
            if (!r.ok) throw new Error(r.status);
            return r.json();
          })
          .catch(() => null)
      ]);
      const geoJson =
        typeof detail.geogPolygon === 'string'
          ? JSON.parse(detail.geogPolygon)
          : detail.geogPolygon;
      if (!geoJson) return null;
      const bounds = L.geoJSON(geoJson).getBounds();
      if (!bounds.isValid()) return null;
      const center = bounds.getCenter();
      return {
        lat: center.lat,
        lng: center.lng,
        popup: (
          <MassifPopup
            massif={{
              id: detail.id,
              name: detail.name,
              entranceCount: stats?.nb_caves ?? 0,
              networkCount: stats?.nb_networks ?? 0
            }}
          />
        )
      };
    }
    case 'organization': {
      const data = await fetch(`${getOrganizationUrl}${id}`, { signal }).then(
        r => {
          if (!r.ok) throw new Error(r.status);
          return r.json();
        }
      );
      return {
        lat: data.latitude,
        lng: data.longitude,
        popup: <OrganizationPopup organization={data} />
      };
    }
    default:
      return null;
  }
};

const PopupTargetHandler = ({ popupTarget }) => {
  const map = useMap();
  const renderPopup = useRenderPopup();

  useEffect(() => {
    if (!popupTarget) return undefined;

    const controller = new AbortController();

    fetchPopupData(popupTarget.type, popupTarget.id, controller.signal)
      .then(result => {
        if (controller.signal.aborted || !result) return;
        map.openPopup(renderPopup(result.popup), [result.lat, result.lng]);
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('PopupTargetHandler:', err);
      });

    return () => controller.abort();
  }, [popupTarget, map, renderPopup]);

  return null;
};

PopupTargetHandler.propTypes = {
  popupTarget: PropTypes.shape({
    type: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired
  })
};

export default PopupTargetHandler;

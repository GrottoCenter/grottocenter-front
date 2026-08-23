import * as L from 'leaflet';
import { PANES, LAYER_ROLE, LAYER_TYPE } from './layerEnums';

/*
This files is used to config all the map layers offered.

Concerning the bounds of a layer,
they represent the area on the map for which the layer is available.

If the layer is available for the entire map, we should omit the bounds property.
 */

const layers = [
  {
    id: 'osm',
    name: 'OpenStreetMap Basic',
    role: LAYER_ROLE.BASE,
    type: LAYER_TYPE.WMTS,
    pane: PANES.BASEMAP,
    attribution:
      '« © <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap </a> contributors » under ODbL licence',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    referrerPolicy: 'strict-origin-when-cross-origin',
    maxZoom: 19,
    maxNativeZoom: 19,
    base: true
  },
  {
    id: 'esri_sat',
    name: 'Esri Satellite',
    role: LAYER_ROLE.BASE,
    type: LAYER_TYPE.WMTS,
    pane: PANES.BASEMAP_RASTER,
    exclusiveGroup: 'basemap-enhancement',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 22,
    maxNativeZoom: 19
  },
  {
    id: 'opentopo',
    name: 'OpenTopoMap',
    role: LAYER_ROLE.BASE,
    type: LAYER_TYPE.WMTS,
    pane: PANES.BASEMAP_RASTER,
    exclusiveGroup: 'basemap-enhancement',
    attribution:
      'Map data: &copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a target="_blank" href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a target="_blank" href="https://opentopomap.org">OpenTopoMap</a> (<a target="_blank" href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
    maxNativeZoom: 17
  },
  {
    id: 'ign_scan25',
    name: 'France - IGN SCAN 25®',
    role: LAYER_ROLE.BASE,
    type: LAYER_TYPE.WMTS,
    pane: PANES.BASEMAP_RASTER,
    exclusiveGroup: 'basemap-enhancement',
    attribution:
      '<a target="_blank" href="https://www.ign.fr/">IGN-F/Geoportail</a>',
    url: 'https://data.geopf.fr/private/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&STYLE=normal&TILEMATRIXSET=PM_6_16&FORMAT=image/jpeg&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&apikey=ign_scan_ws',
    minZoom: 6,
    maxNativeZoom: 16,
    maxZoom: 18,
    bounds: new L.LatLngBounds(
      new L.LatLng(-46.5029, -178.206),
      new L.LatLng(51.1751, 77.6492)
    )
  },
  {
    id: 'fr_lidar_hillshade',
    name: 'France - MNT LiDAR HD',
    role: LAYER_ROLE.OVERLAY,
    type: LAYER_TYPE.WMS,
    pane: PANES.HILLSHADE,
    defaultOn: false,
    attribution:
      '<a target="_blank" href="https://www.ign.fr/">IGN-F/Geoportail</a>',
    url: 'https://data.geopf.fr/wms-r/wms',
    layers: 'IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW',
    style: 'normal'
  },
  {
    id: 'usgs_topo',
    name: 'USA - USGS Topo',
    role: LAYER_ROLE.BASE,
    type: LAYER_TYPE.WMTS,
    pane: PANES.BASEMAP_RASTER,
    exclusiveGroup: 'basemap-enhancement',
    attribution:
      '<a target="_blank" href="https://www.usgs.gov/programs/national-geospatial-program/topographic-maps">USGS The National Map</a>',
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 22,
    maxNativeZoom: 16
  },
  {
    id: 'us_hillshade',
    name: 'USA - USGS Hillshade',
    role: LAYER_ROLE.OVERLAY,
    type: LAYER_TYPE.WMS,
    pane: PANES.HILLSHADE,
    attribution:
      '<a target="_blank" href="https://www.usgs.gov/3d-elevation-program">USGS The National Map</a>',
    url: 'https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WMSServer',
    layers: '3DEPElevation:Hillshade Multidirectional',
    bounds: new L.LatLngBounds(
      new L.LatLng(-15.001663, -180),
      new L.LatLng(84.001679, 180)
    )
  },
  {
    id: 'world_geology',
    name: 'World - Bedrock and Structural geology',
    role: LAYER_ROLE.OVERLAY,
    type: LAYER_TYPE.WMS,
    pane: PANES.GEOLOGY,
    attribution:
      'BRGM - <a target="_blank" href="http://mapsref.brgm.fr/wxs/1GG/CGMW_Bedrock_and_Structural_Geology?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=World_CGMW_50M_GeologicalUnitsOnshore&format=image/png&STYLE=default">Legend ⧉</a>',
    url: 'https://mapsref.brgm.fr/wxs/1GG/CGMW_Bedrock_and_Structural_Geology',
    layers: 'World_CGMW_50M_GeologicalUnitsOnshore'
  },
  {
    id: 'eu_bedrock_geology',
    name: 'Europe - Bedrock and Structural geology',
    role: LAYER_ROLE.OVERLAY,
    type: LAYER_TYPE.WMS,
    pane: PANES.GEOLOGY,
    attribution:
      'BRGM - <a target="_blank" href="http://mapsref.brgm.fr/wxs/1GG/GISEurope_Bedrock_and_Structural_Geology?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=Europe_GISEurope_1500K_BedrockAge&format=image/png&STYLE=default">Legend ⧉</a>',
    url: 'https://mapsref.brgm.fr/wxs/1GG/GISEurope_Bedrock_and_Structural_Geology',
    layers: 'Europe_GISEurope_1500K_BedrockAge',
    bounds: new L.LatLngBounds(
      new L.LatLng(34.5621, -10.6181),
      new L.LatLng(62.4007, 34.5858)
    )
  },
  {
    id: 'karst_aquifer',
    name: 'World - Karst Aquifer Map',
    role: LAYER_ROLE.OVERLAY,
    type: LAYER_TYPE.WMS,
    pane: PANES.GEOLOGY,
    attribution:
      '<a target="_blank" href="https://www.whymap.org/whymap/EN/Maps_Data/Wokam/wokam_node_en.html">© BGR / WHYMAP WOKAM</a>',
    url: 'https://services.bgr.de/wms/grundwasser/whymap_wokam/',
    layers: '0,1,2,4,5,6'
  }
];

export default layers;

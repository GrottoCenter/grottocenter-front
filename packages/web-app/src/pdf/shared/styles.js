import { createContext, useContext } from 'react';
import { StyleSheet } from '@react-pdf/renderer';

export const PDF_MARGIN = 36;
export const ANNEX_TOP = 84;
export const ANNEX_BOTTOM = 42;

export const EMPTY_PALETTE = {};
export const StylesContext = createContext(null);
export const makeStyles = colors =>
  StyleSheet.create({
    page: {
      padding: PDF_MARGIN,
      paddingBottom: 56,
      // Natural font leading avoids inherited lineHeight being re-scaled on pagination.
      fontSize: 11,
      color: colors.text
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
      paddingBottom: 8,
      marginBottom: 14,
      color: colors.primary
    },
    title: {
      fontSize: 23,
      fontWeight: 700,
      marginBottom: 8,
      color: colors.primary
    },
    heading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      marginTop: 15,
      marginBottom: 7,
      paddingBottom: 5,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      color: colors.primary
    },
    headingText: { fontSize: 15, fontWeight: 700 },
    subheading: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
    metadata: {
      fontSize: 8,
      color: colors.muted,
      marginTop: 4,
      marginBottom: 5
    },
    link: { color: colors.primary, textDecoration: 'none' },
    footer: {
      position: 'absolute',
      bottom: 18,
      left: PDF_MARGIN,
      right: PDF_MARGIN,
      fontSize: 8,
      color: colors.muted,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      paddingTop: 5,
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    property: { flexDirection: 'row', marginBottom: 5, alignItems: 'center' },
    propertyLabel: {
      width: '35%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5
    },
    propertyLabelText: { fontSize: 10, fontWeight: 700 },
    propertyValue: { width: '65%', fontSize: 10 },
    contribution: { marginBottom: 10 },
    entityLink: { marginBottom: 6 },
    entityLinkTitle: { fontSize: 10, fontWeight: 700 },
    entityLinkDetails: { flexDirection: 'row', gap: 12, marginTop: 2 },
    entityLinkMetric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      fontSize: 8,
      color: colors.muted
    },
    row: {
      flexDirection: 'row',
      fontSize: 10,
      borderBottomWidth: 0.5,
      borderLeftWidth: 0.5,
      borderRightWidth: 0.5,
      borderBottomColor: colors.border,
      borderLeftColor: colors.border,
      borderRightColor: colors.border
    },
    cell: {
      paddingVertical: 5,
      paddingHorizontal: 6,
      borderRightWidth: 0.5,
      borderRightColor: colors.border
    },
    obstacle: { width: '25%', fontWeight: 700 },
    rope: { width: '10%', textAlign: 'center' },
    anchor: { width: '25%' },
    observation: { width: '40%', borderRightWidth: 0 },
    tableHeader: { backgroundColor: colors.primaryLight, fontWeight: 700 },
    alternatingRow: { backgroundColor: colors.tableStripe },
    equipmentTitle: {
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 8
    },
    equipmentLegend: {
      fontSize: 8.5,
      color: colors.muted,
      marginTop: 8
    },
    map: { width: '100%', height: 218, objectFit: 'contain' },
    annexHeader: {
      position: 'absolute',
      top: 22,
      left: PDF_MARGIN,
      right: PDF_MARGIN,
      fontSize: 9
    }
  });
export const usePdfStyles = () => useContext(StylesContext);

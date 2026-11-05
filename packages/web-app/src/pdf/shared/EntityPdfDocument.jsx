import {
  Document,
  Page,
  View,
  Text,
  Link,
  Image,
  StyleSheet
} from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import { createContext, useContext } from 'react';
import { find } from 'linkifyjs';
import {
  PdfBlockType,
  PdfContributionType,
  PdfModelType,
  PdfReferenceType
} from './pdfTypes';
import { PdfGraphic } from './PdfGraphic';

export const PDF_MARGIN = 36;
export const ANNEX_TOP = 84;
export const ANNEX_BOTTOM = 42;

const EMPTY_PALETTE = {};
const PaletteContext = createContext(EMPTY_PALETTE);
const makeStyles = colors =>
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
const usePdfStyles = () => makeStyles(useContext(PaletteContext));

const Heading = ({ title }) => {
  const styles = usePdfStyles();
  return (
    <View style={styles.heading} minPresenceAhead={48} wrap={false}>
      <Text style={styles.headingText}>{title}</Text>
    </View>
  );
};
Heading.propTypes = {
  title: PropTypes.string.isRequired
};

const LinkedText = ({ children, style }) => {
  const styles = usePdfStyles();
  const links = find(children).filter(link =>
    ['url', 'email'].includes(link.type)
  );
  let cursor = 0;
  const parts = [];
  for (const link of links) {
    parts.push(children.slice(cursor, link.start));
    parts.push(
      <Link key={link.start} src={link.href} style={styles.link}>
        {link.value.replace(/([/?&=])/g, '$1\u200b')}
      </Link>
    );
    cursor = link.end;
  }
  parts.push(children.slice(cursor));
  return <Text style={style}>{parts}</Text>;
};

LinkedText.propTypes = {
  children: PropTypes.string.isRequired,
  style: PropTypes.oneOfType([
    PropTypes.shape({}),
    PropTypes.arrayOf(PropTypes.shape({}))
  ])
};

const Footer = ({
  model,
  offset = 0,
  total = null,
  annexPageCount = 0,
  license = ''
}) => {
  const styles = usePdfStyles();
  return (
    <View style={styles.footer} fixed>
      <Text>
        Grottocenter ·{' '}
        {license ||
          `CC BY-SA 3.0 (${model.labels.Text}) · ODbL 1.0 (${model.labels.Data})`}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${pageNumber + offset} / ${total ?? totalPages + annexPageCount}`
        }
      />
    </View>
  );
};

Footer.propTypes = {
  model: PdfModelType.isRequired,
  offset: PropTypes.number,
  total: PropTypes.number,
  annexPageCount: PropTypes.number,
  license: PropTypes.string
};

const Reference = ({ reference }) => {
  const styles = usePdfStyles();
  return (
    <View style={styles.contribution}>
      <LinkedText>{reference.bibliography}</LinkedText>
    </View>
  );
};

Reference.propTypes = {
  reference: PdfReferenceType.isRequired
};

const RiggingHeader = ({ labels }) => {
  const styles = usePdfStyles();
  return (
    <View style={[styles.row, styles.tableHeader]} wrap={false}>
      {['Obstacle', 'Rope', 'Anchor', 'Observations'].map((label, index) => (
        <Text
          key={label}
          style={[
            styles.cell,
            [styles.obstacle, styles.rope, styles.anchor, styles.observation][
              index
            ]
          ]}>
          {labels[label]}
        </Text>
      ))}
    </View>
  );
};
RiggingHeader.propTypes = {
  labels: PropTypes.objectOf(PropTypes.string).isRequired
};

const RiggingRows = ({ item }) => {
  const styles = usePdfStyles();
  return item.obstacles.map((row, index) => (
    <View
      key={row.key}
      style={[styles.row, index % 2 === 0 && styles.alternatingRow]}
      wrap={false}>
      <Text style={[styles.cell, styles.obstacle]}>
        {row.obstacle.trim() || '—'}
      </Text>
      <Text style={[styles.cell, styles.rope]}>{row.rope.trim() || '—'}</Text>
      <Text style={[styles.cell, styles.anchor]}>
        {row.anchor.trim().replace(/\s*\+\s*/g, ' +\u200b ') || '—'}
      </Text>
      <LinkedText style={[styles.cell, styles.observation]}>
        {row.observation.trim() || '—'}
      </LinkedText>
    </View>
  ));
};
RiggingRows.propTypes = {
  item: PdfContributionType.isRequired
};

const Blocks = ({ blocks, model }) => {
  const styles = usePdfStyles();
  return blocks.map(block => (
    <View key={block.key}>
      {block.key !== 'riggings' && <Heading title={block.title} />}
      {block.items.map(item => (
        <View key={item.id} style={styles.contribution}>
          {item.title && (
            <Text style={styles.subheading} minPresenceAhead={24}>
              {item.title}
            </Text>
          )}
          {item.body && <LinkedText>{item.body}</LinkedText>}
          {item.details?.map(detail => (
            <View
              key={detail.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginTop: 3
              }}
              wrap={false}>
              <PdfGraphic
                graphic={model.brand?.icons?.[detail.icon]}
                size={16}
              />
              <Text style={styles.propertyLabelText}>{detail.label}</Text>
              <Text style={{ fontSize: 10, flex: 1 }}>{detail.value}</Text>
            </View>
          ))}
          {item.obstacles.length > 0 && (
            <View>
              <RiggingRows item={item} />
              <Text style={styles.metadata}>
                {model.labels['Notation legends']}: {model.legends}
              </Text>
            </View>
          )}
          <Text style={styles.metadata}>{item.metadata}</Text>
        </View>
      ))}
    </View>
  ));
};

Blocks.propTypes = {
  blocks: PropTypes.arrayOf(PdfBlockType).isRequired,
  model: PdfModelType.isRequired
};

const Documents = ({ model }) => {
  const styles = usePdfStyles();
  const references = model.references.filter(
    reference => reference.bibliography
  );
  const inlineDocuments = model.inlineDocuments ?? [];
  if (!references.length && !inlineDocuments.length) return null;
  return (
    <View>
      <Heading title={model.labels.Documents} />
      {references.length > 0 && (
        <View>
          <Text style={styles.subheading}>
            {model.labels['Bibliographic references']}
          </Text>
          {references.map(reference => (
            <Reference key={reference.source} reference={reference} />
          ))}
        </View>
      )}
      {inlineDocuments.map(document => (
        <View key={document.id} style={styles.contribution}>
          <Link
            src={document.source}
            style={[styles.link, styles.subheading]}
            minPresenceAhead={80}>
            {document.title}
          </Link>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {document.files
              .filter(file => file.image)
              .map(file => (
                <Image
                  key={file.key}
                  src={{ data: file.image, format: 'png' }}
                  style={{
                    width: document.files.length === 1 ? '100%' : '48%',
                    height: 150,
                    objectFit: 'contain'
                  }}
                />
              ))}
          </View>
        </View>
      ))}
    </View>
  );
};
Documents.propTypes = { model: PdfModelType.isRequired };

export const EntityPdfDocument = ({
  model,
  fontFamily,
  annexPageCount = 0
}) => {
  const colors = model.brand?.colors ?? EMPTY_PALETTE;
  const styles = makeStyles(colors);
  const equipment = model.blocks.filter(block => block.key === 'riggings');
  const beforeEquipment = model.blocks.filter(
    block => !['riggings', 'histories', 'comments'].includes(block.key)
  );
  const afterEquipment = model.blocks.filter(block =>
    ['histories', 'comments'].includes(block.key)
  );
  return (
    <Document
      title={model.title}
      author="Grottocenter"
      subject={model.source}
      language={model.locale}>
      <PaletteContext.Provider value={colors}>
        <Page size="A4" style={[styles.page, { fontFamily }]}>
          <View style={styles.brand} wrap={false}>
            <PdfGraphic graphic={model.brand?.logo} size={28} />
            <Text style={{ fontSize: 14, fontWeight: 700 }}>Grottocenter</Text>
          </View>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}
            wrap={false}>
            <PdfGraphic
              graphic={model.brand?.icons?.[model.entityType]}
              size={34}
            />
            <Text style={[styles.title, { flex: 1 }]}>{model.title}</Text>
          </View>
          <Link src={model.source} style={[styles.link, styles.metadata]}>
            {model.source}
          </Link>
          {model.warning && (
            <Text style={styles.subheading}>{model.warning}</Text>
          )}
          {model.map && (
            <View wrap={false}>
              <Image
                src={{ data: model.map.image, format: 'png' }}
                style={styles.map}
              />
              <Link
                src={model.map.source}
                style={[styles.link, styles.metadata]}>
                {model.map.attribution}
              </Link>
              <Text style={styles.metadata}>{model.metadata}</Text>
            </View>
          )}
          {model.properties.length > 0 && (
            <View>
              <Heading title={model.propertiesTitle} />
              {model.properties.map(property => (
                <View key={property.label} style={styles.property} wrap={false}>
                  <View style={styles.propertyLabel}>
                    <PdfGraphic
                      graphic={model.brand?.icons?.[property.icon]}
                      size={16}
                    />
                    <Text style={styles.propertyLabelText}>
                      {property.label}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.propertyValue,
                      { color: colors[property.tone] ?? colors.text }
                    ]}>
                    {property.value}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {!model.map && <Text style={styles.metadata}>{model.metadata}</Text>}
          <Blocks blocks={beforeEquipment} model={model} />
          {equipment.flatMap(block =>
            block.items.flatMap(item => [
              // Fixed headers ignore presence hints; reserve their first rows outside the table.
              <View
                key={`${block.key}-${item.id}-start`}
                minPresenceAhead={144}
              />,
              <View key={`${block.key}-${item.id}`} style={styles.contribution}>
                <View fixed wrap={false}>
                  <Heading title={block.title} />
                  {item.title && (
                    <Text style={styles.equipmentTitle}>{item.title}</Text>
                  )}
                  {item.obstacles.length > 0 && (
                    <RiggingHeader labels={model.labels} />
                  )}
                </View>
                {item.body && <LinkedText>{item.body}</LinkedText>}
                <RiggingRows item={item} />
                <View wrap={false}>
                  {item.obstacles.length > 0 && (
                    <Text style={styles.equipmentLegend}>
                      <Text style={{ fontWeight: 700 }}>
                        {model.labels['Notation legends']}: {'\n'}
                      </Text>
                      {model.legends}
                    </Text>
                  )}
                  <Text style={styles.metadata}>{item.metadata}</Text>
                </View>
              </View>
            ])
          )}
          <Blocks blocks={afterEquipment} model={model} />
          <Documents model={model} />
          <Footer model={model} annexPageCount={annexPageCount} />
        </Page>
      </PaletteContext.Provider>
    </Document>
  );
};

EntityPdfDocument.propTypes = {
  model: PdfModelType.isRequired,
  fontFamily: PropTypes.arrayOf(PropTypes.string).isRequired,
  annexPageCount: PropTypes.number
};

export const AnnexFrames = ({ model, fontFamily, pages, offset, total }) => {
  const colors = model.brand?.colors ?? EMPTY_PALETTE;
  const styles = makeStyles(colors);
  return (
    <Document>
      <PaletteContext.Provider value={colors}>
        {pages.map(page => (
          <Page
            key={page.key}
            size={page.size}
            style={[styles.page, { fontFamily }]}>
            <View style={[styles.annexHeader, styles.brand]}>
              <View style={{ flex: 1 }}>
                <Link
                  src={page.source}
                  style={[styles.link, styles.subheading]}>
                  {page.title}
                </Link>
                {page.credit && (
                  <Text style={styles.metadata}>{page.credit}</Text>
                )}
              </View>
            </View>
            <Footer
              model={model}
              offset={offset}
              total={total}
              license={page.license}
            />
          </Page>
        ))}
      </PaletteContext.Provider>
    </Document>
  );
};

AnnexFrames.propTypes = {
  model: PdfModelType.isRequired,
  fontFamily: PropTypes.arrayOf(PropTypes.string).isRequired,
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      source: PropTypes.string,
      credit: PropTypes.string,
      sourcePage: PropTypes.number.isRequired,
      size: PropTypes.arrayOf(PropTypes.number).isRequired
    })
  ).isRequired,
  offset: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired
};

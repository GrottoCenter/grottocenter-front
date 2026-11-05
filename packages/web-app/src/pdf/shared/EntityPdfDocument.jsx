import { Document, Page, View, Text, Link, Image } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import { PdfModelType } from './pdfTypes';
import { PdfGraphic } from './PdfGraphic';
import { Footer, Heading } from './PdfText';
import { Blocks, Rigging } from './PdfContributions';
import { Documents, NativeAnnexCredits } from './PdfDocuments';
import { EMPTY_PALETTE, StylesContext, makeStyles } from './styles';

export const EntityPdfDocument = ({
  model,
  fontFamily,
  annexPageCount = 0
}) => {
  const colors = model.brand?.colors ?? EMPTY_PALETTE;
  const styles = makeStyles(colors);
  return (
    <Document
      title={model.title}
      author="Grottocenter"
      subject={model.source}
      language={model.locale}>
      <StylesContext.Provider value={styles}>
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
          <Text style={styles.metadata}>
            {model.labels.Date}: {model.generatedAt}
          </Text>
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
          {model.blocks.map(block =>
            block.type === 'rigging' ? (
              <Rigging key={block.key} block={block} model={model} />
            ) : (
              <Blocks key={block.key} blocks={[block]} model={model} />
            )
          )}
          <Documents model={model} />
          <NativeAnnexCredits model={model} />
          <Footer model={model} annexPageCount={annexPageCount} />
        </Page>
      </StylesContext.Provider>
    </Document>
  );
};

EntityPdfDocument.propTypes = {
  model: PdfModelType.isRequired,
  fontFamily: PropTypes.arrayOf(PropTypes.string).isRequired,
  annexPageCount: PropTypes.number
};

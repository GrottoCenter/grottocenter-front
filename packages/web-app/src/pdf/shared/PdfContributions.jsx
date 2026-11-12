import { View, Text, Link } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import { PdfBlockType, PdfContributionType, PdfModelType } from './pdfTypes';
import { PdfGraphic } from './PdfGraphic';
import { Heading, LinkedText } from './PdfText';
import { usePdfStyles } from './styles';

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

const EntityLinks = ({ items, model }) => {
  const styles = usePdfStyles();
  return items.map(item => (
    <View key={item.id} style={styles.entityLink} wrap={false}>
      <View style={styles.entityLinkHeading}>
        <PdfGraphic graphic={model.brand?.icons?.[item.icon]} size={16} />
        <Link src={item.source} style={[styles.link, styles.entityLinkTitle]}>
          {item.title}
        </Link>
      </View>
      {item.details.length > 0 && (
        <View style={styles.entityLinkDetails}>
          {item.details.map(detail => (
            <View key={detail.label} style={styles.entityLinkMetric}>
              <PdfGraphic
                graphic={model.brand?.icons?.[detail.icon]}
                size={12}
              />
              <Text>
                {detail.label}: {detail.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  ));
};
EntityLinks.propTypes = {
  items: PropTypes.arrayOf(PdfContributionType).isRequired,
  model: PdfModelType.isRequired
};

export const Blocks = ({ blocks, model }) => {
  const styles = usePdfStyles();
  return blocks.map(block => (
    <View key={block.key} wrap={block.key !== 'statistics'}>
      {block.type !== 'rigging' && <Heading title={block.title} />}
      {block.type === 'links' ? (
        <EntityLinks items={block.items} model={model} />
      ) : (
        block.items.map(item => (
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
        ))
      )}
    </View>
  ));
};

Blocks.propTypes = {
  blocks: PropTypes.arrayOf(PdfBlockType).isRequired,
  model: PdfModelType.isRequired
};

export const Rigging = ({ block, model }) => {
  const styles = usePdfStyles();
  return (
    <>
      {block.items.flatMap(item => [
        // Fixed headers ignore presence hints; reserve their first rows outside the table.
        <View key={`${block.key}-${item.id}-start`} minPresenceAhead={144} />,
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
      ])}
    </>
  );
};
Rigging.propTypes = {
  block: PdfBlockType.isRequired,
  model: PdfModelType.isRequired
};

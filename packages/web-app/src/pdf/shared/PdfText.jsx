import { View, Text, Link } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import { find } from 'linkifyjs';
import { PdfModelType } from './pdfTypes';
import { usePdfStyles } from './styles';

export const Heading = ({ title }) => {
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

export const LinkedText = ({ children, style }) => {
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

export const Footer = ({
  model,
  total = null,
  annexPageCount = 0,
  number = null,
  license = null,
  authors = ''
}) => {
  const styles = usePdfStyles();
  return (
    <View style={styles.footer} fixed>
      <Text style={{ flex: 1, marginRight: 8 }}>
        {[
          'Grottocenter',
          authors,
          license ??
            `CC BY-SA 3.0 (${model.labels.Text}) · ODbL 1.0 (${model.labels.Data})`
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${number ?? pageNumber} / ${total ?? totalPages + annexPageCount}`
        }
      />
    </View>
  );
};

Footer.propTypes = {
  model: PdfModelType.isRequired,
  total: PropTypes.number,
  annexPageCount: PropTypes.number,
  number: PropTypes.number,
  license: PropTypes.string,
  authors: PropTypes.string
};

import { Document, Page, View, Link } from '@react-pdf/renderer';
import PropTypes from 'prop-types';
import { PdfModelType } from './pdfTypes';
import { Footer } from './PdfText';
import { EMPTY_PALETTE, StylesContext, makeStyles } from './styles';

export const AnnexFrames = ({ model, fontFamily, pages, total }) => {
  const colors = model.brand?.colors ?? EMPTY_PALETTE;
  const styles = makeStyles(colors);
  return (
    <Document>
      <StylesContext.Provider value={styles}>
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
              </View>
            </View>
            <Footer
              model={model}
              number={page.number}
              total={total}
              license={page.license}
              authors={page.authors}
            />
          </Page>
        ))}
      </StylesContext.Provider>
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
      authors: PropTypes.string,
      license: PropTypes.string,
      number: PropTypes.number.isRequired,
      size: PropTypes.arrayOf(PropTypes.number).isRequired
    })
  ).isRequired,
  total: PropTypes.number.isRequired
};

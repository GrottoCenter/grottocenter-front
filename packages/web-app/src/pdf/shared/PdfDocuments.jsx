import { View, Text, Link, Image } from '@react-pdf/renderer';
import { PdfModelType, PdfReferenceType } from './pdfTypes';
import { Heading, LinkedText } from './PdfText';
import { usePdfStyles } from './styles';

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

export const Documents = ({ model }) => {
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
                  src={{ data: file.image, format: file.format ?? 'png' }}
                  style={{
                    width: document.files.length === 1 ? '100%' : '48%',
                    height: 150,
                    objectFit: 'contain'
                  }}
                />
              ))}
          </View>
          {document.credit && (
            <Text style={styles.metadata}>{document.credit}</Text>
          )}
        </View>
      ))}
    </View>
  );
};
Documents.propTypes = { model: PdfModelType.isRequired };

// Native pages stay untouched; their credits and physical dossier ranges live here.
export const NativeAnnexCredits = ({ model }) => {
  const styles = usePdfStyles();
  if (!model.nativeAnnexes?.length) return null;
  return (
    <View>
      <Heading title={model.labels['pdf.appendices']} />
      {model.nativeAnnexes.map(document => (
        <View key={document.id} style={styles.contribution}>
          <Link src={document.source} style={[styles.link, styles.subheading]}>
            {document.title}
          </Link>
          <Text style={styles.metadata}>{document.credit}</Text>
          <LinkedText style={styles.metadata}>{document.source}</LinkedText>
          {document.files.map(file => (
            <Text
              key={file.key}
              style={styles.metadata}
              render={({ totalPages }) =>
                `${file.fileName} · ${model.labels.Pages}: ${totalPages + file.firstPage}–${totalPages + file.lastPage}`
              }
            />
          ))}
        </View>
      ))}
    </View>
  );
};
NativeAnnexCredits.propTypes = { model: PdfModelType.isRequired };

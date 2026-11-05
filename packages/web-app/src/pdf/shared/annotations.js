import {
  PDFArray,
  PDFDict,
  PDFName,
  PDFRef,
  PDFNumber,
  PDFHexString,
  PDFString
} from 'pdf-lib';

const resolveDestination = (document, value) => {
  let destination = document.context.lookup(value);
  if (
    destination instanceof PDFName ||
    destination instanceof PDFString ||
    destination instanceof PDFHexString
  ) {
    const name = destination.decodeText();
    const legacy = document.catalog.lookupMaybe(PDFName.of('Dests'), PDFDict);
    destination = legacy?.lookup(PDFName.of(name));
    if (!destination) {
      const names = document.catalog.lookupMaybe(PDFName.of('Names'), PDFDict);
      const root = names?.lookupMaybe(PDFName.of('Dests'), PDFDict);
      const visited = new Set();
      const find = node => {
        if (!node || visited.has(node)) return null;
        visited.add(node);
        const entries = node.lookupMaybe(PDFName.of('Names'), PDFArray);
        for (let index = 0; index < (entries?.size() ?? 0); index += 2) {
          const key = entries.lookup(index);
          if (key.decodeText() === name) return entries.lookup(index + 1);
        }
        const children = node.lookupMaybe(PDFName.of('Kids'), PDFArray);
        for (const child of children?.asArray() ?? []) {
          const result = find(document.context.lookup(child, PDFDict));
          if (result) return result;
        }
        return null;
      };
      destination = find(root);
    }
  }
  if (destination instanceof PDFDict)
    return destination.lookupMaybe(PDFName.of('D'), PDFArray);
  return destination instanceof PDFArray ? destination : null;
};

// copyPages does not retarget annotation destinations to the inserted page tree.
export const retargetNativePageLinks = (document, copiedPages) => {
  const indices = new Map(
    document.getPages().map((page, index) => [page.ref.toString(), index])
  );
  document.getPages().forEach((source, index) => {
    const annotations = source.node.Annots();
    const target = copiedPages[index];
    const copied = target.node.Annots();
    annotations?.asArray().forEach((ref, annotationIndex) => {
      const annotation = document.context.lookup(ref, PDFDict);
      const copiedAnnotation = target.doc.context.lookup(
        copied.get(annotationIndex),
        PDFDict
      );
      const action = annotation.lookupMaybe(PDFName.of('A'), PDFDict);
      const isAction =
        !annotation.has(PDFName.of('Dest')) &&
        action?.get(PDFName.of('S')) === PDFName.of('GoTo');
      const value = isAction
        ? action.get(PDFName.of('D'))
        : annotation.get(PDFName.of('Dest'));
      if (!value) return;
      const destination = resolveDestination(document, value);
      if (!destination) return;
      const page = destination.get(0);
      let pageIndex;
      if (page instanceof PDFRef) pageIndex = indices.get(page.toString());
      else if (page instanceof PDFNumber) pageIndex = page.asNumber();
      if (!copiedPages[pageIndex]) return;
      const values = destination
        .asArray()
        .slice(1)
        .map(entry => document.context.lookup(entry));
      const replacement = target.doc.context.obj([
        copiedPages[pageIndex].ref,
        ...values
      ]);
      if (isAction)
        copiedAnnotation
          .lookup(PDFName.of('A'), PDFDict)
          .set(PDFName.of('D'), replacement);
      else copiedAnnotation.set(PDFName.of('Dest'), replacement);
    });
  });
};

export const getPdfPageLinks = page => {
  const annotations = page.node.Annots();
  if (!annotations) return [];
  return annotations.asArray().map(ref => {
    const annotation = page.doc.context.lookup(ref, PDFDict);
    const action = annotation.lookupMaybe(PDFName.of('A'), PDFDict);
    const uri = action?.lookup(PDFName.of('URI'));
    const rect = annotation.lookupMaybe(PDFName.of('Rect'), PDFArray);
    // Other annotation types need appearance streams, destinations or form state.
    // Fail explicitly rather than silently dropping visible or interactive content.
    if (
      annotation.get(PDFName.of('Subtype')) !== PDFName.of('Link') ||
      action?.get(PDFName.of('S')) !== PDFName.of('URI') ||
      !(uri instanceof PDFString || uri instanceof PDFHexString) ||
      !rect ||
      rect.size() !== 4 ||
      rect.asArray().some(value => !(value instanceof PDFNumber)) ||
      annotation.has(PDFName.of('AP'))
    )
      throw new Error('pdf.annotationError');
    try {
      // URI actions use byte strings; URL normalizes Unicode paths before writing.
      return {
        uri: new URL(uri.decodeText()).href,
        rect: rect.asArray().map(value => value.asNumber())
      };
    } catch {
      throw new Error('pdf.annotationError');
    }
  });
};

export const copyPdfPageLinks = (
  links,
  target,
  { crop, rotation, scale, x, y }
) => {
  const transform = (sourceX, sourceY) => {
    const dx = sourceX - crop.x;
    const dy = sourceY - crop.y;
    const positions = {
      0: [dx, dy],
      90: [dy, crop.width - dx],
      180: [crop.width - dx, crop.height - dy],
      270: [crop.height - dy, dx]
    };
    const [rotatedX, rotatedY] = positions[rotation];
    return [x + rotatedX * scale, y + rotatedY * scale];
  };
  for (const link of links) {
    const [left, bottom, right, top] = link.rect;
    const clipped = [
      Math.max(left, crop.x),
      Math.max(bottom, crop.y),
      Math.min(right, crop.x + crop.width),
      Math.min(top, crop.y + crop.height)
    ];
    if (clipped[0] >= clipped[2] || clipped[1] >= clipped[3]) continue;
    const first = transform(clipped[0], clipped[1]);
    const last = transform(clipped[2], clipped[3]);
    const annotation = target.doc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [
        Math.min(first[0], last[0]),
        Math.min(first[1], last[1]),
        Math.max(first[0], last[0]),
        Math.max(first[1], last[1])
      ],
      Border: [0, 0, 0],
      A: { Type: 'Action', S: 'URI', URI: PDFString.of(link.uri) }
    });
    target.node.addAnnot(target.doc.context.register(annotation));
  }
};

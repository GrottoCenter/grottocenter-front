// @vitest-environment node
import { PDFDocument, PDFDict, PDFName, PDFString, PDFArray } from 'pdf-lib';
import { getPdfPageLinks, retargetNativePageLinks } from './annotations';

it.each(['Dest', 'GoTo'])(
  'rejects an internal %s link with visible appearance content',
  async mode => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    const destination = source.context.obj([page.ref, 'Fit']);
    const annotation = source.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [20, 20, 100, 50],
      AP: {
        N: source.context.register(
          source.context.flateStream('visible content')
        )
      }
    });
    if (mode === 'Dest') annotation.set(PDFName.of('Dest'), destination);
    else
      annotation.set(
        PDFName.of('A'),
        source.context.obj({ S: 'GoTo', D: destination })
      );
    page.node.set(PDFName.of('Annots'), source.context.obj([annotation]));
    expect(() => getPdfPageLinks(page)).toThrow('pdf.annotationError');
  }
);

it.each(['explicit', 'legacy name', 'name tree', 'GoTo action'])(
  'retargets a native link using an %s destination',
  async mode => {
    const source = await PDFDocument.create();
    const first = source.addPage();
    const second = source.addPage();
    const destination = source.context.obj([second.ref, 'Fit']);
    const annotation = source.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [20, 20, 100, 50]
    });
    if (mode === 'legacy name') {
      source.catalog.set(
        PDFName.of('Dests'),
        source.context.obj({ next: destination })
      );
      annotation.set(PDFName.of('Dest'), PDFName.of('next'));
    } else if (mode === 'name tree') {
      source.catalog.set(
        PDFName.of('Names'),
        source.context.obj({
          Dests: {
            Kids: [{ Names: [PDFString.of('next'), { D: destination }] }]
          }
        })
      );
      annotation.set(PDFName.of('Dest'), PDFString.of('next'));
    } else if (mode === 'GoTo action') {
      annotation.set(
        PDFName.of('A'),
        source.context.obj({ S: 'GoTo', D: destination })
      );
    } else annotation.set(PDFName.of('Dest'), destination);
    first.node.set(PDFName.of('Annots'), source.context.obj([annotation]));
    const output = await PDFDocument.create();
    output.addPage();
    const copied = await output.copyPages(source, source.getPageIndices());
    retargetNativePageLinks(source, copied);
    copied.forEach(page => output.addPage(page));
    const reloaded = await PDFDocument.load(await output.save());
    const link = reloaded.getPage(1).node.Annots().lookup(0, PDFDict);
    const finalDestination =
      mode === 'GoTo action'
        ? link
            .lookup(PDFName.of('A'), PDFDict)
            .lookup(PDFName.of('D'), PDFArray)
        : link.lookup(PDFName.of('Dest'), PDFArray);
    expect(finalDestination.get(0).toString()).toBe(
      reloaded.getPage(2).ref.toString()
    );
  }
);

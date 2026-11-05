// @vitest-environment node
import path from 'node:path';
import sharp from 'sharp';
import { createIntl } from 'react-intl';
import { PDFDocument, PDFName, degrees, decodePDFRawStream } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import messages from '../../../public/lang/en.json';
import { buildEntrancePdfModel } from '../entrance/model';
import { generateEntityPdf } from './generateEntityPdf';

const fontSources = Object.fromEntries(
  Object.entries({
    regular: 'NotoSans-Regular',
    bold: 'NotoSans-Bold',
    arabic: 'NotoSansArabic-Regular',
    hebrew: 'NotoSansHebrew-Regular',
    japanese: 'NotoSansJP',
    math: 'NotoSansMath-Regular',
    symbols: 'NotoSansSymbols2-Regular'
  }).map(([key, name]) => [
    key,
    path.resolve(`src/assets/fonts/pdf/${name}.ttf`)
  ])
);
const intl = createIntl({ locale: 'en', messages });
const model = buildEntrancePdfModel({
  entrance: {
    id: 1,
    name: 'Cavité — Ελληνικά Български العربية עברית 日本語',
    comments: [
      {
        id: 1,
        title: 'Safety',
        body: 'Winter avalanche danger. https://example.org/access'
      }
    ]
  },
  sections: { comments: true },
  documents: [],
  attachments: [],
  intl
});
const attachment = {
  key: 'survey',
  fileName: 'survey.pdf',
  isPdf: true,
  pages: '2'
};

const makeSurvey = async () => {
  const survey = await PDFDocument.create();
  survey
    .addPage([300, 500])
    .drawRectangle({ x: 5, y: 5, width: 200, height: 400 });
  const rotated = survey.addPage([300, 500]);
  rotated.setCropBox(20, 40, 200, 400);
  rotated.setRotation(degrees(90));
  rotated.drawRectangle({ x: 20, y: 40, width: 200, height: 400 });
  return survey.save();
};

describe('real entity PDF assembly', () => {
  it('renders comment evaluations and places entity credits below general information', async () => {
    const detailedModel = buildEntrancePdfModel({
      entrance: {
        id: 1,
        name: 'Comment details',
        dataQuality: { total: 94 },
        author: { nickname: 'EntityAuthorCredit' },
        dateInscription: '2026-01-01',
        comments: [
          {
            id: 3,
            body: 'The hardest part is reaching the entrance.',
            author: { nickname: 'CommentAuthorCredit' },
            dateInscription: '2026-01-02',
            aestheticism: 6,
            caving: 9,
            approach: 7,
            eTTrail: '00:30:00',
            eTUnderground: '01:30:00'
          }
        ]
      },
      sections: { properties: true, comments: true },
      documents: [],
      attachments: [],
      intl
    });
    const task = getDocument({
      data: await generateEntityPdf(detailedModel, [], { fontSources })
    });
    try {
      const document = await task.promise;
      const page = await document.getPage(1);
      const text = (await page.getTextContent()).items
        .map(item => item.str)
        .join(' ');
      expect(text.indexOf('EntityAuthorCredit')).toBeGreaterThan(
        text.indexOf('Good quality')
      );
      expect(text.indexOf('EntityAuthorCredit')).toBeLessThan(
        text.indexOf('Comments')
      );
      expect(text).toContain('3/5 · Interesting');
      expect(text).toContain('4.5/5 · Easy – Very easy');
      expect(text).toContain('3.5/5 · Intermediate – Easy');
      expect(text.indexOf('CommentAuthorCredit')).toBeGreaterThan(
        text.indexOf('3.5/5')
      );
    } finally {
      await task.destroy();
    }
  }, 20000);

  it('paginates an inline image gallery without creating bibliographic references', async () => {
    const bytes = new Uint8Array(
      await sharp({
        create: { width: 40, height: 20, channels: 3, background: '#789abc' }
      })
        .png()
        .toBuffer()
    );
    const files = Array.from({ length: 8 }, (_item, index) => ({
      key: `photo-${index}`,
      fileName: `photo-${index}.png`,
      bytes
    }));
    const gallery = {
      ...model,
      inlineDocuments: [
        {
          id: 3,
          title: 'Photo collection',
          source: 'https://example.org/photos',
          files
        }
      ],
      references: []
    };
    const loadingTask = getDocument({
      data: await generateEntityPdf(gallery, [], {
        fontSources,
        inlineImages: files
      })
    });
    try {
      const document = await loadingTask.promise;
      expect(document.numPages).toBeGreaterThan(1);
      const firstPage = await document.getPage(1);
      const text = (await firstPage.getTextContent()).items
        .map(item => item.str)
        .join(' ');
      expect(text).toContain('Photo collection');
      expect(text).not.toContain('Bibliographic references');
    } finally {
      await loadingTask.destroy();
    }
  }, 20000);

  it('repeats equipment column headings on continuation pages and keeps rows together', async () => {
    const tableModel = buildEntrancePdfModel({
      entrance: {
        id: 2,
        name: 'Equipment pagination',
        riggings: [
          {
            id: 3,
            title: 'Complete rigging',
            obstacles: Array.from({ length: 45 }, (_item, index) => ({
              obstacle: `Obstacle ${index}`,
              rope: 'C60',
              anchor: '2S+1S+1AN+1AN+1AS+1dev/S',
              observation: `Remark ${index}: protect the rope at the edge and avoid falling stones.`
            }))
          }
        ],
        comments: [
          { id: 4, body: 'Post-rigging notes for the next visit. '.repeat(200) }
        ]
      },
      sections: { riggings: true, comments: true },
      documents: [],
      attachments: [],
      intl
    });
    const task = getDocument({
      data: await generateEntityPdf(tableModel, [], { fontSources })
    });
    const document = await task.promise;
    try {
      expect(document.numPages).toBeGreaterThan(2);
      let rows = '';
      // PDF.js page resources are read serially.
      /* eslint-disable no-await-in-loop */
      for (let number = 1; number <= document.numPages; number++) {
        const page = await document.getPage(number);
        const { items } = await page.getTextContent();
        const text = items.map(item => item.str).join(' ');
        const firstRow = items.find(item => /^Obstacle \d+$/.test(item.str));
        if (firstRow) {
          expect(text).toContain('Riggings');
          expect(text).toContain('Complete rigging');
          expect(text).toContain('Rope');
          expect(text).toContain('Anchor');
          expect(text).toContain('Observations');
          const title = items.find(item => item.str === 'Complete rigging');
          const header = items.find(item => item.str === 'Obstacle');
          expect(title.transform[5]).toBeGreaterThan(header.transform[5]);
          expect(firstRow.transform[5]).toBeLessThan(header.transform[5] - 12);
        } else {
          expect(text).not.toContain('Complete rigging');
          expect(text).not.toContain('Riggings');
        }
        for (let index = 0; index < 45; index++) {
          if (text.includes(`Obstacle ${index} `))
            expect(text).toContain(`Remark ${index}:`);
        }
        rows += text;
      }
      /* eslint-enable no-await-in-loop */
      expect(rows).toContain('Obstacle 44');
      expect(rows).toContain('Post-rigging notes');
    } finally {
      await task.destroy();
    }
  }, 20000);

  it('keeps short equipment sheets in the content flow with their own column headings', async () => {
    const equipmentModel = buildEntrancePdfModel({
      entrance: {
        id: 2,
        name: 'Two routes',
        riggings: [
          {
            id: 3,
            title: 'Normal route',
            obstacles: [{ obstacle: 'P44', rope: 'C60', anchor: '2S+1AN' }]
          },
          {
            id: 4,
            title: 'Alternative route',
            obstacles: [{ obstacle: 'P19', rope: 'C25', anchor: '1AN+3S' }]
          }
        ],
        comments: [{ id: 5, body: 'After the equipment sheets.' }]
      },
      sections: { properties: true, riggings: true, comments: true },
      documents: [],
      attachments: [],
      intl
    });
    const task = getDocument({
      data: await generateEntityPdf(equipmentModel, [], { fontSources })
    });
    try {
      const document = await task.promise;
      expect(document.numPages).toBe(1);
      const page = await document.getPage(1);
      const text = (await page.getTextContent()).items
        .map(item => item.str)
        .join(' ');
      expect(text.indexOf('General Information')).toBeLessThan(
        text.indexOf('Normal route')
      );
      expect(text.indexOf('Normal route')).toBeLessThan(
        text.indexOf('Obstacle')
      );
      expect(text).toContain('P44');
      expect(text).toContain('2S + 1AN');
      expect(text.indexOf('Alternative route')).toBeGreaterThan(
        text.indexOf('P44')
      );
      expect(text).toContain('P19');
      expect(text.indexOf('After the equipment sheets.')).toBeGreaterThan(
        text.indexOf('P19')
      );
    } finally {
      await task.destroy();
    }
  }, 20000);

  it.each([27, 29, 31])(
    'does not orphan equipment headings after %s properties',
    async propertyCount => {
      const tableModel = buildEntrancePdfModel({
        entrance: {
          id: 2,
          name: 'Equipment below general information',
          riggings: [
            {
              id: 3,
              title: 'Short rigging',
              obstacles: [{ obstacle: 'P44', rope: 'C60', anchor: '2S+1AN' }]
            }
          ]
        },
        sections: { riggings: true },
        documents: [],
        attachments: [],
        intl
      });
      tableModel.properties = Array.from(
        { length: propertyCount },
        (_item, index) => ({
          label: `Property ${index}`,
          value: 'General information'
        })
      );
      const task = getDocument({
        data: await generateEntityPdf(tableModel, [], { fontSources })
      });
      try {
        const document = await task.promise;
        const first = await document.getPage(1);
        const firstText = (await first.getTextContent()).items
          .map(item => item.str)
          .join(' ');
        if (firstText.includes('Short rigging')) {
          expect(firstText).toContain('P44');
        }
        const last = await document.getPage(document.numPages);
        const lastText = (await last.getTextContent()).items
          .map(item => item.str)
          .join(' ');
        expect(lastText).toContain('P44');
        expect(lastText).toContain('Short rigging');
      } finally {
        await task.destroy();
      }
    },
    20000
  );

  it('preserves ordinary, double and decorative arrows in equipment annotations', async () => {
    const arrows = '← ↑ → ↓ ↕ ↔ ↗ ↘ ⇒ ⇓ ➜ ➔ ⬇ ⤵';
    const tableModel = buildEntrancePdfModel({
      entrance: {
        id: 2,
        name: 'Rigging arrows',
        riggings: [
          {
            id: 3,
            obstacles: [
              {
                obstacle: 'P44',
                rope: 'C60',
                anchor: arrows,
                observation: arrows
              }
            ]
          }
        ]
      },
      sections: { riggings: true },
      documents: [],
      attachments: [],
      intl
    });
    const task = getDocument({
      data: await generateEntityPdf(tableModel, [], { fontSources })
    });
    try {
      const document = await task.promise;
      const page = await document.getPage(1);
      const { items } = await page.getTextContent();
      const text = items.map(item => item.str).join(' ');
      for (const arrow of arrows.split(' ')) {
        expect(text.split(arrow)).toHaveLength(3);
      }
    } finally {
      await task.destroy();
    }
  }, 20000);

  it('keeps source credits and global pagination inside every generated page', async () => {
    const longModel = {
      ...model,
      title: 'Sources and pagination',
      metadata: 'EntityCreditBelowMap',
      properties: [{ label: 'Altitude', value: '1200 m' }],
      map: {
        image: new Uint8Array(
          await sharp({
            create: {
              width: 20,
              height: 10,
              channels: 3,
              background: '#e8eee2'
            }
          })
            .png()
            .toBuffer()
        ),
        attribution: 'OpenStreetMap contributors',
        source: 'https://www.openstreetmap.org/copyright'
      },
      blocks: [
        {
          ...model.blocks[0],
          items: [
            {
              ...model.blocks[0].items[0],
              body: 'A long access description with safety information. '.repeat(
                200
              )
            }
          ]
        }
      ]
    };
    const loadingTask = getDocument({
      data: await generateEntityPdf(
        longModel,
        [{ ...attachment, bytes: await makeSurvey() }],
        { fontSources }
      )
    });
    const document = await loadingTask.promise;
    try {
      expect(document.numPages).toBeGreaterThan(2);
      let contents = '';
      // Read pages sequentially to keep PDF.js resources bounded.
      /* eslint-disable no-await-in-loop */
      for (let number = 1; number <= document.numPages; number++) {
        const page = await document.getPage(number);
        const text = await page.getTextContent();
        contents += text.items.map(item => item.str).join(' ');
        const footer = text.items.find(item =>
          item.str.includes('Grottocenter ·')
        );
        expect(footer).toBeDefined();
        expect(footer.transform[5]).toBeGreaterThan(12);
        expect(footer.transform[5]).toBeLessThan(36);
        expect(text.items.map(item => item.str).join('')).toContain(
          `${number} / ${document.numPages}`
        );
        expect(text.items.map(item => item.str).join(' ')).toContain(
          'CC BY-SA 3.0 (Text) · ODbL 1.0 (Data)'
        );
        const annotations = await page.getAnnotations();
        expect(
          annotations.filter(
            annotation =>
              annotation.subtype === 'Link' && annotation.rect[1] < 36
          )
        ).toHaveLength(0);
      }
      /* eslint-enable no-await-in-loop */
      expect(contents).not.toMatch(/\bMap\b/);
      expect(contents.indexOf('OpenStreetMap contributors')).toBeLessThan(
        contents.indexOf('EntityCreditBelowMap')
      );
      expect(contents.indexOf('EntityCreditBelowMap')).toBeLessThan(
        contents.indexOf('General Information')
      );
      expect(contents.indexOf('General Information')).toBeLessThan(
        contents.indexOf('Altitude')
      );
      expect(contents.indexOf('Altitude')).toBeLessThan(
        contents.indexOf('Safety')
      );
    } finally {
      await loadingTask.destroy();
    }
  }, 20000);

  it('keeps a document-specific licence in appendix footers instead of relicensing it', async () => {
    const licensedModel = {
      ...model,
      references: [
        {
          id: 7,
          title: 'Licensed survey',
          source: 'https://grottocenter.org/ui/documents/7',
          license: 'CC BY-NC 4.0',
          credit: 'Survey author · CC BY-NC 4.0',
          files: [attachment]
        }
      ]
    };
    const task = getDocument({
      data: await generateEntityPdf(
        licensedModel,
        [{ ...attachment, documentId: 7, bytes: await makeSurvey() }],
        { fontSources }
      )
    });
    try {
      const document = await task.promise;
      const page = await document.getPage(2);
      const { items } = await page.getTextContent();
      const footerText = items
        .filter(item => item.transform[5] < 36)
        .map(item => item.str)
        .join(' ');
      expect(footerText).toContain('Grottocenter · CC BY-NC 4.0');
      expect(footerText).not.toContain('CC BY-SA');
      expect(footerText).not.toContain('ODbL');
    } finally {
      await task.destroy();
    }
  }, 20000);

  it('renders multilingual text and embeds a selected, cropped, rotated survey as vectors on landscape A4', async () => {
    const bytes = await generateEntityPdf(
      model,
      [{ ...attachment, bytes: await makeSurvey() }],
      { fontSources }
    );
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    const output = await PDFDocument.load(bytes);
    expect(output.getTitle()).toBe(model.title);
    expect(output.getPageCount()).toBe(2);
    const page = output.getPage(1);
    expect(page.getWidth()).toBeCloseTo(841.89);
    expect(page.getHeight()).toBeCloseTo(595.28);
    const objects = page.node.Resources().lookup(PDFName.of('XObject'));
    const vector = objects
      .values()
      .map(reference => output.context.lookup(reference))
      .find(
        stream => stream.dict.get(PDFName.of('Subtype')).toString() === '/Form'
      );
    expect(
      vector.dict
        .get(PDFName.of('BBox'))
        .asArray()
        .map(value => value.asNumber())
    ).toEqual([20, 40, 220, 440]);
    expect(
      new TextDecoder().decode(decodePDFRawStream(vector).decode())
    ).toContain('200 400 l');
  }, 20000);

  it('preserves original physical size, CropBox and rotation without adding a frame', async () => {
    const output = await PDFDocument.load(
      await generateEntityPdf(
        model,
        [{ ...attachment, bytes: await makeSurvey() }],
        { format: 'original', fontSources }
      )
    );
    const original = output.getPage(1);
    expect(original.getSize()).toEqual({ width: 300, height: 500 });
    expect(original.getCropBox()).toEqual({
      x: 20,
      y: 40,
      width: 200,
      height: 400
    });
    expect(original.getRotation().angle).toBe(90);
  }, 20000);

  it('keeps a portrait original image complete instead of using cover', async () => {
    const bytes = new Uint8Array(
      await sharp({
        create: { width: 90, height: 180, channels: 3, background: '#789abc' }
      })
        .png()
        .toBuffer()
    );
    const output = await PDFDocument.load(
      await generateEntityPdf(
        model,
        [{ key: 'image', fileName: 'portrait.png', isPdf: false, bytes }],
        { fontSources }
      )
    );
    const page = output.getPage(1);
    expect(page.getWidth()).toBeLessThan(page.getHeight());
    const objects = page.node.Resources().lookup(PDFName.of('XObject'));
    const image = objects
      .values()
      .map(reference => output.context.lookup(reference))
      .find(
        stream => stream.dict.get(PDFName.of('Subtype')).toString() === '/Image'
      );
    expect(image.dict.get(PDFName.of('Width')).asNumber()).toBe(90);
    expect(image.dict.get(PDFName.of('Height')).asNumber()).toBe(180);
  }, 20000);

  it('reports an out-of-range physical page with the offending filename', async () => {
    await expect(
      generateEntityPdf(
        model,
        [{ ...attachment, pages: '3', bytes: await makeSurvey() }],
        { fontSources }
      )
    ).rejects.toMatchObject({
      message: 'pdf.pagesError',
      resource: 'survey.pdf'
    });
  });
});

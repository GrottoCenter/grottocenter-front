// @vitest-environment node
import path from 'node:path';
import sharp from 'sharp';
import { createIntl } from 'react-intl';
import {
  PDFDocument,
  PDFName,
  PDFString,
  degrees,
  decodePDFRawStream
} from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import messages from '../../../public/lang/en.json';
import { buildEntrancePdfModel } from '../entrance/model';
import { buildMassifPdfModel } from '../massif/model';
import { PDF_ADAPTERS } from '../adapters';
import { generateEntityPdf } from './generateEntityPdf';
import { PDF_LIMITS } from './limits';

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

it.each([0, 2])(
  'renders every statistics count without duplicate keys when all counts equal %s',
  async count => {
    const territory = buildMassifPdfModel({
      entity: { id: 1, name: 'Equal statistics counts' },
      statistics: {
        nb_entrances: count,
        nb_networks: count,
        diving_caves: count,
        nb_massifs: count
      },
      sections: { statistics: true },
      documents: [],
      attachments: [],
      intl
    });
    const errorSpy = vi.spyOn(console, 'error');
    let task;
    try {
      task = getDocument({
        data: await generateEntityPdf(territory, [], { fontSources })
      });
      const output = await task.promise;
      const page = await output.getPage(1);
      const text = (await page.getTextContent()).items
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ');
      for (const id of ['entrance_count', 'network_count', 'diveable_caves']) {
        expect(text).toContain(
          `${count} ${intl.formatMessage({ id }, { count })}`
        );
      }
      expect(text).toContain(`${count} ${messages.massifs}`);
      expect(errorSpy).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
      await task?.destroy();
    }
  },
  20000
);

it.each(['massif', 'country', 'region'])(
  'generates a real %s PDF with numeric statistics',
  async entityType => {
    const territory = PDF_ADAPTERS[entityType].build({
      entity: {
        id: entityType === 'country' ? 'FR' : 'ARA',
        countryId: 'FR',
        name: 'Territory export',
        networks: [{ id: 1, name: 'Linked network' }]
      },
      statistics: {
        nb_entrances: 1165,
        nb_networks: 9,
        diving_caves: 3,
        avg: { avg_depth: 30, avg_length: 273 },
        total_length: { value: 299165 }
      },
      sections: { properties: true, statistics: true },
      documents: [],
      attachments: [],
      intl
    });
    const task = getDocument({
      data: await generateEntityPdf(territory, [], { fontSources })
    });
    try {
      const output = await task.promise;
      expect(output.numPages).toBe(1);
      const page = await output.getPage(1);
      const text = (await page.getTextContent()).items
        .map(item => item.str)
        .join(' ');
      expect(text).toContain('1,165');
      expect(text).toContain('entrances');
      expect(text.match(/entrances/g)).toHaveLength(1);
      expect(text.match(/networks/g)).toHaveLength(1);
      expect(text).not.toContain('Networks');
      if (entityType === 'massif') expect(text).not.toContain('Information');
      expect(text).toContain('299,165 m');
      expect(text).toContain('30 m');
      expect(text).toContain('273 m');
      expect(text).not.toContain('{count');
    } finally {
      await task.destroy();
    }
  },
  20000
);

it('fits nine linked networks and their dimensions before documents on one page', async () => {
  const networks = Array.from({ length: 9 }, (_item, index) => ({
    id: index + 1,
    name: `Network ${index + 1}`,
    depth: 100 + index,
    length: 10000 + index
  }));
  const massif = buildMassifPdfModel({
    entity: { id: 6487, name: 'Compact massif', networks },
    statistics: { nb_entrances: 1165 },
    sections: { properties: true, networks: true, documents: true },
    documents: [
      {
        id: 12,
        title: 'Document following the networks',
        type: 'Book',
        datePublication: '2026'
      }
    ],
    attachments: [],
    intl
  });
  const task = getDocument({
    data: await generateEntityPdf(massif, [], { fontSources })
  });
  try {
    const output = await task.promise;
    expect(output.numPages).toBe(1);
    const page = await output.getPage(1);
    const text = (await page.getTextContent()).items
      .map(item => item.str)
      .join(' ');
    expect(text).not.toContain('Entrances');
    expect(text).not.toContain('Information');
    expect(text).not.toContain('1,165');
    expect(text).toContain('100 m');
    expect(text).toContain('10,000 m');
    expect(text.indexOf('Document following the networks')).toBeGreaterThan(
      text.indexOf('Network 9')
    );
    expect(text).not.toContain('https://grottocenter.org/ui/caves/');
    const links = (await page.getAnnotations()).map(
      annotation => annotation.url
    );
    for (const network of networks)
      expect(links).toContain(
        `https://grottocenter.org/ui/caves/${network.id}`
      );
  } finally {
    await task.destroy();
  }
}, 20000);

it.each([24, 28, 32])(
  'keeps the statistics heading and its contents together after %s description lines',
  async lines => {
    const massif = buildMassifPdfModel({
      entity: {
        id: 6487,
        name: 'Statistics pagination',
        descriptions: [
          {
            id: 1,
            body: Array.from(
              { length: lines },
              (_item, index) => `Description line ${index + 1}`
            ).join('\n')
          }
        ]
      },
      statistics: {
        nb_entrances: 1165,
        nb_networks: 9,
        diving_caves: 3,
        avg: { avg_depth: 30, avg_length: 273 },
        total_length: { value: 299165, nb_data: 1092 },
        cave_with_max_depth: { id_cave: 1, name_cave: 'Deepest', value: 865 },
        cave_with_max_length: { id_cave: 2, name_cave: 'Longest', value: 53955 }
      },
      sections: { descriptions: true, statistics: true },
      documents: [],
      attachments: [],
      intl
    });
    const task = getDocument({
      data: await generateEntityPdf(massif, [], { fontSources })
    });
    try {
      const output = await task.promise;
      const pages = await Promise.all(
        Array.from({ length: output.numPages }, async (_item, index) => {
          const page = await output.getPage(index + 1);
          return (await page.getTextContent()).items
            .map(item => item.str)
            .join(' ');
        })
      );
      const statisticsPage = pages.find(text =>
        text.includes('More information')
      );
      expect(statisticsPage).toContain('1,165');
      expect(statisticsPage).toContain('299,165 m');
      expect(statisticsPage).toContain('Longest');
      expect(
        pages.filter(text => text.includes('More information'))
      ).toHaveLength(1);
    } finally {
      await task.destroy();
    }
  },
  20000
);
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
  isPdf: true
};

const makeSurvey = async () => {
  const survey = await PDFDocument.create();
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
        const footer = text.items.find(
          item => item.str.startsWith('Grottocenter') && item.transform[5] < 36
        );
        expect(footer).toBeDefined();
        expect(footer.transform[5]).toBeGreaterThan(12);
        expect(footer.transform[5]).toBeLessThan(36);
        expect(text.items.map(item => item.str).join('')).toContain(
          `${number} / ${document.numPages}`
        );
        const pageText = text.items.map(item => item.str).join(' ');
        if (number < document.numPages)
          expect(pageText).toContain('CC BY-SA 3.0 (Text) · ODbL 1.0 (Data)');
        else expect(pageText).not.toContain('CC BY-SA');
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

  it.each(['CC BY-NC 4.0', ''])(
    'puts authors and the document licence only in every appendix footer: %s',
    async license => {
      const file = { ...attachment, documentId: 7 };
      const licensedModel = buildEntrancePdfModel({
        entrance: { id: 1, name: 'Appendix credits' },
        sections: {},
        documents: [
          {
            id: 7,
            title: 'Licensed survey',
            authors: [{ nickname: 'Survey author' }],
            authorsOrganization: [{ name: 'Survey team' }],
            license,
            datePublication: '2026-07-18'
          }
        ],
        attachments: [file],
        intl
      });
      const source = await PDFDocument.create();
      source.addPage([300, 500]).drawText('First source page');
      source.addPage([300, 500]).drawText('Second source page');
      const task = getDocument({
        data: await generateEntityPdf(
          licensedModel,
          [{ ...file, bytes: await source.save() }],
          { fontSources }
        )
      });
      try {
        const document = await task.promise;
        expect(document.numPages).toBe(3);
        // Read each appendix with PDF.js to verify credits repeat only in its footer.
        /* eslint-disable no-await-in-loop */
        for (const number of [2, 3]) {
          const page = await document.getPage(number);
          const { items } = await page.getTextContent();
          const footerText = items
            .filter(item => item.transform[5] < 36)
            .map(item => item.str)
            .join(' ');
          const pageText = items.map(item => item.str).join(' ');
          expect(footerText).toContain(
            ['Grottocenter', 'Survey author, Survey team', license]
              .filter(Boolean)
              .join(' · ')
          );
          expect(footerText).toContain(`${number} / 3`);
          expect(footerText).not.toContain('CC BY-SA');
          expect(footerText).not.toContain('ODbL');
          expect(pageText.split('Survey author')).toHaveLength(2);
          expect(pageText).not.toContain('2026-07-18');
          if (license) expect(pageText.split(license)).toHaveLength(2);
          expect(
            items
              .filter(item => item.transform[5] >= 36)
              .map(item => item.str)
              .join(' ')
          ).not.toContain('Survey author');
        }
        /* eslint-enable no-await-in-loop */
      } finally {
        await task.destroy();
      }
    },
    20000
  );

  it('renders multilingual text and embeds a cropped, rotated survey as vectors on landscape A4', async () => {
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
});

const readPdf = async bytes => {
  const task = getDocument({ data: bytes });
  try {
    const document = await task.promise;
    const pages = await Promise.all(
      Array.from({ length: document.numPages }, async (_value, index) => {
        const page = await document.getPage(index + 1);
        return {
          text: (await page.getTextContent()).items
            .map(item => item.str)
            .join(' '),
          annotations: await page.getAnnotations(),
          size: page.getViewport({ scale: 1 })
        };
      })
    );
    return pages;
  } finally {
    await task.destroy();
  }
};

describe('PDF export fidelity regressions', () => {
  const file = { ...attachment, documentId: 7 };
  const makeCreditedModel = includeDocuments =>
    buildEntrancePdfModel({
      entrance: { id: 1, name: 'Audit cave' },
      sections: { properties: true, documents: includeDocuments },
      documents: [
        {
          id: 7,
          title: 'SurveyTitle',
          type: 'Topographic Drawing',
          authors: [{ nickname: 'SurveyAuthor' }],
          license: 'SurveyLicense'
        }
      ],
      attachments: [file],
      intl,
      generatedAt: new Date('2026-01-02T12:00:00Z')
    });

  it.each([false, true])(
    'keeps native document credits and locates its pages with Documents=%s',
    async includeDocuments => {
      const credited = makeCreditedModel(includeDocuments);
      const pages = await readPdf(
        await generateEntityPdf(
          credited,
          [{ ...file, bytes: await makeSurvey() }],
          { format: 'original', fontSources }
        )
      );
      const sheet = pages
        .slice(0, -1)
        .map(page => page.text)
        .join(' ');
      expect(sheet).toContain('SurveyTitle');
      expect(sheet).toContain('SurveyAuthor');
      expect(sheet).toContain('SurveyLicense');
      expect(sheet).toContain(`Pages: ${pages.length}–${pages.length}`);
      expect(sheet).toContain(`1 / ${pages.length}`);
      expect(sheet).toContain(credited.generatedAt);
    }
  );

  it('keeps image-specific authors and licences beside inline media', async () => {
    const bytes = new Uint8Array(
      await sharp({
        create: { width: 20, height: 10, channels: 3, background: '#789abc' }
      })
        .png()
        .toBuffer()
    );
    const imageModel = buildEntrancePdfModel({
      entrance: { id: 1, name: 'Inline images' },
      sections: { documents: true },
      attachments: [],
      intl,
      documents: [
        {
          id: 8,
          title: 'InlineTitle',
          type: 'Photo',
          authors: [{ nickname: 'InlineAuthor' }],
          license: 'InlineLicense',
          files: [
            {
              id: 9,
              fileName: 'photo.png',
              completePath: 'https://example.org/photo.png'
            }
          ]
        }
      ]
    });
    const image = imageModel.inlineDocuments[0].files[0];
    const pages = await readPdf(
      await generateEntityPdf(imageModel, [], {
        fontSources,
        inlineImages: [{ ...image, bytes }]
      })
    );
    expect(pages[0].text).toContain('InlineAuthor');
    expect(pages[0].text).toContain('InlineLicense');
  });

  it.each(['a4', 'original'])(
    'preserves blank appendix pages in %s mode',
    async format => {
      const source = await PDFDocument.create();
      source.addPage([300, 500]).drawText('First source page');
      source.addPage([300, 500]);
      const pages = await readPdf(
        await generateEntityPdf(
          makeCreditedModel(false),
          [{ ...file, bytes: await source.save() }],
          { format, fontSources }
        )
      );
      expect(pages).toHaveLength(3);
      expect(pages[1].text).toContain('First source page');
      expect(pages[2].text).not.toContain('First source page');
    }
  );

  it.each([
    [0, [20, 40, 100, 120]],
    [90, [40, 100, 120, 180]],
    [180, [100, 280, 180, 360]],
    [270, [280, 20, 360, 100]]
  ])(
    'preserves external links through CropBox and %s degree rotation',
    async (rotation, localRect) => {
      const source = await PDFDocument.load(await makeSurvey());
      const page = source.getPage(0);
      page.setRotation(degrees(rotation));
      page.node.set(
        PDFName.of('Annots'),
        source.context.obj([
          {
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [40, 80, 120, 160],
            A: {
              Type: 'Action',
              S: 'URI',
              URI: PDFString.of('https://example.org/source-link')
            }
          }
        ])
      );
      const pages = await readPdf(
        await generateEntityPdf(
          makeCreditedModel(false),
          [{ ...file, bytes: await source.save() }],
          { fontSources }
        )
      );
      const annex = pages[1];
      const link = annex.annotations.find(
        item => item.url === 'https://example.org/source-link'
      );
      expect(link).toBeDefined();
      const width = rotation % 180 ? 400 : 200;
      const height = rotation % 180 ? 200 : 400;
      const scale = Math.min(
        (annex.size.width - 72) / width,
        (annex.size.height - 126) / height
      );
      const x = (annex.size.width - width * scale) / 2;
      const y = 42 + (annex.size.height - 126 - height * scale) / 2;
      localRect.forEach((value, index) =>
        expect(link.rect[index]).toBeCloseTo(
          value * scale + (index % 2 ? y : x),
          2
        )
      );
    }
  );

  it('exports a TOC-style PDF in A4 while dropping only internal links', async () => {
    const source = await PDFDocument.create();
    const contents = source.addPage([300, 500]);
    const chapter = source.addPage([300, 500]);
    contents.drawText('Contents: First chapter');
    chapter.drawText('First chapter text');
    const destination = source.context.obj([chapter.ref, 'Fit']);
    contents.node.set(
      PDFName.of('Annots'),
      source.context.obj([
        {
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [20, 20, 100, 50],
          Dest: destination
        },
        {
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [20, 60, 100, 90],
          A: { S: 'GoTo', D: destination }
        },
        {
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [20, 100, 100, 130],
          A: { S: 'URI', URI: PDFString.of('https://example.org/source') }
        }
      ])
    );
    const pages = await readPdf(
      await generateEntityPdf(
        makeCreditedModel(false),
        [{ ...file, bytes: await source.save() }],
        { fontSources }
      )
    );
    expect(pages).toHaveLength(3);
    expect(pages[1].text).toContain('Contents: First chapter');
    expect(pages[2].text).toContain('First chapter text');
    const links = pages[1].annotations.filter(item => item.subtype === 'Link');
    expect(
      links.filter(link => link.url === 'https://example.org/source')
    ).toHaveLength(1);
    expect(links.every(link => !link.dest)).toBe(true);
  });

  it('reports unsupported annotations with their source file and allows native export', async () => {
    const source = await PDFDocument.load(await makeSurvey());
    source.getPage(0).node.set(
      PDFName.of('Annots'),
      source.context.obj([
        {
          Type: 'Annot',
          Subtype: 'Text',
          Rect: [40, 80, 120, 160],
          Contents: PDFString.of('Source note')
        }
      ])
    );
    const bytes = await source.save();
    await expect(
      generateEntityPdf(makeCreditedModel(false), [{ ...file, bytes }], {
        fontSources
      })
    ).rejects.toMatchObject({
      message: 'pdf.annotationError',
      resource: 'survey.pdf'
    });
    const pages = await readPdf(
      await generateEntityPdf(makeCreditedModel(false), [{ ...file, bytes }], {
        fontSources,
        format: 'original'
      })
    );
    expect(pages[1].annotations.some(item => item.subtype === 'Text')).toBe(
      true
    );
  });

  it('sets the language on the final document catalog', async () => {
    const output = await PDFDocument.load(
      await generateEntityPdf(makeCreditedModel(false), [], { fontSources })
    );
    expect(output.catalog.get(PDFName.of('Lang')).decodeText()).toBe('en');
  });

  it('rejects excessive appendix pages with the offending filename', async () => {
    const source = await PDFDocument.create();
    for (let index = 0; index <= PDF_LIMITS.pages; index++) source.addPage();
    await expect(
      generateEntityPdf(
        makeCreditedModel(false),
        [{ ...file, bytes: await source.save() }],
        { fontSources }
      )
    ).rejects.toMatchObject({
      message: 'pdf.resourceLimit',
      resource: 'survey.pdf'
    });
  });

  it('copies native page resources once and preserves links to another source page', async () => {
    const source = await PDFDocument.create();
    const first = source.addPage();
    const second = source.addPage();
    const font = source.embedStandardFont('Helvetica');
    first.drawText('First page', { font });
    second.drawText('Second page', { font });
    first.node.set(
      PDFName.of('Annots'),
      source.context.obj([
        {
          Type: 'Annot',
          Subtype: 'Link',
          Rect: [20, 20, 100, 50],
          Dest: [second.ref, 'Fit']
        }
      ])
    );
    const outputBytes = await generateEntityPdf(
      makeCreditedModel(false),
      [{ ...file, bytes: await source.save() }],
      { fontSources, format: 'original' }
    );
    const output = await PDFDocument.load(outputBytes);
    const firstFont = output
      .getPage(1)
      .node.Resources()
      .lookup(PDFName.of('Font'))
      .values()[0];
    const secondFont = output
      .getPage(2)
      .node.Resources()
      .lookup(PDFName.of('Font'))
      .values()[0];
    expect(firstFont.toString()).toBe(secondFont.toString());
    const task = getDocument({ data: outputBytes });
    try {
      const document = await task.promise;
      const page = await document.getPage(2);
      const annotations = await page.getAnnotations();
      expect(await document.getPageIndex(annotations[0].dest[0])).toBe(2);
    } finally {
      await task.destroy();
    }
  });

  it('reports deferred stream failures with the source filename', async () => {
    const source = await PDFDocument.create();
    const page = source.addPage();
    page.node.set(
      PDFName.of('Contents'),
      source.context.register(
        source.context.stream(new Uint8Array([0xff]), {
          Filter: 'UnsupportedFilter'
        })
      )
    );
    await expect(
      generateEntityPdf(
        makeCreditedModel(false),
        [{ ...file, bytes: await source.save() }],
        { fontSources }
      )
    ).rejects.toMatchObject({ resource: 'survey.pdf' });
  });
});

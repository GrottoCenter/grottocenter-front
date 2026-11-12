import { PDFDocument, PDFName, decodePDFRawStream } from 'pdf-lib';

const originalUrl = new URL(
  '/__pdf-fixtures/survey.pdf',
  Cypress.config('baseUrl')
).href;
// Transitions are disabled below; frame sampling can stall in headless Firefox.
const PDF_EXPORT_TEST_OPTIONS = { waitForAnimations: false };
const readDownloadedPdf = (name, timeout = 60000) => {
  // Closing the dialog signals that generation finished and the download started.
  cy.get('[data-testid="pdf-download"]', { timeout }).should('not.exist');
  return (
    cy
      .readFile(`${Cypress.config('downloadsFolder')}/${name}.pdf`, 'base64', {
        timeout
      })
      // Firefox creates the destination before writing the PDF. Retry the read
      // until both the header and end marker exist, then parse the complete file.
      .should(encoded => {
        const contents = atob(encoded).trimEnd();
        expect(contents.startsWith('%PDF-'), 'PDF header').to.equal(true);
        expect(contents.endsWith('%%EOF'), 'complete PDF trailer').to.equal(
          true
        );
      })
      .then(encoded => PDFDocument.load(encoded))
  );
};
const decodeStream = (pdf, ref) =>
  new TextDecoder().decode(
    decodePDFRawStream(pdf.context.lookup(ref)).decode()
  );
const expectFramedAppendix = async (output, encodedSource) => {
  const source = await PDFDocument.load(encodedSource);
  const firstAppendix = output.getPageCount() - source.getPageCount();
  expect(firstAppendix, 'dossier body pages').to.be.greaterThan(0);
  source.getPages().forEach((page, index) => {
    const appendix = output.getPage(firstAppendix + index);
    const forms = appendix.node.Resources().lookup(PDFName.of('XObject'));
    const embeddedContents = (forms?.values() ?? []).map(ref =>
      decodeStream(output, ref)
    );
    page.node
      .Contents()
      .asArray()
      .forEach(ref => {
        const sourceContents = decodeStream(source, ref);
        expect(
          embeddedContents.some(contents => contents.includes(sourceContents)),
          `survey page ${index + 1} is embedded in its appendix`
        ).to.equal(true);
      });
  });
};
const document = {
  id: 3,
  title: 'Original survey',
  type: 'Topographic Drawing',
  license: 'CC BY-SA 3.0',
  authors: [],
  authorsOrganization: [],
  files: [{ id: 4, fileName: 'survey.pdf', completePath: originalUrl }]
};
const entrance = {
  id: 1,
  name: 'PDF export fixture',
  language: 'eng',
  latitude: 45,
  longitude: 5,
  precision: 0,
  isSensitive: false,
  locations: [],
  descriptions: [],
  histories: [],
  riggings: [],
  cave: { id: 2, name: 'PDF export fixture', entrances: [{ id: 1 }] },
  comments: [
    {
      id: 5,
      title: 'Winter access',
      body: 'Avalanche danger. https://example.org/access'
    }
  ],
  documents: [document]
};
const visitEntrance = (isMobile = false, tab = 'information') => {
  cy.visit(`/entrances/1?tab=${tab}`, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      Object.defineProperty(win.navigator, 'pdfViewerEnabled', {
        value: false,
        configurable: true
      });
    }
  });
  cy.checkPageLoaded({ timeout: 20000 });
  if (isMobile) cy.get('button[aria-label="actions"]').first().click();
  cy.get('[data-testid="action-pdf"]', { timeout: 20000 }).click();
  cy.get('[role="dialog"]', { timeout: 20000 }).should('be.visible');
  cy.wait('@documentDetails');
};

describe('entrance PDF download', PDF_EXPORT_TEST_OPTIONS, () => {
  beforeEach(() => {
    cy.on('window:before:load', win => {
      // This suite checks PDF contents and dialog actions. Firefox headless can
      // stall opacity transitions, so keep normal visibility checks without fades.
      const style = win.document.createElement('style');
      style.textContent =
        '*, *::before, *::after { transition: none !important; animation: none !important; }';
      win.document.head.appendChild(style);
    });
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      { body: entrance }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/3' },
      { body: document }
    ).as('documentDetails');
    cy.intercept(originalUrl, {
      headers: { 'content-type': 'application/pdf' },
      fixture: 'entrance-pdf-survey.pdf,null'
    });
    cy.loginAs();
  });

  ['country', 'region'].forEach(entityType => {
    it(`downloads a ${entityType} through the shared worker with statistics`, () => {
      const name =
        entityType === 'country' ? 'France' : `Region export ${Date.now()}`;
      const path =
        entityType === 'country'
          ? '/countries/FR'
          : '/countries/FR/regions/ARA';
      cy.intercept(
        { method: 'GET', pathname: `/api/v1${path}` },
        {
          body: {
            id: entityType === 'country' ? 'FR' : 'FR-ARA',
            name,
            nativeName: name,
            latitude: 45,
            longitude: 5,
            guidelines: [],
            organizations: []
          }
        }
      );
      cy.intercept(
        { method: 'GET', pathname: `/api/v1${path}/statistics` },
        {
          body: {
            nb_caves: 1165,
            nb_networks: 9,
            diving_caves: 3,
            avg: { avg_depth: 30, avg_length: 273 },
            total_length: { value: 299165, nb_data: 1092 }
          }
        }
      ).as('territoryStatistics');
      cy.intercept(
        { method: 'POST', pathname: '/api/v1/regions/search/logical/or' },
        {
          body: {
            results: [
              { type: 'region', iso: 'FR-ARA', name: 'Auvergne-Rhône-Alpes' }
            ]
          }
        }
      );
      cy.intercept('https://tile.openstreetmap.org/**', {
        headers: { 'content-type': 'image/png' },
        fixture: 'entrance-map-tile.png,null'
      });
      cy.visit(path, {
        onBeforeLoad: win => {
          win.localStorage.setItem('selectedLanguage', 'en');
          cy.stub(win, 'print').as('browserPrint');
        }
      });
      cy.wait('@territoryStatistics');
      cy.get('[data-testid="action-pdf"]', { timeout: 20000 }).click();
      cy.get('[role="dialog"]', { timeout: 20000 }).should('be.visible');
      cy.contains('[role="dialog"] label', 'Map').find('input').uncheck();
      cy.contains('[role="dialog"] label', 'More information')
        .find('input')
        .should('be.checked');
      cy.contains('[role="dialog"] label', 'Regions').should('not.exist');
      cy.contains('[role="dialog"]', 'Appendices').should('not.exist');
      cy.get('[data-testid="pdf-download"]').click();
      readDownloadedPdf(name).then(output => {
        expect(output.getTitle()).to.equal(name);
        expect(output.getSubject()).to.equal(
          new URL(`/ui${path}`, Cypress.config('baseUrl')).href
        );
        expect(output.getPageCount()).to.be.greaterThan(0);
      });
      cy.get('@browserPrint').should('not.have.been.called');
    });
  });

  ['network', 'massif'].forEach(entityType => {
    it(`downloads a ${entityType} and its selected appendix through the shared worker`, () => {
      const name = `${entityType} export ${Date.now()}`;
      const path = entityType === 'network' ? '/caves/2' : '/massifs/2';
      cy.intercept(
        { method: 'GET', pathname: `/api/v1${path}` },
        {
          body: {
            id: 2,
            name,
            language: 'eng',
            depth: 30,
            length: 200,
            entrances: [],
            networks: [],
            massifs: [],
            descriptions: [],
            guidelines: [],
            organizations: [],
            exploringOrganizations: [],
            documents: [document]
          }
        }
      );
      cy.visit(path, {
        onBeforeLoad: win => {
          win.localStorage.setItem('selectedLanguage', 'en');
          cy.stub(win, 'print').as('browserPrint');
        }
      });
      cy.get('[data-testid="action-pdf"]', { timeout: 20000 }).click();
      cy.get('[role="dialog"]', { timeout: 20000 }).should('be.visible');
      cy.wait('@documentDetails');
      cy.contains('[role="dialog"] label', 'Original survey')
        .find('input')
        .check();
      cy.get('[data-testid="pdf-download"]').click();
      readDownloadedPdf(name).then(output => {
        expect(output.getTitle()).to.equal(name);
        expect(output.getSubject()).to.equal(
          new URL(`/ui${path}`, Cypress.config('baseUrl')).href
        );
        cy.fixture('entrance-pdf-survey.pdf', 'base64').then(encoded =>
          expectFramedAppendix(output, encoded)
        );
      });
      cy.get('@browserPrint').should('not.have.been.called');
    });
  });

  it('reports an incompatible A4 annotation and retries in original size without losing it', () => {
    const name = `Annotated export ${Date.now()}`;
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      { body: { ...entrance, name } }
    );
    cy.intercept(originalUrl, {
      headers: { 'content-type': 'application/pdf' },
      fixture: 'entrance-pdf-annotated.pdf,null'
    });
    visitEntrance();
    cy.contains('label', 'Original survey').find('input').check();
    cy.get('[data-testid="pdf-download"]').click();
    cy.contains('[role="alert"]', 'cannot be preserved in A4', {
      timeout: 20000
    }).should('contain.text', 'survey.pdf');
    cy.contains('label', 'Original survey').find('input').should('be.checked');
    cy.contains('button', 'Original size').click();
    cy.get('[data-testid="pdf-download"]').click();
    readDownloadedPdf(name).then(output => {
      expect(output.getPage(1).getSize()).to.deep.equal({
        width: 300,
        height: 500
      });
      expect(output.getPage(1).node.Annots().size()).to.equal(1);
    });
  });

  it('exports the complete document through the real worker and preserves original size', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      {
        body: {
          ...entrance,
          riggings: [
            {
              id: 6,
              obstacles: [
                { obstacle: 'P44', rope: 'C60', anchor: '2S+1AN ↓ ➜' }
              ]
            }
          ]
        }
      }
    );
    visitEntrance(false, 'documents');
    cy.contains('label', 'Comments').find('input').should('be.checked');
    cy.contains('label', 'Original survey')
      .find('input')
      .should('not.be.checked')
      .check();
    cy.get('[data-testid="pdf-document-3"]').within(() => {
      cy.contains('survey.pdf').should('not.exist');
      cy.contains('CC BY-SA 3.0').should('not.exist');
      cy.get('input[type="text"]').should('not.exist');
    });
    cy.contains('button', 'Original size').click();
    cy.contains('[role="dialog"] button', 'Preview').should('not.exist');
    cy.get('[data-testid="pdf-download"]').click();
    readDownloadedPdf(entrance.name, 20000).then(output => {
      expect(output.getTitle()).to.equal(entrance.name);
      expect(output.getPageCount()).to.equal(3);
      const fonts = output
        .getPage(0)
        .node.Resources()
        .lookup(PDFName.of('Font'));
      const fontNames = fonts
        .values()
        .map(reference =>
          output.context
            .lookup(reference)
            .get(PDFName.of('BaseFont'))
            .toString()
        );
      expect(fontNames.some(name => name.includes('NotoSansMath'))).to.equal(
        true
      );
      expect(
        fontNames.some(name => name.includes('NotoSansSymbols2'))
      ).to.equal(true);
      expect(output.getPage(2).getSize()).to.deep.equal({
        width: 300,
        height: 500
      });
      expect(output.getPage(2).getRotation().angle).to.equal(90);
    });
    cy.get('[role="dialog"]').should('not.exist');
    cy.contains('[role="tabpanel"]:visible', document.title).should(
      'be.visible'
    );
    cy.get('button[aria-label="Comments"]').click();
    cy.contains('[role="tabpanel"]:visible', 'Winter access').should(
      'be.visible'
    );
    cy.screenshot('entrance-pdf-options', { capture: 'viewport' });
  });

  [false, true].forEach(isMobile => {
    it(`preserves documents and comments after cancelling PDF export on ${isMobile ? 'mobile' : 'desktop'}`, () => {
      if (isMobile) cy.viewport(390, 720);
      visitEntrance(isMobile, 'documents');
      cy.contains('[role="dialog"]', `Download PDF · ${entrance.name}`).should(
        'be.visible'
      );
      cy.get('[role="dialog"]:visible fieldset').should('have.length', 2);
      cy.contains('[role="dialog"] fieldset', 'Main content').within(() => {
        cy.contains('label', 'Documents').find('input').should('be.checked');
        cy.contains('label', 'Comments').find('input').should('be.checked');
        cy.contains('Original survey').should('not.exist');
      });
      cy.contains('[role="dialog"] fieldset', 'Appendices').within(() => {
        cy.contains('One document per page.').should('be.visible');
        cy.contains('label', 'Original survey')
          .find('input')
          .should('not.be.checked')
          .check();
      });
      cy.contains('[role="dialog"] button', 'A4')
        .should('be.visible')
        .and('have.attr', 'aria-pressed', 'true');
      cy.contains('[role="dialog"] button', 'Original size')
        .should('be.visible')
        .and('have.attr', 'aria-pressed', 'false');
      cy.contains('[role="dialog"]', 'Map options').should('not.exist');
      cy.contains('[role="dialog"]', 'Include network descriptions').should(
        'not.exist'
      );
      cy.screenshot(`entrance-pdf-compact-${isMobile ? 'mobile' : 'desktop'}`, {
        capture: 'viewport'
      });
      cy.contains('[role="dialog"] button', 'Cancel').click();
      cy.get('[role="dialog"]:visible').should('not.exist');
      cy.contains('[role="tabpanel"]:visible', document.title).should(
        'be.visible'
      );
      cy.get('button[aria-label="Comments"]').click();
      cy.contains('[role="tabpanel"]:visible', 'Winter access').should(
        'be.visible'
      );
      if (isMobile) cy.get('button[aria-label="actions"]').first().click();
      cy.get('[data-testid="action-pdf"]').click();
      cy.contains('[role="dialog"] button', 'Cancel').click();
      cy.get('[role="dialog"]:visible').should('not.exist');
      cy.contains('[role="tabpanel"]:visible', 'Winter access').should(
        'be.visible'
      );
      cy.get('button[aria-label="Documents"]').click();
      cy.contains('[role="tabpanel"]:visible', document.title).should(
        'be.visible'
      );
    });
  });

  it('selects all compatible files of a document and excludes deselected documents', () => {
    const name = `Document selection ${Date.now()}`;
    const secondUrl = new URL('/__pdf-fixtures/section.pdf', originalUrl).href;
    const unselectedUrl = new URL('/__pdf-fixtures/unselected.pdf', originalUrl)
      .href;
    const multiFileDocument = {
      ...document,
      files: [
        ...document.files,
        { id: 6, fileName: 'section.pdf', completePath: secondUrl },
        {
          id: 7,
          fileName: 'notes.txt',
          completePath: new URL('/__pdf-fixtures/notes.txt', originalUrl).href
        }
      ]
    };
    const otherDocument = {
      ...document,
      id: 8,
      title: 'Other survey',
      files: [
        { id: 9, fileName: 'unselected.pdf', completePath: unselectedUrl }
      ]
    };
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      {
        body: {
          ...entrance,
          name,
          documents: [multiFileDocument, otherDocument]
        }
      }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/3' },
      { body: multiFileDocument }
    ).as('documentDetails');
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/8' },
      { body: otherDocument }
    ).as('otherDocumentDetails');
    cy.intercept(secondUrl, {
      headers: { 'content-type': 'application/pdf' },
      fixture: 'entrance-pdf-survey.pdf,null'
    });
    cy.intercept(unselectedUrl, {
      headers: { 'content-type': 'application/pdf' },
      fixture: 'entrance-pdf-survey.pdf,null'
    }).as('unselectedFile');
    visitEntrance();
    cy.wait('@otherDocumentDetails');
    cy.get('[data-testid="pdf-document-3"]').within(() => {
      cy.get('input[type="checkbox"]').should('have.length', 1).check();
      cy.contains('survey.pdf').should('not.exist');
      cy.contains('section.pdf').should('not.exist');
      cy.contains('notes.txt').should('not.exist');
      cy.get('input[type="text"]').should('not.exist');
    });
    cy.get('[data-testid="pdf-document-8"]').within(() => {
      cy.get('input[type="checkbox"]').check();
    });
    cy.get('[data-testid="pdf-document-8"] input[type="checkbox"]').uncheck();
    cy.contains('button', 'Original size').click();
    cy.get('[data-testid="pdf-download"]').should('be.enabled').click();
    readDownloadedPdf(name).then(output => {
      expect(output.getPageCount()).to.equal(5);
      expect(output.getPage(2).getSize()).to.deep.equal({
        width: 300,
        height: 500
      });
      expect(output.getPage(4).getSize()).to.deep.equal({
        width: 300,
        height: 500
      });
    });
    cy.get('@unselectedFile.all').should('have.length', 0);
  });

  it('exports a selected document even when an unselected document shares its PDF', () => {
    const name = `Shared PDF selection ${Date.now()}`;
    const otherDocument = {
      ...document,
      id: 8,
      title: 'Second survey'
    };
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      { body: { ...entrance, name, documents: [document, otherDocument] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/8' },
      { body: otherDocument }
    ).as('otherDocumentDetails');
    visitEntrance();
    cy.wait('@otherDocumentDetails');
    cy.get('[data-testid="pdf-document-3"] input[type="checkbox"]').should(
      'not.be.checked'
    );
    cy.get('[data-testid="pdf-document-8"] input[type="checkbox"]').check();
    cy.contains('button', 'Original size').click();
    cy.get('[data-testid="pdf-download"]').click();
    readDownloadedPdf(name).then(output => {
      expect(output.getPageCount()).to.equal(3);
      expect(output.getPage(1).getSize()).to.deep.equal({
        width: 300,
        height: 500
      });
    });
  });

  // The intercepted request stays pending across several UI interactions.
  it(
    'allows deselecting an appendix before its details finish loading',
    {
      defaultCommandTimeout: 30000
    },
    () => {
      let releaseDetails;
      const details = new Promise(resolve => {
        releaseDetails = resolve;
      });
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/documents/3' },
        request => details.then(() => request.reply({ body: document }))
      ).as('pendingDetails');
      cy.visit('/entrances/1', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('[data-testid="action-pdf"]', { timeout: 20000 }).click();
      cy.contains('label', 'Documents').find('input').uncheck();
      cy.get('[data-testid="pdf-document-3"] input[type="checkbox"]').check();
      cy.get('[data-testid="pdf-download"]').should('be.disabled');
      cy.get('[data-testid="pdf-document-3"] input[type="checkbox"]').uncheck();
      cy.get('[data-testid="pdf-download"]').should('be.enabled');
      cy.then(() => releaseDetails());
      cy.wait('@pendingDetails');
      cy.get('[data-testid="pdf-download"]').should('be.enabled');
    }
  );

  it('keeps choices after a map failure and allows retry without the unavailable map', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      { body: { ...entrance, precision: 12 } }
    );
    cy.intercept('https://tile.openstreetmap.org/**', { statusCode: 403 });
    visitEntrance();
    cy.get('[data-testid="pdf-download"]').click();
    cy.contains('[role="alert"]', 'Unable to generate the PDF', {
      timeout: 20000
    }).should('be.visible');
    cy.contains('label', 'Comments').find('input').should('be.checked');
    cy.contains('label', /^Map$/).find('input[type="checkbox"]').uncheck();
    cy.get('[data-testid="pdf-download"]').click();
    readDownloadedPdf(entrance.name).then(output => {
      expect(output.getTitle()).to.equal(entrance.name);
    });
  });

  it('includes a dedicated map image from decoded tiles in the downloaded PDF', () => {
    const name = `Map export ${Date.now()}`;
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      { body: { ...entrance, name, precision: 12 } }
    );
    cy.intercept('https://tile.openstreetmap.org/**', request => {
      if (request.resourceType === 'fetch') {
        request.alias = 'pdfMapTile';
        expect(
          request.headers.referer,
          'OSM request identifies the website'
        ).to.equal(`${new URL(Cypress.config('baseUrl')).origin}/`);
      }
      request.reply({
        headers: { 'content-type': 'image/png' },
        fixture: 'entrance-map-tile.png,null'
      });
    });
    visitEntrance();
    cy.document().then(page => {
      const policy = page.createElement('meta');
      policy.name = 'referrer';
      policy.content = 'no-referrer';
      page.head.appendChild(policy);
    });
    cy.get('[data-testid="pdf-download"]').click();
    readDownloadedPdf(name).then(output => {
      const images = output.getPages().flatMap(page => {
        const objects = page.node.Resources().lookup(PDFName.of('XObject'));
        return (objects?.values() ?? [])
          .map(reference => output.context.lookup(reference))
          .filter(
            stream =>
              stream.dict.get(PDFName.of('Subtype')).toString() === '/Image'
          );
      });
      expect(
        images.some(
          image =>
            image.dict.get(PDFName.of('Width')).asNumber() === 1200 &&
            image.dict.get(PDFName.of('Height')).asNumber() === 500
        )
      ).to.equal(true);
    });
    cy.get('@pdfMapTile.all').should('have.length.greaterThan', 0);
  });

  it('downloads independent sections without a preview when document details fail', () => {
    cy.viewport(390, 844);
    const name = `Independent sections ${Date.now()}`;
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      { body: { ...entrance, name } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/3' },
      // A denied document is deterministic: transient 5xx responses trigger retries.
      { statusCode: 403 }
    ).as('documentDetails');
    visitEntrance(true);
    cy.contains('[role="alert"]', 'Unable to generate the PDF', {
      timeout: 20000
    }).should('be.visible');
    cy.get('[data-testid="pdf-download"]').should('be.disabled');
    cy.get('[data-testid="pdf-download"]').then($download => {
      const primary = $download[0].getBoundingClientRect();
      cy.contains('[role="dialog"] button', /^Cancel$/).then($cancel => {
        const secondary = $cancel[0].getBoundingClientRect();
        expect(primary.left).to.be.closeTo(secondary.left, 0.5);
        expect(primary.right).to.be.closeTo(secondary.right, 0.5);
        expect(primary.bottom).to.be.lessThan(secondary.top);
        expect(secondary.bottom).to.be.at.most(844);
      });
    });
    cy.screenshot('entrance-pdf-mobile', { capture: 'viewport' });
    cy.contains('[role="dialog"] label', 'Documents').find('input').uncheck();
    cy.get('[data-testid="pdf-download"]').should('be.enabled').click();
    readDownloadedPdf(name).then(output => {
      expect(output.getTitle()).to.equal(name);
      expect(output.getPageCount()).to.equal(1);
    });
    cy.screenshot('entrance-pdf-mobile', { capture: 'viewport' });
  });

  it('uses the same export dialog and worker for a network', () => {
    const name = `Network export ${Date.now()}`;
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/caves/2' },
      {
        body: {
          id: 2,
          name,
          depth: 120,
          length: 2500,
          entrances: [{ ...entrance, precision: 12, documents: [] }],
          descriptions: [
            {
              id: 20,
              title: 'Network description',
              body: 'Connected underground passages.'
            }
          ]
        }
      }
    );
    cy.intercept('https://tile.openstreetmap.org/**', {
      headers: { 'content-type': 'image/png' },
      fixture: 'entrance-map-tile.png,null'
    });

    cy.visit('/caves/2', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('[data-testid="action-pdf"]', { timeout: 20000 }).click();
    cy.contains('label', 'Entrances list').find('input').should('be.checked');
    cy.contains('label', 'Descriptions').find('input').uncheck();
    cy.contains('[role="dialog"] button', 'Cancel').click();
    cy.get('[data-testid="action-pdf"]').click();
    cy.contains('label', 'Descriptions').find('input').should('not.be.checked');
    cy.contains('[role="dialog"] button', 'Preview').should('not.exist');
    cy.get('[data-testid="pdf-download"]').click();
    cy.get('[role="dialog"]', { timeout: 20000 }).should('not.exist');
    readDownloadedPdf(name).then(output => {
      expect(output.getTitle()).to.equal(name);
      expect(output.getPageCount()).to.be.greaterThan(0);
    });
  });

  it('completes an inline image gallery across pages through the real worker', () => {
    const name = `Inline gallery ${Date.now()}`;
    const imageUrl = new URL('/__pdf-fixtures/gallery.png', originalUrl).href;
    const gallery = {
      ...document,
      title: 'Photo collection',
      type: 'Photograph',
      files: Array.from({ length: 8 }, (_item, index) => ({
        id: index + 30,
        fileName: `photo-${index}.png`,
        completePath: imageUrl
      }))
    };
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      { body: { ...entrance, name, documents: [gallery] } }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/documents/3' },
      { body: gallery }
    ).as('documentDetails');
    cy.intercept(imageUrl, {
      headers: { 'content-type': 'image/png' },
      fixture: 'entrance-map-tile.png,null'
    });
    visitEntrance();
    cy.get('[data-testid="pdf-download"]').click();
    readDownloadedPdf(name).then(output => {
      expect(output.getPageCount()).to.be.greaterThan(1);
    });
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('exports a massif outline and selected full-page documents through the shared worker', () => {
    const name = `Massif export ${Date.now()}`;
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/massifs/4' },
      {
        body: {
          id: 4,
          name,
          geogPolygon: JSON.stringify({
            type: 'Polygon',
            coordinates: [
              [
                [5, 45],
                [5.1, 45],
                [5.1, 45.1],
                [5, 45]
              ]
            ]
          }),
          descriptions: [
            { id: 21, title: 'Massif description', body: 'Limestone plateau.' }
          ],
          documents: [document],
          networks: [],
          organizations: [],
          guidelines: []
        }
      }
    );
    cy.intercept('https://tile.openstreetmap.org/**', {
      headers: { 'content-type': 'image/png' },
      fixture: 'entrance-map-tile.png,null'
    });
    cy.visit('/massifs/4', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
    });
    cy.get('button[aria-label="Documents"]', { timeout: 20000 }).click();
    cy.get('[data-testid="action-pdf"]', { timeout: 20000 }).click();
    cy.wait('@documentDetails');
    cy.contains('label', 'Original survey').find('input').check();
    cy.contains('button', 'Original size').click();
    cy.contains('button', 'Original size').trigger('mouseout');
    cy.contains('button', 'Original size').blur();
    cy.get('[role="tooltip"]').should('not.exist');
    cy.contains('[role="dialog"] button', 'Cancel').click();
    cy.get('[data-testid="action-pdf"]').click();
    cy.contains('label', 'Original survey').find('input').should('be.checked');
    cy.contains('button', 'Original size').should(
      'have.attr',
      'aria-pressed',
      'true'
    );
    cy.get('[data-testid="pdf-download"]').click();
    readDownloadedPdf(name).then(output => {
      expect(output.getTitle()).to.equal(name);
      expect(output.getPageCount()).to.be.greaterThan(2);
    });
    cy.get('[role="dialog"]').should('not.exist');
    cy.contains('[role="tabpanel"]:visible', document.title).should(
      'be.visible'
    );
  });
});

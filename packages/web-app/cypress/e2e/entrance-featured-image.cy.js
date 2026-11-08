const files = ['first', 'second'].map((name, index) => ({
  id: index + 10,
  fileName: `${name}.jpg`,
  isValidated: true,
  completePath: `https://images.example.org/originals/${name}.jpg`,
  thumbnails: { small: `https://images.example.org/thumbnails/${name}.webp` }
}));
const entrance = {
  id: 1,
  name: 'Featured entrance',
  language: 'eng',
  latitude: 45.5,
  longitude: 5.5,
  altitude: 100,
  city: 'Corrençon-en-Vercors',
  region: 'Auvergne-Rhône-Alpes',
  locations: [],
  descriptions: [],
  histories: [],
  riggings: [],
  comments: [],
  cave: {
    id: 2,
    name: 'Featured entrance',
    language: 'eng',
    depth: 0,
    length: 0,
    temperature: 0,
    entrances: [{ id: 1 }]
  },
  documents: [
    {
      id: 3,
      title: 'Entrance photos',
      type: 'Image',
      files,
      authors: [],
      authorsOrganization: []
    }
  ],
  featuredFile: files[1]
};
const imageBody =
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="640"><rect width="320" height="640" fill="#7c9a6c"/></svg>';
const visit = path =>
  cy.visit(path, {
    onBeforeLoad: win => {
      win.localStorage.setItem('selectedLanguage', 'en');
      win.localStorage.setItem('mapTourSeen_v2', 'true');
      win.localStorage.setItem(
        'grottocenter_selectedLayers',
        JSON.stringify({
          entrances: true,
          networks: false,
          massifs: false,
          organizations: false
        })
      );
      win.localStorage.removeItem('grottocenter_activeEntranceFilters');
      win.localStorage.removeItem('grottocenter_activeQualityFilters');
      win.localStorage.setItem('grottocenter_minInterest', '0');
    }
  });

const clickCenterMarker = () =>
  cy
    .get('.leaflet-map-pane')
    .should('not.have.class', 'leaflet-pan-anim')
    .then(() => {
      cy.get('.leaflet-container').then(([container]) => {
        const bounds = container.getBoundingClientRect();
        // Canvas padding changes when Leaflet pans. Use the visible map's
        // center and prevent Cypress from scrolling after reading its bounds.
        cy.get('.leaflet-overlay-pane canvas', { timeout: 20000 }).trigger(
          'click',
          {
            clientX: bounds.left + bounds.width / 2,
            clientY: bounds.top + bounds.height / 2,
            scrollBehavior: false
          }
        );
      });
    });

describe('Entrance featured image', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/languages' },
      { body: [{ id: 'eng', refName: 'English' }] }
    );
    cy.intercept(
      { method: 'GET', pathname: /\/api\/v1\/geoloc\/.*Coordinates$/ },
      { body: [] }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/entrances' },
      { body: [] }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      { body: entrance }
    ).as('entrance');
    cy.intercept('https://images.example.org/thumbnails/**', {
      headers: { 'content-type': 'image/svg+xml' },
      body: imageBody
    }).as('thumbnail');
    cy.intercept('https://images.example.org/originals/**', {
      headers: { 'content-type': 'image/svg+xml' },
      body: imageBody
    }).as('original');
  });

  [1280, 768, 390].forEach(width => {
    it(`shows the image section and its preview without changing the selection at width ${width}`, () => {
      cy.viewport(width, 900);
      cy.loginAs();
      visit('/entrances/1/edit');
      cy.get('[data-testid="featured-image-toggle"]', { timeout: 20000 })
        .should('be.visible')
        .and(element => {
          if (width < 600) {
            const sectionWidth = element
              .closest('[data-testid="featured-image-select"]')
              .width();
            expect(element.outerWidth()).to.be.closeTo(sectionWidth, 1);
          } else {
            expect(element.outerWidth()).to.be.at.most(256);
          }
        })
        .click();
      cy.get('[data-testid="featured-image-toggle"]').should('not.be.visible');
      cy.get('[data-testid="featured-image-options"]').should('be.visible');
      cy.get('[data-testid="featured-image-select"]').within(() => {
        cy.get('[role="radiogroup"] input').should('have.length', 3);
        cy.get('[role="radiogroup"]').should('not.contain.text', 'first.jpg');
        cy.get('[role="radiogroup"] label').each(card => {
          expect(card.width()).to.be.at.most(208);
        });
        cy.get(
          '[role="radiogroup"] [aria-label="Preview Entrance photos — Image 1 of 2"]'
        ).click();
      });
      cy.get('[data-testid="lightbox-image"]').should(
        'have.attr',
        'src',
        files[0].completePath
      );
      cy.get('[aria-label="Close"]').click();
      cy.get('[data-testid="featured-image-select"] input[value="11"]').should(
        'be.checked'
      );
      cy.get('[data-testid="featured-image-select"] input[value=""]').check();
      cy.contains('button', 'Close').click();
      cy.get('[data-testid="featured-image-options"]').should('not.exist');
      cy.get('[data-testid="featured-image-toggle"]').should(
        'contain.text',
        'No featured image'
      );
      cy.get('[data-testid="featured-image-select"]').should(element => {
        expect(element[0].scrollWidth).to.be.at.most(element[0].clientWidth);
      });
    });

    it(`opens the common gallery on the chosen file at width ${width}`, () => {
      cy.viewport(width, 900);
      visit('/entrances/1');
      cy.get('[data-testid="entrance-featured-image"]', { timeout: 20000 })
        .should('be.visible')
        .and(element =>
          expect(element.height()).to.be.at.most(width < 600 ? 180 : 144)
        );
      cy.get('[data-testid="entrance-featured-image"]').should(image => {
        const location = image.closest('[data-testid="entrance-location"]');
        expect(location).to.have.length(width < 600 ? 0 : 1);
        if (width >= 600) expect(image.outerWidth()).to.be.at.most(128);
      });
      cy.get('[data-testid="entrance-location"]').should(location => {
        expect(location[0].scrollWidth).to.be.at.most(location[0].clientWidth);
      });
      cy.get('@original.all').should('have.length', 0);
      cy.get('[data-testid="entrance-featured-image"]').click();
      cy.get('[data-testid="lightbox-image"]').should(
        'have.attr',
        'src',
        files[1].completePath
      );
      cy.get('[aria-label="Previous image"]').click();
      cy.get('[data-testid="lightbox-image"]').should(
        'have.attr',
        'src',
        files[0].completePath
      );
      cy.get('[aria-label="Close"]').click();
      cy.get('[data-testid="lightbox-image"]').should('not.exist');
    });
  });

  it('shows compact image cards, cancels locally, then saves a replacement and removal', () => {
    cy.viewport(1280, 900);
    cy.loginAs();
    let currentEntrance = entrance;
    cy.intercept({ method: 'GET', pathname: '/api/v1/entrances/1' }, request =>
      request.reply({ body: currentEntrance })
    );
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/entrances/1' },
      request => {
        const featuredFile =
          files.find(file => file.id === request.body.featuredFile) ?? null;
        currentEntrance = { ...entrance, featuredFile };
        request.reply({ body: currentEntrance });
      }
    ).as('update');
    visit('/entrances/1/edit');
    cy.get('[data-testid="featured-image-toggle"]', { timeout: 20000 })
      .should('have.attr', 'aria-expanded', 'false')
      .click();
    cy.get('[data-testid="featured-image-select"] input[value="11"]').should(
      'be.checked'
    );
    cy.get('[data-testid="featured-image-select"] input[value="10"]').check();
    cy.get('[data-testid="featured-image-toggle"]').should('not.be.visible');
    cy.contains('button', 'Cancel').click();
    cy.get('[data-testid="entrance-featured-image"] img', {
      timeout: 20000
    }).should('have.attr', 'src', files[1].thumbnails.small);
    cy.get('@update.all').should('have.length', 0);
    visit('/entrances/1/edit');
    cy.get('[data-testid="featured-image-toggle"]').click();
    cy.get('[data-testid="featured-image-select"] input[value="10"]').check();
    cy.get('[data-testid="form-action-row"] button[type="submit"]').click();
    cy.wait('@update').its('request.body.featuredFile').should('eq', 10);
    cy.get('[data-testid="entrance-featured-image"] img', {
      timeout: 20000
    }).should('have.attr', 'src', files[0].thumbnails.small);
    visit('/entrances/1/edit');
    cy.get('[data-testid="featured-image-toggle"]').click();
    cy.get('[data-testid="featured-image-select"] input[value=""]').check();
    cy.get('[data-testid="form-action-row"] button[type="submit"]').click();
    cy.wait('@update').its('request.body.featuredFile').should('be.null');
    cy.get('[data-testid="entrance-featured-image"]').should('not.exist');
  });

  it('preserves a usable page when the image cannot load', () => {
    cy.viewport(1280, 900);
    cy.intercept('https://images.example.org/**', { statusCode: 404 });
    visit('/entrances/1');
    cy.wait('@entrance');
    cy.get('[data-testid="entrance-featured-image"]').should('not.exist');
    cy.get('h1').should('contain.text', entrance.name);
    cy.get('[data-testid="entrance-properties"]').then(properties => {
      cy.get('.leaflet-container').should(map => {
        expect(
          Math.abs(
            map[0].getBoundingClientRect().top -
              properties[0].getBoundingClientRect().top
          )
        ).to.be.lessThan(4);
      });
    });
  });

  it('keeps the edited values when the selected file becomes ineligible', () => {
    cy.viewport(1280, 900);
    cy.loginAs();
    cy.intercept(
      { method: 'PUT', pathname: '/api/v1/entrances/1' },
      {
        statusCode: 400,
        delay: 200,
        body: { message: 'File of id 10 is not validated.' }
      }
    ).as('rejected');
    visit('/entrances/1/edit');
    cy.get('[data-testid="featured-image-toggle"]', { timeout: 20000 }).click();
    cy.get('[data-testid="featured-image-select"] input[value="10"]').check();
    cy.contains('label', 'Altitude')
      .invoke('attr', 'for')
      .then(id => {
        cy.get('input')
          .filter((_index, input) => input.id === id)
          .as('altitude');
        cy.get('@altitude').clear();
        cy.get('@altitude').type('222');
      });
    cy.get('[data-testid="form-action-row"] button[type="submit"]').click();
    cy.wait('@rejected');
    cy.location('pathname').should('include', '/entrances/1/edit');
    cy.contains('[role="alert"]', 'A server error occurred').should(
      'be.visible'
    );
    cy.contains('label', 'Altitude')
      .invoke('attr', 'for')
      .then(id => {
        cy.get('input')
          .filter((_index, input) => input.id === id)
          .should('have.value', '222');
      });
    cy.get('[data-testid="featured-image-toggle"]').click();
    cy.get('[data-testid="featured-image-select"] input[value="10"]').should(
      'be.checked'
    );
  });

  it('keeps an entrance without images compact and explains the empty selector', () => {
    cy.loginAs();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      { body: { ...entrance, documents: [], featuredFile: null } }
    );
    visit('/entrances/1');
    cy.get('h1', { timeout: 20000 }).should('contain.text', entrance.name);
    cy.get('[data-testid="entrance-featured-image"]').should('not.exist');
    visit('/entrances/1/edit');
    cy.get('[data-testid="featured-image-select"]', { timeout: 20000 }).should(
      'contain.text',
      'Link a document containing an image'
    );
    cy.get('[data-testid="featured-image-toggle"]').should('not.exist');
    cy.get('[data-testid="featured-image-options"]').should('not.exist');
  });

  it('only requests the clicked marker detail and reuses it on reopening', () => {
    cy.viewport(1280, 900);
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/entrancesCoordinates' },
      { body: [[5.5, 45.5, 1, 0, null]] }
    );
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/geoloc/entrances' },
      {
        body: [
          {
            id: 1,
            name: entrance.name,
            latitude: 45.5,
            longitude: 5.5,
            depth: 0,
            length: 0
          }
        ]
      }
    ).as('markers');
    visit('/map/45.5,5.5,16');
    cy.wait('@markers');
    cy.get('@entrance.all').should('have.length', 0);
    clickCenterMarker();
    cy.get('.map-popup-photo img', { timeout: 10000 }).should(
      'have.attr',
      'src',
      files[1].thumbnails.small
    );
    cy.get('@entrance.all').should('have.length', 1);
    cy.get('.leaflet-popup-close-button').trigger('click');
    clickCenterMarker();
    cy.get('.map-popup-photo img').should('be.visible');
    cy.get('@entrance.all').should('have.length', 1);
  });
});

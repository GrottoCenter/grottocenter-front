import L from 'leaflet';

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

const clickEntranceMarker = () =>
  cy
    .get('.leaflet-map-pane')
    .should('not.have.class', 'leaflet-pan-anim')
    .then(() => {
      cy.get('.leaflet-container').then(([container]) => {
        const bounds = container.getBoundingClientRect();
        const win = container.ownerDocument.defaultView;
        const { lat, lng, zoom } = JSON.parse(
          win.localStorage.getItem('grottocenter_map_position')
        );
        // Autopan moves the marker away from the map's center. Project its
        // coordinates against the saved viewport before clicking the canvas.
        const offset = L.CRS.EPSG3857.latLngToPoint(
          L.latLng(45.5, 5.5),
          zoom
        ).subtract(L.CRS.EPSG3857.latLngToPoint(L.latLng(lat, lng), zoom));
        cy.get('.leaflet-overlay-pane canvas', { timeout: 20000 }).trigger(
          'click',
          {
            clientX: bounds.left + bounds.width / 2 + offset.x,
            clientY: bounds.top + bounds.height / 2 + offset.y,
            scrollBehavior: false
          }
        );
      });
    });

const visitMap = () => {
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
          city: entrance.city,
          region: entrance.region,
          depth: 120,
          length: 2500
        }
      ]
    }
  ).as('markers');
  visit('/map/45.5,5.5,16');
  cy.wait('@markers');
};

const expectPopupLayout = layout => {
  cy.get('[data-testid="entrance-popup"]')
    .should('have.attr', 'data-photo-layout', layout)
    .and(popup => {
      const root = popup[0];
      const bounds = root.closest('.leaflet-popup').getBoundingClientRect();
      const mapBounds = root
        .closest('.leaflet-container')
        .getBoundingClientRect();
      expect(bounds.left).to.be.at.least(mapBounds.left);
      expect(bounds.right).to.be.at.most(mapBounds.right);
      expect(bounds.top).to.be.at.least(mapBounds.top);
      expect(bounds.bottom).to.be.at.most(
        Math.min(mapBounds.bottom, root.ownerDocument.defaultView.innerHeight)
      );
      const photo = root
        .querySelector('[data-testid="entrance-popup-photo"]')
        .getBoundingClientRect();
      const details = root.querySelector('.map-popup-details');
      expect(details.scrollWidth).to.be.at.most(details.clientWidth);
      const detailsBounds = details.getBoundingClientRect();
      if (layout === 'side') {
        expect(photo.right).to.be.at.most(detailsBounds.left);
      } else {
        expect(photo.bottom).to.be.at.most(detailsBounds.top);
      }
    });
  cy.get('[data-testid="entrance-popup-photo"] img')
    .should('be.visible')
    .and('have.css', 'object-fit', 'contain')
    .and('have.css', 'border-top-left-radius', '8px')
    .and(image => {
      const bounds = image[0].getBoundingClientRect();
      // Leaflet's transforms can add subpixel rounding to the measured size.
      expect(bounds.height).to.be.at.most(160.5);
      const popupWidth = image[0]
        .closest('[data-testid="entrance-popup"]')
        .getBoundingClientRect().width;
      expect(bounds.width).to.be.at.most(popupWidth + 0.5);
      if (image[0].naturalWidth > image[0].naturalHeight) {
        const maxHeight = parseFloat(
          image[0]
            .closest('.leaflet-popup')
            .style.getPropertyValue('--map-popup-photo-height')
        );
        expect(bounds.width).to.be.closeTo(
          Math.min(
            popupWidth,
            (maxHeight * image[0].naturalWidth) / image[0].naturalHeight
          ),
          1
        );
      }
      expect(bounds.width / bounds.height).to.be.closeTo(
        image[0].naturalWidth / image[0].naturalHeight,
        0.01
      );
    });
  cy.get('[aria-label="Close popup"]').should('be.visible');
};

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
          expect(element.height()).to.be.at.most(width < 600 ? 240 : 144)
        );
      cy.get('[data-testid="entrance-featured-image"]').should(image => {
        const location = image.closest('[data-testid="entrance-location"]');
        expect(location).to.have.length(width < 600 ? 0 : 1);
        if (width >= 600) expect(image.outerWidth()).to.be.at.most(128);
      });
      cy.get('[data-testid="entrance-featured-image"] img')
        .should('be.visible')
        .and('have.css', 'object-fit', 'contain')
        .and('have.css', 'border-top-left-radius', '8px')
        .and(image => {
          expect(image[0].naturalHeight).to.be.greaterThan(
            image[0].naturalWidth
          );
          const photo = image[0].getBoundingClientRect();
          const frame = image[0].closest('button').getBoundingClientRect();
          expect(photo.width / photo.height).to.be.closeTo(
            image[0].naturalWidth / image[0].naturalHeight,
            0.01
          );
          expect(frame.width).to.be.closeTo(photo.width, 1);
          expect(frame.height).to.be.closeTo(photo.height, 1);
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

    it(`fits a landscape photo without letterboxing at width ${width}`, () => {
      cy.viewport(width, 900);
      cy.intercept('https://images.example.org/thumbnails/**', {
        headers: { 'content-type': 'image/svg+xml' },
        body: imageBody.replaceAll(
          'width="320" height="640"',
          'width="640" height="320"'
        )
      });
      visit('/entrances/1');
      cy.get('[data-testid="entrance-featured-image"] img', {
        timeout: 20000
      })
        .should('be.visible')
        .and(image => {
          expect(image[0].naturalWidth).to.be.greaterThan(0);
          const photo = image[0].getBoundingClientRect();
          const frame = image[0].closest('button').getBoundingClientRect();
          // Density-corrected intrinsic sizes and layout can round independently.
          expect(photo.height).to.be.closeTo(photo.width / 2, 1);
          expect(frame.width).to.be.closeTo(photo.width, 1);
          expect(frame.height).to.be.closeTo(photo.height, 1);
          expect(frame.height).to.be.at.most(width < 600 ? 240 : 144);
          if (width < 600) {
            const container = image[0]
              .closest('button')
              .parentElement.getBoundingClientRect();
            expect(frame.left - container.left).to.be.closeTo(
              container.right - frame.right,
              1
            );
          }
        });
    });
  });

  [390, 768].forEach(width => {
    it(
      `reserves the previous loading footprint before the image loads at width ${width}`,
      { defaultCommandTimeout: 20000 },
      () => {
        cy.viewport(width, 900);
        // Firefox can reuse decoded images even while revalidating their requests.
        const thumbnailUrl = `https://images.example.org/thumbnails/loading-${width}.webp`;
        let releaseEntrance;
        const entranceReady = new Cypress.Promise(resolve => {
          releaseEntrance = resolve;
        });
        // Render the eager image only after visit finishes, so its held response
        // cannot block window load and prevent the assertions from running.
        cy.intercept(
          { method: 'GET', pathname: '/api/v1/entrances/1' },
          request =>
            entranceReady.then(() =>
              request.reply({
                body: {
                  ...entrance,
                  featuredFile: {
                    ...files[1],
                    thumbnails: { small: thumbnailUrl }
                  }
                }
              })
            )
        );
        let releaseImage;
        const imageReady = new Cypress.Promise(resolve => {
          releaseImage = resolve;
        });
        cy.intercept(thumbnailUrl, request =>
          imageReady.then(() =>
            request.reply({
              headers: { 'content-type': 'image/svg+xml' },
              body: imageBody.replaceAll(
                'width="320" height="640"',
                'width="640" height="320"'
              )
            })
          )
        ).as('loadingThumbnail');
        visit('/entrances/1');
        cy.then(() => releaseEntrance());
        cy.get('[data-testid="entrance-featured-image"]')
          .should(frame => {
            const bounds = frame[0].getBoundingClientRect();
            expect(frame.find('img')[0].naturalWidth).to.equal(0);
            const badge = frame
              .find('[data-testid="entrance-featured-image-badge"]')[0]
              .getBoundingClientRect();
            expect(badge.width).to.be.closeTo(28, 1);
            expect(badge.height).to.be.closeTo(28, 1);
            expect(badge.top).to.be.at.least(bounds.top);
            expect(badge.left).to.be.at.least(bounds.left);
            expect(badge.bottom).to.be.at.most(bounds.bottom);
            expect(badge.right).to.be.at.most(bounds.right);
            expect(bounds.height).to.be.closeTo(width < 600 ? 180 : 144, 1);
            if (width < 600) {
              expect(bounds.width).to.be.greaterThan(240);
            } else {
              expect(bounds.width).to.be.closeTo(96, 1);
            }
          })
          .then(() => releaseImage());
        cy.wait('@loadingThumbnail');
        cy.get('[data-testid="entrance-featured-image"] img').should(image => {
          expect(image[0].naturalWidth).to.be.greaterThan(0);
          const photo = image[0].getBoundingClientRect();
          const frame = image[0].closest('button').getBoundingClientRect();
          expect(photo.height).to.be.closeTo(photo.width / 2, 1);
          expect(frame.height).to.be.closeTo(photo.height, 1);
          expect(frame.width).to.be.closeTo(photo.width, 1);
        });
      }
    );
  });

  [
    ['16:9', 16 / 9],
    ['3:1', 3],
    ['6:1', 6],
    ['1:3', 1 / 3],
    ['1:6', 1 / 6],
    ['1:12', 1 / 12]
  ].forEach(([label, aspectRatio]) => {
    it(`keeps the gallery usable without an oversized badge for a ${label} photo`, () => {
      cy.viewport(768, 900);
      cy.intercept('https://images.example.org/thumbnails/**', {
        headers: { 'content-type': 'image/svg+xml' },
        body: imageBody.replaceAll(
          'width="320" height="640"',
          `width="${360 * aspectRatio}" height="360"`
        )
      });
      visit('/entrances/1');
      cy.get('[data-testid="entrance-featured-image"] img', {
        timeout: 20000
      })
        .should('have.css', 'object-fit', 'contain')
        .and(image => {
          expect(image[0].naturalWidth).to.be.greaterThan(0);
          const photo = image[0].getBoundingClientRect();
          const frame = image[0].closest('button').getBoundingClientRect();
          expect(frame.width).to.be.at.least(24);
          expect(frame.height).to.be.at.least(24);
          if (aspectRatio >= 1) {
            expect(frame.width).to.be.closeTo(96, 1);
            expect(frame.height).to.be.closeTo(
              Math.max(24, frame.width / aspectRatio),
              1
            );
          } else {
            expect(frame.height).to.be.closeTo(144, 1);
            expect(frame.width).to.be.closeTo(
              Math.max(24, frame.height * aspectRatio),
              1
            );
          }
          expect(photo.width).to.be.closeTo(frame.width, 1);
          expect(photo.height).to.be.closeTo(frame.height, 1);
        });
      cy.get('[data-testid="entrance-featured-image-badge"]')
        .should('be.visible')
        .and(badge => {
          const bounds = badge[0].getBoundingClientRect();
          const frame = badge[0].closest('button').getBoundingClientRect();
          expect(bounds.height).to.be.closeTo(18, 1);
          expect(bounds.top).to.be.at.least(frame.top);
          expect(bounds.left).to.be.at.least(frame.left);
          expect(bounds.bottom).to.be.at.most(frame.bottom);
          expect(bounds.right).to.be.at.most(frame.right);
        });
      cy.get('[data-testid="entrance-featured-image"]').click();
      cy.get('[data-testid="lightbox-image"]').should(
        'have.attr',
        'src',
        files[1].completePath
      );
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

  it('keeps keyboard focus when clearing an unavailable image with no candidates', () => {
    cy.viewport(1280, 900);
    cy.loginAs();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/1' },
      { body: { ...entrance, documents: [] } }
    );
    visit('/entrances/1/edit');
    cy.get('[data-testid="featured-image-toggle"]', { timeout: 20000 })
      .should('be.visible')
      .and(toggle => {
        const description = toggle[0]
          .getAttribute('aria-describedby')
          .split(' ')
          .map(id => toggle[0].ownerDocument.getElementById(id).textContent)
          .join(' ');
        expect(description).to.include(
          'The saved featured image is no longer available.'
        );
      })
      .click();
    cy.get('[data-testid="featured-image-select"] input[value=""]')
      .should('be.focused')
      .and('not.be.checked')
      .check();
    cy.get('[data-testid="featured-image-options"]').should('be.visible');
    cy.focused().should('have.value', '');
    cy.contains('button', 'Close').click();
    cy.get('[data-testid="featured-image-options"]').should('not.exist');
    cy.focused()
      .should('have.attr', 'tabindex', '-1')
      .and('contain.text', 'Link a document containing an image');
  });

  it('only requests the clicked marker detail and reuses it on reopening', () => {
    cy.viewport(1280, 900);
    visitMap();
    cy.get('@entrance.all').should('have.length', 0);
    clickEntranceMarker();
    cy.get('.map-popup-photo img', { timeout: 10000 }).should(
      'have.attr',
      'src',
      files[1].thumbnails.small
    );
    cy.get('@entrance.all').should('have.length', 1);
    cy.get('.leaflet-popup-close-button').trigger('click');
    clickEntranceMarker();
    cy.get('.map-popup-photo img').should('be.visible');
    cy.get('@entrance.all').should('have.length', 1);
  });

  [
    { width: 1280, height: 900, portraitLayout: 'side' },
    { width: 480, height: 844, portraitLayout: 'side' },
    { width: 390, height: 844, portraitLayout: 'top' },
    { width: 320, height: 568, portraitLayout: 'top' },
    { width: 844, height: 390, portraitLayout: 'side' }
  ].forEach(({ width, height, portraitLayout }) => {
    ['portrait', 'landscape'].forEach(orientation => {
      it(`fits a ${orientation} photo and its popup after tapping at ${width} × ${height}`, () => {
        cy.viewport(width, height);
        const isPortrait = orientation === 'portrait';
        cy.intercept('https://images.example.org/thumbnails/**', {
          delay: 300,
          headers: { 'content-type': 'image/svg+xml' },
          body: isPortrait
            ? imageBody
            : imageBody.replaceAll(
                'width="320" height="640"',
                'width="640" height="320"'
              )
        });
        visitMap();
        clickEntranceMarker();
        cy.get('[data-testid="entrance-popup-photo"] img', {
          timeout: 10000
        }).should(image => expect(image[0].naturalWidth).to.be.greaterThan(0));
        expectPopupLayout(isPortrait ? portraitLayout : 'top');
        cy.get('[data-testid="entrance-popup-photo"]').should(
          'have.attr',
          'href',
          '/ui/entrances/1'
        );
        cy.get('[aria-label="Close popup"]').click({ scrollBehavior: false });
        cy.get('[data-testid="entrance-popup"]').should('not.exist');
      });
    });
  });

  it('adapts an open portrait popup when the map becomes narrower', () => {
    cy.viewport(1280, 900);
    visitMap();
    clickEntranceMarker();
    expectPopupLayout('side');
    cy.viewport(320, 568);
    expectPopupLayout('top');
    cy.viewport(480, 844);
    expectPopupLayout('side');
    cy.get('@entrance.all').should('have.length', 1);
  });

  [1280, 320].forEach(width => {
    it(`keeps a popup without an image readable at width ${width}`, () => {
      cy.viewport(width, 700);
      cy.intercept(
        { method: 'GET', pathname: '/api/v1/entrances/1' },
        { body: { ...entrance, featuredFile: null } }
      ).as('entrance');
      visitMap();
      clickEntranceMarker();
      cy.wait('@entrance');
      cy.get('[data-testid="entrance-popup-photo"]').should('not.exist');
      cy.get('[data-testid="entrance-popup"]').should(popup => {
        expect(popup.width()).to.be.within(200, 260);
        expect(popup[0].scrollWidth).to.be.at.most(popup[0].clientWidth);
      });
      cy.get('[data-testid="entrance-popup"] a').should(
        'contain.text',
        entrance.name
      );
      cy.get('[aria-label="Close popup"]').click({ scrollBehavior: false });
      cy.get('[data-testid="entrance-popup"]').should('not.exist');
    });
  });
});

const video = {
  fileName: 'cave.avi',
  completePath: 'https://videos.example.org/cave.avi'
};
const playableVideo = {
  fileName: 'playable.webm',
  completePath: '/video-tests/playable.webm'
};

describe('Entrance mixed media gallery', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(
      { method: 'GET', pathname: '/api/v1/entrances/42' },
      {
        body: {
          id: 42,
          name: 'Test entrance',
          isDeleted: false,
          documents: [
            {
              id: 1,
              title: 'Cave media',
              type: 'Moving Image',
              isValidated: true,
              files: [
                video,
                { fileName: 'plan.png', completePath: '/video-tests/plan.png' },
                playableVideo
              ]
            }
          ],
          massifs: [],
          locations: [],
          descriptions: [],
          riggings: [],
          histories: [],
          comments: []
        }
      }
    );
    cy.intercept('/video-tests/plan.png', {
      headers: { 'content-type': 'image/svg+xml' },
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"><rect width="64" height="32" fill="white"/></svg>'
    });
    cy.intercept(video.completePath, { statusCode: 415, body: '' }).as('video');
    cy.intercept('/video-tests/playable.webm', {
      headers: { 'content-type': 'video/webm' },
      fixture: 'media-preview.webm,null'
    }).as('playableVideo');
  });

  [1280, 390].forEach(width => {
    it(`opens a video on demand with an accessible fallback at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.visit('/entrances/42?tab=documents', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('[aria-label="Open video: cave.avi"]', {
        timeout: 30000
      }).scrollIntoView();
      cy.get('[aria-label="Open video: cave.avi"]').should('be.visible');
      cy.get('@video.all').should('have.length', 0);
      cy.get('[data-testid="video-preview"]').should('not.exist');
      cy.get('[aria-label="Open video: cave.avi"]').click();
      cy.wait('@video');
      cy.contains('This video cannot be played in your browser.').should(
        'be.visible'
      );
      cy.contains('a', 'Open the original file').should(
        'have.attr',
        'href',
        video.completePath
      );
      cy.get('[aria-label="Next media"]').click();
      cy.get('[data-testid="lightbox-image"]').should('be.visible');
      cy.get('[aria-label="Close"]').focus();
      cy.get('[aria-label="Close"]').type('{esc}');
      cy.get('[role="dialog"][aria-label="plan.png"]').should('not.exist');
      cy.get('[aria-label="Open video: cave.avi"]').should('have.focus');
    });

    it(`plays supported media and stops it on navigation at ${width}px`, () => {
      let activeVideo;
      cy.viewport(width, 900);
      cy.visit('/entrances/42?tab=documents', {
        onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'en')
      });
      cy.get('[aria-label="Open video: playable.webm"]', {
        timeout: 30000
      }).scrollIntoView();
      cy.get('@playableVideo.all').should('have.length', 0);
      cy.get('[aria-label="Open video: playable.webm"]').click();
      cy.wait('@playableVideo');
      cy.get('[data-testid="video-preview"]')
        .as('activeVideo')
        .should(([element]) => {
          expect(element.paused).to.equal(true);
          expect(element.autoplay).to.equal(false);
          expect(element.controls).to.equal(true);
        });
      cy.viewport(900, 390);
      let captionHeight;
      let stageHeight;
      let playerHeight;
      cy.get('[data-testid="lightbox-caption"]').then(([caption]) => {
        captionHeight = caption.getBoundingClientRect().height;
      });
      cy.get('[data-testid="lightbox-video-stage"]').then(([stage]) => {
        stageHeight = stage.getBoundingClientRect().height;
        const player = stage.querySelector('video');
        playerHeight = player.getBoundingClientRect().height;
        const caption = stage.parentElement.querySelector(
          '[data-testid="lightbox-caption"]'
        );
        expect(player.getBoundingClientRect().bottom).to.be.at.most(
          caption.getBoundingClientRect().top
        );
        expect(stage.getBoundingClientRect().bottom).to.be.closeTo(
          caption.getBoundingClientRect().top,
          1
        );
      });
      cy.get('[aria-label="Show or hide media caption"]').click();
      cy.get('[data-testid="lightbox-caption"]').should('not.be.visible');
      cy.get('[data-testid="lightbox-video-stage"]').should(([stage]) => {
        expect(stage.getBoundingClientRect().height).to.be.greaterThan(
          stageHeight
        );
        expect(
          stage.getBoundingClientRect().height - stageHeight
        ).to.be.lessThan(captionHeight + 1);
        expect(
          stage.querySelector('video').getBoundingClientRect().height
        ).to.be.greaterThan(playerHeight);
      });
      cy.get('[aria-label="Show or hide media caption"]').click();
      cy.get('[data-testid="lightbox-video-stage"]').should(([stage]) => {
        expect(stage.getBoundingClientRect().height).to.be.closeTo(
          stageHeight,
          1
        );
      });
      cy.get('@activeVideo').then(([element]) => {
        activeVideo = element;
        return element.play();
      });
      cy.get('@activeVideo').should(([element]) => {
        expect(element.currentTime).to.be.greaterThan(0);
        expect(element.paused).to.equal(false);
      });
      cy.get('[aria-label="Previous media"]').click();
      cy.get('[data-testid="lightbox-image"]').should('be.visible');
      cy.then(() => {
        expect(activeVideo.paused).to.equal(true);
        expect(activeVideo.hasAttribute('src')).to.equal(false);
      });
      cy.get('[aria-label="Close"]').click();
      cy.get('[aria-label="Open video: playable.webm"]').should('have.focus');
    });
  });
});

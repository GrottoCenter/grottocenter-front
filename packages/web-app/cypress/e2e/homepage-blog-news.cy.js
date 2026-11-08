const article = {
  title: 'News from the caving community',
  text: 'Discover the latest activities of the Wikicaves association.',
  link: 'https://blog-en.grottocenter.org/test-article',
  image: '/blog-tests/article.svg',
  day: 6,
  month: 'Nov'
};

const mockFeed = (body, options = {}) =>
  cy
    .intercept({ method: 'GET', pathname: '/api/rss/EN' }, { body, ...options })
    .as('news');

const showNews = () => {
  cy.visit('/');
  cy.wait('@news');
  cy.get('[data-testid="blog-news-section"]').scrollIntoView();
};

describe('Homepage blog news', () => {
  beforeEach(() => {
    cy.disableServiceWorker();
    cy.mockApiCatchAll();
    cy.intercept(article.image, req => {
      expect(req.headers).not.to.have.property('referer');
      req.reply({
        headers: { 'content-type': 'image/svg+xml' },
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="480"><rect width="320" height="480" fill="brown"/></svg>'
      });
    });
  });

  [1280, 390].forEach(width => {
    it(`shows the article image and accessible links at ${width}px`, () => {
      cy.viewport(width, 900);
      mockFeed(article);
      showNews();

      cy.get('[data-testid="news-card-image"]')
        .should('have.attr', 'src', article.image)
        .and('have.attr', 'alt', '')
        .and('have.attr', 'referrerpolicy', 'no-referrer')
        .and('have.css', 'object-fit', 'contain')
        .should($image => {
          expect($image[0].naturalWidth).to.equal(320);
        });
      cy.get('[data-testid="news-card-link"]').should(
        'have.css',
        'flex-direction',
        width < 600 ? 'column' : 'row'
      );
      cy.get('[data-testid="blog-news-section"]').within(() => {
        cy.get('[data-testid="news-card"]').find('a').should('have.length', 1);
        cy.get('[data-testid="news-card-link"]')
          .should('have.attr', 'href', article.link)
          .and('have.attr', 'target', '_blank')
          .and('have.attr', 'rel', 'noopener noreferrer');
        cy.get('[data-testid="news-card-link"]').focus();
        cy.get('[data-testid="news-card-link"]')
          .should('have.focus')
          .and('have.css', 'outline-style', 'solid')
          .and('have.css', 'outline-width', '2px');
        cy.get('[data-testid="news-card-link"]').then($link => {
          cy.get('h3').should('have.id', $link.attr('aria-labelledby'));
        });
        cy.contains('h3', article.title).should('be.visible');
        cy.get('[data-testid="news-card-image"]')
          .closest('a')
          .should('have.attr', 'href', article.link);
        cy.get('[data-testid="news-card-link"]')
          .find('a, button, [tabindex]')
          .should('not.exist');
        cy.get('[data-testid="news-card-arrow"]')
          .should('be.visible')
          .and('have.attr', 'aria-hidden', 'true');
      });
      cy.get('[data-testid="news-card"]').should($card => {
        const { left, right } = $card[0].getBoundingClientRect();
        expect(left).to.be.at.least(0);
        expect(right).to.be.at.most(width);
      });
      cy.get('[data-testid="blog-news-section"]').screenshot(
        `blog-news-${width}`
      );
    });
  });

  [null, undefined].forEach(image => {
    it(`uses the local image when the API image is ${image}`, () => {
      mockFeed({ ...article, image });
      showNews();
      cy.get('[data-testid="news-card-image"]')
        .should('have.attr', 'src', '/images/homepage/news.jpg')
        .should($image => {
          expect($image[0].naturalWidth).to.be.greaterThan(0);
        });
    });
  });

  it('uses the local image when the article image fails to load', () => {
    cy.intercept('/blog-tests/missing.jpg', { statusCode: 404, body: '' });
    mockFeed({ ...article, image: '/blog-tests/missing.jpg' });
    showNews();
    cy.get('[data-testid="news-card-image"]')
      .should('have.attr', 'src', '/images/homepage/news.jpg')
      .should($image => {
        expect($image[0].naturalWidth).to.be.greaterThan(0);
      });
    cy.contains('h3', article.title).should('be.visible');
  });

  it('keeps an article with a title and no excerpt readable', () => {
    mockFeed({ ...article, text: '' });
    showNews();
    cy.get('[data-testid="news-card"]').should('be.visible');
    cy.contains('h3', article.title).should('be.visible');
  });

  it('keeps an article without a URL readable without an interactive control', () => {
    mockFeed({ ...article, link: null });
    showNews();
    cy.get('[data-testid="news-card"]').within(() => {
      cy.contains('h3', article.title).should('be.visible');
      cy.get('a, button, [tabindex]').should('not.exist');
      cy.get('[data-testid="news-card-arrow"]').should('not.exist');
    });
  });

  it('shows a placeholder while waiting for the feed', () => {
    mockFeed(article, { delay: 2000 });
    cy.visit('/');
    cy.get('[data-testid="news-card-loading"]', { timeout: 30000 }).should(
      'have.attr',
      'aria-busy',
      'true'
    );
    cy.wait('@news');
    cy.get('[data-testid="news-card"]').should('exist');
  });

  it('keeps the blog accessible when its feed is unavailable', () => {
    mockFeed({ message: 'Unavailable' }, { statusCode: 503 });
    showNews();
    cy.get('[data-testid="news-card-unavailable"]', { timeout: 15000 })
      .should('be.visible')
      .and('contain', 'News is temporarily unavailable.');
    cy.contains(
      '[data-testid="blog-news-section"] a',
      'See all blog news'
    ).should('have.attr', 'href', 'https://blog-en.grottocenter.org/');
  });

  it('uses the French feed and blog for a French locale', () => {
    cy.intercept(
      { method: 'GET', pathname: '/api/rss/FR' },
      { body: { ...article, title: 'Actualités de la communauté' } }
    ).as('frenchNews');
    cy.visit('/', {
      onBeforeLoad: win => win.localStorage.setItem('selectedLanguage', 'fr')
    });
    cy.wait('@frenchNews');
    cy.get('[data-testid="blog-news-section"]').scrollIntoView();
    cy.contains('h3', 'Actualités de la communauté').should('be.visible');
    cy.contains(
      '[data-testid="blog-news-section"] a',
      'Toutes les actualités du blog'
    ).should('have.attr', 'href', 'https://blog-fr.grottocenter.org/');
  });
});

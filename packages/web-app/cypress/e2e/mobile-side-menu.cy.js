describe('Mobile side menu', () => {
  beforeEach(() => {
    cy.viewport(390, 844);
    cy.mockApiCatchAll();
    cy.visit('/');
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('[data-testid="mobile-side-menu"]').should($paper => {
      expect($paper[0].getBoundingClientRect().left).to.be.closeTo(0, 1);
    });
  });

  it('continues closing from the finger position after a partial swipe', () => {
    cy.get('[data-testid="mobile-side-menu"]').then($paper => {
      const paper = $paper[0];
      const win = paper.ownerDocument.defaultView;
      const startX = Math.min(paper.getBoundingClientRect().width - 25, 220);
      const dispatchTouch = (type, x) => {
        // Firefox does not expose a constructible Touch. The drawer only
        // reads the touch lists and coordinates, so use a DOM event with
        // those properties in every browser.
        const touch = {
          identifier: 1,
          target: paper,
          clientX: x,
          clientY: 32,
          pageX: x,
          pageY: 32
        };
        const event = new win.Event(type, {
          bubbles: true,
          cancelable: true
        });
        Object.defineProperties(event, {
          touches: { value: type === 'touchend' ? [] : [touch] },
          changedTouches: { value: [touch] }
        });
        paper.dispatchEvent(event);
      };

      return new Cypress.Promise(resolve => {
        dispatchTouch('touchstart', startX);
        let step = 0;
        const move = () => {
          step++;
          dispatchTouch('touchmove', startX - step * 20);
          if (step < 8) {
            win.setTimeout(move, 30);
            return;
          }
          const beforeRelease = paper.getBoundingClientRect().left;
          expect(beforeRelease).to.be.lessThan(-70);
          const frames = [];
          const sample = () => {
            frames.push(paper.getBoundingClientRect().left);
            if (frames.length < 24) {
              win.requestAnimationFrame(sample);
              return;
            }
            // A reset to the fully open position is the Slide regression
            // that required pinning MUI 7.3.9 before this migration.
            expect(Math.max(...frames)).to.be.at.most(beforeRelease + 5);
            resolve();
          };
          win.requestAnimationFrame(sample);
          dispatchTouch('touchend', startX - step * 20);
        };
        win.setTimeout(move, 30);
      });
    });
    cy.get('[data-testid="mobile-side-menu"]').should('not.be.visible');
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('[data-testid="mobile-side-menu"]').should('be.visible');
  });
});

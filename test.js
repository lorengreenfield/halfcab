import chai from 'chai'
import dirtyChai from 'dirty-chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import jsdomGlobal from 'jsdom-global'

const {expect} = chai
chai.use(dirtyChai)
chai.use(sinonChai)
chai.use(dirtyChai)

let halfcab, ssr, html, defineRoute, gotoRoute, formField, cache, updateState, injectMarkdown, formIsValid,
  css, state, getRouteComponent, nextTick

function intialData (dataInitial) {
  let el = document.createElement('div')
  el.setAttribute('data-initial', dataInitial)
  document.body.appendChild(el)
  
  // Also ensure a root element exists for tests that target #root
  let root = document.createElement('div')
  root.id = 'root'
  document.body.appendChild(root)
}

describe('halfcab', () => {

  describe('Server', () => {
    before(async () => {
      jsdomGlobal()
      intialData('eyJjb250YWN0Ijp7InRpdGxlIjoiQ29udGFjdCBVcyJ9LCJyb3V0ZXIiOnsicGF0aG5hbWUiOiIvIn19')
      let halfcabModule = await import('./halfcab.mjs')
      ;({
        ssr,
        html,
        defineRoute,
        gotoRoute,
        formField,
        cache,
        updateState,
        injectMarkdown,
        formIsValid,
        css,
        getRouteComponent,
        nextTick
      } = halfcabModule)
      halfcab = halfcabModule.default
    })
    it('Produces a string when doing SSR', () => {
      let style = css`
        .myStyle {
          width: 100px;
        }
      `
      // Use html instead of serverHtml (which depended on nanohtml)
      // lit-html on server via ssr() should return string
      let {componentsString, stylesString} = ssr(html`
        <div class="${style.myStyle}" @input=${() => {
      }}></div>
      `)
      expect(typeof componentsString === 'string').to.be.true()
    })
  })

  describe('Client', () => {

    before(async () => {
      jsdomGlobal()
      intialData('eyJjb250YWN0Ijp7InRpdGxlIjoiQ29udGFjdCBVcyJ9LCJyb3V0ZXIiOnsicGF0aG5hbWUiOiIvIn19')
      let halfcabModule = await import('./halfcab.mjs')
      ;({
        ssr,
        html,
        defineRoute,
        gotoRoute,
        formField,
        cache,
        updateState,
        injectMarkdown,
        formIsValid,
        css,
        getRouteComponent,
        nextTick
      } = halfcabModule)
      halfcab = halfcabModule.default
    })

    it('Produces a TemplateResult when rendering', () => {
      let el = html`
         <div @input=${() => {
      }}></div>
      `
      // Check for Lit TemplateResult marker
      expect(el['_$litType$']).to.exist()
    })

    it('Produces a TemplateResult wrapping as a reusable component', () => {
      let el = args => html`
          <div @input=${() => {
      }}></div>
      `
      expect(el({})['_$litType$']).to.exist()
    })

    it('Runs halfcab function without error', () => {
      return halfcab({
        el: '#root',
        components () {
          return html `<div></div>`
        }
      })
        .then(({rootEl}) => {
          expect(typeof rootEl === 'object').to.be.true()
        })
    })

    it('updating state causes a rerender with state', (done) => {
      halfcab({
        el: '#root', // Ensure el is passed so rootEl is the container
        components (args) {
          return html`<div>${args.testing || ''}</div>`
        }
      })
        .then(({rootEl, state}) => {
          updateState({testing: 'works'})
          nextTick(()=> {
            expect(rootEl.innerHTML.includes('works')).to.be.true()
            done()
          })

        })
    })

    it('updates state without merging arrays when told to', () => {
      return halfcab({
        el: '#root',
        components () {
          return html `<div></div>`
        }
      })
        .then(({rootEl, state}) => {
          updateState({
            myArray: ['1', '2', '3']
          })

          updateState({
            myArray: ['4']
          }, {
            arrayMerge: false
          })
          expect(state.myArray.length).to.equal(1)
        })

    })

    it('updating state without deepmerge overwrites objects', () => {
      var style = css`
                .myStyle {
                    width: 100px;
                }
            `
      return halfcab({
        el: '#root',
        components (args) {
          return html `<div class="${style.myStyle}">${args.testing.inner || ''}</div>`
        }
      })
        .then(({rootEl, state}) => {
          updateState({testing: {inner: 'works'}})
          updateState({testing: {inner2: 'works'}}, {
            deepMerge: false
          })
          expect(rootEl.innerHTML.indexOf('works')).to.equal(-1)
        })
    })

    it('injects external content without error', () => {
      return halfcab({
        el: '#root',
        components (args) {
          return html `<div>${injectMarkdown('### Heading')}</div>`
        }
      })
        .then(({rootEl, state}) => {
          expect(rootEl.innerHTML.indexOf('###')).to.equal(-1)
          expect(rootEl.innerHTML.indexOf('<h3')).not.to.equal(-1)
        })
    })

    it('injects markdown without wrapper without error', () => {
      return halfcab({
        el: '#root',
        components (args) {
          return html `<div>${injectMarkdown('### Heading', {wrapper: false})}</div>`
        }
      })
        .then(({rootEl, state}) => {
          expect(rootEl.innerHTML.indexOf('###')).to.equal(-1)
          expect(rootEl.innerHTML.indexOf('<h3')).not.to.equal(-1)
        })
    })

    describe('formField', () => {

      it('Returns a function', () => {
        var holdingPen = {}
        var output = formField(holdingPen, 'test')

        expect(typeof output === 'function').to.be.true()
      })

      it('Sets a property within the valid object of the same name', () => {
        var holdingPen = {}
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'text',
            validity: {
              valid: false
            }
          }
        }
        output(e)

        let validFound
        Object.getOwnPropertySymbols(holdingPen).forEach(symb => {
          if (symb.toString().indexOf('Symbol(valid)') === 0 && holdingPen[symb] !== undefined) {
            validFound = symb
          }
        })

        expect(validFound).to.exist()
      })

      it('Runs OK if a valid object is already present', () => {
        var holdingPen = {valid: {}}
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'text',
            validity: {
              valid: false
            }
          }
        }
        output(e)

        expect(holdingPen.valid.test).to.exist()
      })

      it('Sets checkboxes without error', () => {
        var holdingPen = {}
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'checkbox',
            validity: {
              valid: false
            },
            checked: true
          }
        }
        output(e)

        let validFound
        Object.getOwnPropertySymbols(holdingPen).forEach(symb => {
          if (symb.toString().indexOf('Symbol(valid)') === 0 && holdingPen[symb] !== undefined) {
            validFound = symb
          }
        })

        expect(validFound).to.exist()
      })

      it('Sets radio buttons without error', () => {
        var holdingPen = {}
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'radio',
            validity: {
              valid: false
            },
            checked: true
          }
        }
        output(e)

        let validFound
        Object.getOwnPropertySymbols(holdingPen).forEach(symb => {
          if (symb.toString().indexOf('Symbol(valid)') === 0 && holdingPen[symb] !== undefined) {
            validFound = symb
          }
        })

        expect(validFound).to.exist()
      })

      it('Validates a form without error', () => {
        var holdingPen = {
          test: '',
          [Symbol('valid')]: {
            test: false
          }
        }
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'radio',
            validity: {
              valid: true
            },
            checked: true
          }
        }
        output(e)

        expect(formIsValid(holdingPen)).to.be.true()
      })

      it('Validates when valid object already present', () => {
        var holdingPen = {
          test: '',
          [Symbol('valid')]: {
            test: false
          },
          valid: {}
        }
        var output = formField(holdingPen, 'test')
        var e = {
          currentTarget: {
            type: 'radio',
            validity: {
              valid: true
            },
            checked: true
          }
        }
        output(e)

        expect(formIsValid(holdingPen)).to.be.true()
      })
    })

    describe('routing', () => {
      let windowStub
      after(() => {
        windowStub.restore()
      })
      before(() => {
        windowStub = sinon.stub(window.history, 'pushState')
      })

      it('Makes the route available when using defineRoute', () => {

        defineRoute({
          path: '/testFakeRoute', title: 'Report Pal', callback: output => {
            updateState({
              showContact: true
            })
          }
        })

        return halfcab({
          el: '#root',
          components () {
            return html `<div></div>`
          }
        })
          .then(rootEl => {

            let routing = () => {
              gotoRoute('/testFakeRoute')
            }
            expect(routing).to.not.throw()
          })

      })

      it(`Switches to the 404 route when a route doesn't exist`, () => {
        defineRoute({
          path: '/404',
          title: 'Not Found',
          component: '404Component'
        })

        return halfcab({
          el: '#root',
          components () {
            return html `<div></div>`
          }
        })
          .then(({state}) => {
            gotoRoute('/thisIsAFakeRoute')
            expect(state.router.component).to.equal('404Component')
          })

      })
    })

    it('has initial data injects router when its not there to start with', () => {
      defineRoute({path: '/routeWithComponent', component: {fakeComponent: true}})
      expect(getRouteComponent('/routeWithComponent').fakeComponent)
        .to
        .be
        .true()
    })

    it(`Doesn't clone when merging`, (done) => {
      halfcab({
        el: '#root',
        components () {
          return html `<div></div>`
        }
      })
        .then(({rootEl, state}) => {
          let myObject = {
            test: 1,
            fake: 'String2'
          }
          updateState({
            myObject
          })

          nextTick(() => {
            state.myObject.test = 2
            updateState({
              myOtherObject: {
                test: 1,
                fake: 'String2'
              }
            })

            nextTick(() => {
              expect(state.myObject.test).to.equal(2)
              expect(myObject.test).to.equal(2)
              done()
            }, 20)
          })
        })
    })
  })
})

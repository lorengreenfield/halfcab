import chai, { expect } from 'chai'
import dirtyChai from 'dirty-chai'
import { noCallThru } from 'proxyquire'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

chai.use(dirtyChai)
chai.use(sinonChai)

const proxyquire = noCallThru()
chai.use(dirtyChai)
import jsdomGlobal from 'jsdom-global'
import decache from 'decache'

let jsdom = jsdomGlobal()
let halfcab
let halfcabModule
let {ssr, html, defineRoute, gotoRoute, formField, cache, updateState, injectMarkdown, formIsValid, emptyBody, css, state, getRouteComponent} = {}

function serverMode () {
  jsdom && jsdom()
  decache('bel')
  halfcabModule = proxyquire('./halfcab', {})
  ;({ssr, html, css} = halfcabModule)
}

function browserMode (dataInitial) {
  global.requestAnimationFrame = (fcn) => {
    fcn()
  }
  decache('bel')
  jsdom = jsdomGlobal()
  if (dataInitial) {
    let el = document.createElement('div')
    el.setAttribute('data-initial', dataInitial)
    document.body.appendChild(el)
  }
  halfcabModule = proxyquire('./halfcab', {})
  ;({
    html,
    defineRoute,
    gotoRoute,
    formField,
    cache,
    updateState,
    injectMarkdown,
    formIsValid,
    emptyBody,
    css,
    state,
    getRouteComponent
  } = halfcabModule)
  halfcab = halfcabModule.default
}

describe('halfcab', () => {

  describe('Server', () => {
    before(done => {
      serverMode()
      done()
    })

    it('Produces a string when doing SSR', () => {
      var style = css`
                .myStyle {
                    width: 100px;
                }
            `
      var {componentsString, stylesString} = ssr(html`
            <div class="${style.myStyle}" oninput=${() => {}}></div>
        `)
      expect(typeof componentsString === 'string').to.be.true()
    })
  })

  describe('Client', () => {
    before(done => {
      browserMode()
      done()
    })

    it('Produces an HTML element when rendering', () => {
      var el = html`
                <div oninput=${() => {}}></div>
            `
      expect(el instanceof HTMLDivElement).to.be.true()
    })

    it('Produces an HTML element wrapping as a reusable component', () => {
      var el = cache(() => html`
                <div oninput=${() => {}}></div>
            `, {})
      expect(el instanceof HTMLDivElement).to.be.true()
    })

    it('Runs halfcab function without error', () => {
      return halfcab({
        el: '#root',
        baseName: 'Resorts Interactive',
        baseApiPath: '/api/webroutes',
        components () {
          return html `<div></div>`
        }
      })
        .then(rootEl => {
          expect(typeof rootEl === 'object').to.be.true()
        })
    })

    it('updating state causes a rerender with state', () => {
      return halfcab({
        baseName: 'Resorts Interactive',
        baseApiPath: '/api/webroutes',
        components (args) {
          return html `<div>${args.testing || ''}</div>`
        }
      })
        .then(rootEl => {
          updateState({testing: 'works'})
          expect(rootEl.innerHTML.indexOf('works') !== -1).to.be.true()
        })
    })

    it('updates state without merging arrays when told to', () => {
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

    it('updating state without deepmerge overwrites objects', () => {
      var style = css`
                .myStyle {
                    width: 100px;
                }
            `
      return halfcab({
        baseName: 'Resorts Interactive',
        baseApiPath: '/api/webroutes',
        components (args) {
          return html `<div class="${style.myStyle}">${args.testing.inner || ''}</div>`
        }
      })
        .then(rootEl => {
          updateState({testing: {inner: 'works'}})
          updateState({testing: {inner2: 'works'}}, {
            deepMerge: false
          })
          expect(rootEl.innerHTML.indexOf('works')).to.equal(-1)
        })
    })

    it('injects external content without error', () => {
      return halfcab({
        baseName: 'Resorts Interactive',
        baseApiPath: '/api/webroutes',
        components (args) {
          return html `<div>${injectMarkdown('### Heading')}</div>`
        }
      })
        .then(rootEl => {
          emptyBody()
          expect(rootEl.innerHTML.indexOf('###')).to.equal(-1)
          expect(rootEl.innerHTML.indexOf('<h3')).not.to.equal(-1)
        })
    })

    it('injects markdown without wrapper without error', () => {
      return halfcab({
        baseName: 'Resorts Interactive',
        baseApiPath: '/api/webroutes',
        components (args) {
          return html `<div>${injectMarkdown('### Heading', {wrapper: false})}</div>`
        }
      })
        .then(rootEl => {
          emptyBody()
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

        expect(holdingPen.valid.test).to.exist()
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

        expect(holdingPen.valid.test).to.exist()
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

        expect(holdingPen.valid.test).to.exist()
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
          baseName: 'Resorts Interactive',
          components () {
            return html `<div></div>`
          }
        })
          .then(rootEl => {

            let routing = () => {
              gotoRoute('/testFakeRoute')
            }
            expect(routing).to.not.throw()//made it out of the try catch, must be fine
          })

      })

      it(`Throws an error when a route doesn't exist`, () => {

        return halfcab({
          baseName: 'Resorts Interactive',
          components () {
            return html `<div></div>`
          }
        })
          .then(rootEl => {

            let routing = () => {
              gotoRoute('/thisIsAFakeRoute')
            }
            expect(routing).to.throw()//made it out of the try catch, must be fine
          })

      })

      it(`postUpdate is called after an update`, async () => {

        let postUpdate = sinon.spy()
        let hc = halfcab({
          baseName: 'Resorts Interactive',
          components () {
            return html `<div></div>`
          },
          postUpdate
        })

        updateState({
          nothing: 'something'
        })

        expect(postUpdate).to.have.been.calledOnce()
      })
    })

    it('has initial data with router property to be available', () => {
      browserMode('eyJjb250YWN0Rm9ybSI6eyJzZW5kRGlzYWJsZWQiOmZhbHNlLCJzaG93VGhhbmtzIjpmYWxzZX0sImxvZ2luIjp7ImRpc2FibGVkIjpmYWxzZX0sImxvYWRpbmciOmZhbHNlLCJyb3V0ZXIiOnsicGF0aG5hbWUiOiIvIn0sInNob3dDb250YWN0Ijp0cnVlLCJwcm9kdWN0cyI6W3sibmFtZSI6IlNlZU1vbnN0ZXIiLCJwcm9kdWN0VHlwZSI6IkRpZ2l0YWwgU2lnbmFnZSIsImRlc2NyaXB0aW9uIjoiRGlnaXRhbCBzaWduYWdlIGJ1aWx0IGZvciBza2kgYXJlYXMuIiwicHJpY2UiOiIkMywyMDAgVVNEIHBlciB3aW50ZXIiLCJsb2dvIjp7InVybCI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS82Z1pjUDY0bVRtMjJtMDJZYW9NR09RL2Q3ZmVmOTBlZWFmMjkyZDA0NzBjM2I2OWE4MmIyYzY1L3NlZW1vbnN0ZXIuc3ZnIiwibmFtZSI6IlNlZU1vbnN0ZXIgTG9nbyJ9LCJkZXRhaWxTZWN0aW9ucyI6W3sibmFtZSI6IldoYXQgaXMgU2VlTW9uc3RlciIsImRlc2NyaXB0aW9uIjoiIyMjIFNlZU1vbnN0ZXIgZW5hYmxlcyB5b3UgdG8gZGlzcGxheSBkeW5hbWljIG1lc3NhZ2VzIG9uIHNjcmVlbnMgYXJvdW5kIHlvdXIgc2tpIGFyZWEgYW5kIG9uIGhvdGVsIHJvb20gVFZzLCBhbGwgbWFuYWdlZCBvdmVyIHRoZSBJbnRlcm5ldC4iLCJsaXN0IjoiIiwibWVkaWEiOnsiZmlsZSI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS9iZm1BTlB0TWZRQ1F1UTRRa2FXVUUvMjQ5NjQyNTc4YmZhMGVjMTczYmUzOGNhOTMyNGFhMTMvc2VlbW9uc3Rlci0xLTItMy5wbmciLCJ3aWR0aCI6ODY2fSwibGluayI6IiJ9LHsibmFtZSI6IlNlZU1vbnN0ZXIgSW5jbHVkZXMiLCJkZXNjcmlwdGlvbiI6IiIsImxpc3QiOlsiUGxheXMgb24gYW55IGNvbXB1dGVyICYgVFYgY29tYm8iLCJCYW5kd2lkdGgsIHN0b3JhZ2UgJiBzdXBwb3J0IGluY2x1ZGVkIiwiRWFzeSBkcmFnIGFuZCBkcm9wIGFkbWluLiIsIkJ1aWx0IGluIGFuaW1hdGlvbi4iLCJVcGxvYWQgaW1hZ2VzIGFuZCB2aWRlbyBpbiBhbnkgZm9ybWF0IiwiVXNlIHdpdGggYm90aCBkaWdpdGFsIHNpZ25zIGFuZCBpbi1yb29tIFRWIHN5c3RlbXMiLCJVc2UgbGl2ZSBkYXRhIHRvIHBvcHVsYXRlIHRleHQgZmllbGRzICYgc3dhcCBvdXQgaW1hZ2VzIiwiUmVtb3RlbHkgY29udHJvbCB5b3VyIHNjcmVlbnMiLCJTY2hlZHVsZSBjb250ZW50IiwiU29jaWFsIG1lZGlhIGZlZWRzIiwiRGlzcGxheSB2aWRlb3MgYW5kIHBob3RvcyIsIk1hcHMsIGxpZnQgJiB0cmFpbCBzdGF0dXMiXSwibWVkaWEiOnsiZmlsZSI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS8zeTBBYVBQTXpDR0tpdUtjTXVlYTJRL2Y1MmI1NzlkYzlhMjA4MGU0ODQ5ZWU4NzIyNjEyNGMyL1FULXdlYXRoZXJmb3JlY2FzdC1zY3JlZW4uanBnIiwid2lkdGgiOjY2N30sImxpbmsiOiIifV19LHsibmFtZSI6InZpY29NYXAiLCJwcm9kdWN0VHlwZSI6IkludGVyYWN0aXZlIFRyYWlsIE1hcCIsImRlc2NyaXB0aW9uIjoiKlRoZSogaW50ZXJhY3RpdmUgbWFwIGZvciBza2kgYXJlYXMuIiwicHJpY2UiOiIkMiw4MDAgVVNEIHBlciB3aW50ZXIiLCJsb2dvIjp7InVybCI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS8xc0M5TjFXSFc4MkFXa29lSWNLUVkyLzY4OGNiYjk2ZTdiZTYwMmRkMWY5YmZiYWZmMjRlMjkwL3ZpY29tYXAuc3ZnIiwibmFtZSI6InZpY29NYXAgTG9nbyJ9LCJkZXRhaWxTZWN0aW9ucyI6W3sibmFtZSI6IkRlbW8iLCJkZXNjcmlwdGlvbiI6IipUaGUgYmVzdCB3YXkgdG8gY2hlY2sgb3V0IHZpY29NYXAsIGlzIHRvIGp1c3Qgc3RhcnQgdXNpbmcgaXQhIEhhdmUgYSBnbyB3aXRoIHRoaXMgb25lIGFuZCBsZXQgdXMga25vdyB3aGF0IHlvdSB0aGluay4qIiwibGlzdCI6IiIsIm1lZGlhIjoiIiwibGluayI6Imh0dHBzOi8vdmljb21hcC1jZG4ucmVzb3J0cy1pbnRlcmFjdGl2ZS5jb20vbWFwLzEyIn0seyJuYW1lIjoidmljb01hcCBpbmNsdWRlcyIsImRlc2NyaXB0aW9uIjoiIiwibGlzdCI6WyJSZXNwb25zaXZlICh3b3JrcyBvbiBkZXNrdG9wIGFuZCBtb2JpbGUgZGV2aWNlcykiLCJMaXZlIGxpZnQgYW5kIHRyYWlsIGRhdGEgKGZyZWUgYmFzaWMgUmVwb3J0IFBhbCBjb25uZWN0b3IgaW5jbHVkZWQpIiwiQ2xvdWQgaG9zdGVkIChBV1MpIiwiQmFuZHdpZHRoLCBzdG9yYWdlICYgc3VwcG9ydCBpbmNsdWRlZCIsIkVhc3kgd2Vic2l0ZSBlbWJlZCIsIk5vIHNldHVwIGNvc3QgLSBidWlsdCBmcm9tIHlvdXIgZXhpc3RpbmcgSWxsdXN0cmF0b3IgZmlsZSJdLCJtZWRpYSI6IiIsImxpbmsiOiIifV19LHsibmFtZSI6IlJlcG9ydCBQYWwiLCJwcm9kdWN0VHlwZSI6IlNub3cgUmVwb3J0aW5nIiwiZGVzY3JpcHRpb24iOiJFYXN5IHNub3cgcmVwb3J0aW5nIGluIHRoZSBjbG91ZC4iLCJwcmljZSI6IiQzLDAwMCBVU0QgcGVyIHdpbnRlciIsImxvZ28iOnsidXJsIjoiLy9pbWFnZXMuY29udGVudGZ1bC5jb20vNnA4b2h4ZmlrYWsxLzZKcHBHZEFXektjOG1NOHNtRTh3OG0vYWU1YTVkNDM5MjgwMjc4NjlmMzI0YWFhNDZiNmY5NjgvcmVwb3J0cGFsLnN2ZyIsIm5hbWUiOiJSZXBvcnQgUGFsIExvZ28ifSwiZGV0YWlsU2VjdGlvbnMiOlt7Im5hbWUiOiJSZXBvcnQgUGFsIFN1bW1hcnkiLCJkZXNjcmlwdGlvbiI6IlRoZSBpZGVhIGJlaGluZCBSZXBvcnQgcGFsIGlzIGEgc2ltcGxlIG9uZSAtIG1vdmUgc25vdyByZXBvcnRpbmcgYXdheSBmcm9tIHlvdXIgd2Vic2l0ZSBDTVMgYW5kIGludG8gdGhlIGNsb3VkLlxuXG5JbnN0ZWFkIG9mIGNvbnRyb2xsaW5nIHlvdXIgc25vdyByZXBvcnQgZnJvbSB5b3VyIHdlYnNpdGUgKHdoaWNoIGNhbiBjaGFuZ2UgZXZlcnkgY291cGxlIG9mIHllYXJzLCByZXN1bHRpbmcgaW4gbW9yZSBjb3N0cyB0byBidWlsZCwgdGltZSByZS10cmFpbmluZyBzdGFmZiBhbmQgaGF2aW5nIHRvIHJlLWludGVncmF0ZSB3aXRoIDNyZCBwYXJ0aWVzKSwgbW92ZSBpdCBpbnRvIHRoZSBjbG91ZCBhbmQgaGF2ZSBhIGNvbnNpc3RlbnQgcGxhdGZvcm0sIHNlYXNvbiBhZnRlciBzZWFzb24uXG5cblJlcG9ydCBQYWwgbWFrZXMgdXNlIG9mIHRoZSBsYXRlc3QgdGVjaG5vbG9naWVzIG9uIG9mZmVyIGZyb20gQW1hem9uIFdlYiBTZXJ2aWNlcywgZ2l2aW5nIHlvdSBhIHJvY2sgc29saWQsIGFsd2F5cyBvbiBzbm93IHJlcG9ydGluZyBwbGF0Zm9ybSB0aGF0J3MgbGlnaHRuaW5nIGZhc3QuXG5cbkV2ZXJ5IHNraSByZXNvcnQgaXMgZGlmZmVyZW50LCBzbyBSZXBvcnQgUGFsIGhhcyBiZWVuIGJ1aWx0IGZyb20gdGhlIGdyb3VuZCB1cCBzbyB0aGF0IHdlIGNhbiBjdXN0b21pc2UgaXQgdG8gc3VpdCB5b3UuIE5vIG1vcmUgd29ya2luZyB5b3VyIHdheSBhcm91bmQgbGltaXRhdGlvbnMgb2YgeW91ciB3ZWJzaXRlIENNUywgeW91IGNhbiBpbnB1dCBhbmQgb3V0cHV0IHdoYXQgeW91IGxpa2UuXG5cbldlJ2xsIHNldHVwIHlvdXIgb3V0cHV0IGluIFtNVE4uWE1MXShodHRwOi8vbXRueG1sLm9yZyBcIk1UTi5YTUxcIikgZm9ybWF0IC0gdGhlIGluZHVzdHJ5IHN0YW5kYXJkLiBZb3VyIGRhdGEgd2lsbCBiZSBlYXNpbHkgc2hhcmVkIHdpdGggM3JkIHBhcnRpZXMuIiwibGlzdCI6IiIsIm1lZGlhIjp7ImZpbGUiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvMVpQeUNUWGMwOHc2VThnQzJrNlNnbS82YjViMmE3NzM5NWVjMTk2NWUwMjQ2YmY4YmU4ZTc0YS9TY3JlZW4tU2hvdC0yMDE2LTEyLTExLWF0LTQuMTguMzQtcG0ucG5nIiwid2lkdGgiOjM4NX0sImxpbmsiOiIifSx7Im5hbWUiOiJSZXBvcnQgUGFsIEluY2x1ZGVzIiwiZGVzY3JpcHRpb24iOiIiLCJsaXN0IjpbIlVubGltaXRlZCB1c2VycyIsIkludGVsbGlnZW50IHJlcG9ydCBtZXJnaW5nIiwiU2NoZWR1bGVkIHJlcG9ydHMiLCJTb2NpYWwgbWVkaWEgaW50ZWdyYXRpb24iLCJNVE4uWE1MIG91dHB1dCIsIlJlcG9ydCBoaXN0b3J5IGFuZCByb2xsYmFjayIsIkF1dG9tYXRlZCBsaWZ0ICYgdHJhaWwgb3BlbiBjb3VudHMsIGFjcmVhZ2UgYW5kIGxlbmd0aCIsIlJvY2sgc29saWQgLSBjbG91ZCBob3N0ZWQgb24gQW1hem9uIFdlYiBTZXJ2aWNlcyJdLCJtZWRpYSI6IiIsImxpbmsiOiIifV19XSwiY29tcGFueSI6eyJuYW1lIjoiUmVzb3J0cyBJbnRlcmFjdGl2ZSIsImRlc2NyaXB0aW9uIjoiUmVzb3J0cyBJbnRlcmFjdGl2ZSBoYXMgYmVlbiBtYWtpbmcgY2xvdWQgc29mdHdhcmUgZm9yIHRoZSBza2kgaW5kdXN0cnkgZm9yIHNpbmNlIDIwMDQuIFRoZSB3YXkgb3VyIHNvZnR3YXJlIGlzIGJ1aWx0IGFsbG93cyB1cyB0byBldm9sdmUgb3ZlciB0aW1lIGFuZCBlbWJyYWNlIGNoYW5naW5nIHRlY2hub2xvZ2llcyDigJMgYSBtdXN0IGhhdmUgcXVhbGl0eSBvZiBhbnkgY2xvdWQgYmFzZWQgcGFydG5lci4gT3VyIGN1cnJlbnQgc3VpdGUgb2YgUmVwb3J0IFBhbCwgdmljb01hcCBhbmQgU2VlTW9uc3RlciBjb3ZlcnMgYSBicm9hZCByYW5nZSBvZiBza2kgYXJlYSBtYXJrZXRpbmcgYW5kIG9wZXJhdGlvbnMgYW5kIGFsbG93cyB5b3UgdG8gZ2V0IGJhY2sgdG8gd2hhdOKAmXMgaW1wb3J0YW50IChsaWtlIHRha2luZyBhIGZldyBydW5zIG9uIHlvdXIgbHVuY2ggYnJlYWshKSBHZXQgaW4gdG91Y2ggdG9kYXksIHdl4oCZZCBsb3ZlIHRvIHRhbGsuIiwibG9nbyI6eyJ1cmwiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEvNnJ2MnRCcFk1eWlFVW95SUN1MEE0Vy80YWI5MTUxMzQzNjg3ODljMTM0M2MzNDQ0MDA1ZTNhYS9yZXNvcnRzaW50ZXJhY3RpdmUuc3ZnIiwibmFtZSI6IlJlc29ydHMgSW50ZXJhY3RpdmUgTG9nbyJ9LCJjb21wYW55RGV0YWlsU2VjdGlvbnMiOlt7ImltYWdlIjoiLy9pbWFnZXMuY29udGVudGZ1bC5jb20vNnA4b2h4ZmlrYWsxLzZJbVZ6bEJYU0VpS1NlZXFnRVFrc2cvYzc0OGFmNTc0OTFmNzgwNDg0NTAzOGI0YzZhMTc3YTgvcG93ZGVyX3Nob3QuanBnIiwidGl0bGUiOiJSZXNvcnRzIEludGVyYWN0aXZlIHdlYnNpdGUiLCJib2R5IjoiIn0seyJpbWFnZSI6Ii8vaW1hZ2VzLmNvbnRlbnRmdWwuY29tLzZwOG9oeGZpa2FrMS8zeTBBYVBQTXpDR0tpdUtjTXVlYTJRL2Y1MmI1NzlkYzlhMjA4MGU0ODQ5ZWU4NzIyNjEyNGMyL1FULXdlYXRoZXJmb3JlY2FzdC1zY3JlZW4uanBnIiwidGl0bGUiOiJXaGF0IHNldHMgdXMgYXBhcnQ/IiwiYm9keSI6IlJlc29ydHMgSW50ZXJhY3RpdmUgaGFzIGJlZW4gbWFraW5nIGNsb3VkIHNvZnR3YXJlIGZvciB0aGUgc2tpIGluZHVzdHJ5IHNpbmNlIDIwMDUgc28gd2Uga25vdyBhIHRoaW5nIG9yIHR3byBhYm91dCB0aGUgc3ViamVjdCEgVGhlIHdheSBvdXIgc29mdHdhcmUgaXMgYnVpbHQgYWxsb3dzIHVzIHRvIGV2b2x2ZSBvdmVyIHRpbWUgYW5kIGVtYnJhY2UgY2hhbmdpbmcgdGVjaG5vbG9naWVzIOKAkyBhIG11c3QgaGF2ZSBxdWFsaXR5IG9mIGFueSBjbG91ZCBiYXNlZCBwYXJ0bmVyLiBPdXIgY3VycmVudCBzdWl0ZSBvZiBSZXBvcnQgUGFsLCB2aWNvTWFwIGFuZCBTZWVNb25zdGVyIGNvdmVycyBhIGJyb2FkIHJhbmdlIG9mIHNraSBhcmVhIG1hcmtldGluZyBhbmQgb3BlcmF0aW9ucyBhbmQgYWxsb3dzIHlvdSB0byBnZXQgYmFjayB0byB3aGF04oCZcyBpbXBvcnRhbnQgKGxpa2UgdGFraW5nIGEgZmV3IHJ1bnMgb24geW91ciBsdW5jaCBicmVhayEpIFtHZXQgaW4gdG91Y2ggdG9kYXksIHdl4oCZZCBsb3ZlIHRvIHRhbGsuXShtYWlsdG86aW5mb0ByZXNvcnRzLWludGVyYWN0aXZlLmNvbSkifSx7ImltYWdlIjoiLy9pbWFnZXMuY29udGVudGZ1bC5jb20vNnA4b2h4ZmlrYWsxLzRlUndkOTJnb3dvbU1LQVlPZ2djdzAvOWY4M2MyZjJiMmE3ZWFlYjEzMmE5ZGZlNjA1MDliY2EvRGV2aWNlcy5qcGciLCJ0aXRsZSI6IkNsZXZlciBTb2Z0d2FyZSBNYWtpbmcgTGlmZSBFYXN5IiwiYm9keSI6Ii0gWW91IHdvcmsgaW4gdGhlIHNraSBpbmR1c3RyeSBiZWNhdXNlIHlvdSBsb3ZlIGl0LCBzbyB3ZSBidWlsZCBzb2Z0d2FyZSB0byBzYXZlIHlvdSB0aW1lIGFuZCBnZXQgeW91IGJhY2sgb24gdGhlIGhpbGxcbi0gQ2xvdWQgYmFzZWQgc29mdHdhcmUgaXMgZGVzaWduZWQgdG8gYmUgdXNlZCBhbnl3aGVyZSDigJMgZGVza3RvcCwgbW9iaWxlLCBDb2xvcmFkbywgVGltYnVrdHUuIElmIHlvdSBjYW4gZ2V0IGFuIEludGVybmV0IGNvbm5lY3Rpb24sIHdl4oCZdmUgZ290IHlvdSBjb3ZlcmVkXG4tIFNpbXBsaWNpdHkgYW5kIHN0YWJpbGl0eSBmb3JtIGEgY29yZSBwYXJ0IG9mIG91ciBzb2Z0d2FyZSBhcmNoaXRlY3R1cmUuIE91ciBwcm9kdWN0cyBhcmUgaG9zdGVkIG9uIEFtYXpvbiBXZWIgU2VydmljZXMgYW5kIG1ha2UgdXNlIG9mIHRoZWlyIGJlc3QgYW5kIGxhdGVzdCB0ZWNobm9sb2dpZXMgbGlrZSBDbG91ZEZyb250LCBBdXJvcmEsIGFuZCBFbGFzdGljIEJlYW5zdGFsayB0byBtYWtlIHN1cmUgd2XigJlyZSBhbHdheXMgZmFzdCBhbmQgYXZhaWxhYmxlXG4tIEluY2x1ZGUgbGl2ZSBkYXRhIGFuZCBpbWFnZXMgZnJvbSBzb2NpYWwgbWVkaWEsIHdlYXRoZXIsIG5ld3MgYW5kIG90aGVyIHdlYnNpdGVzXG4tIFVwbG9hZCB2aWRlbyBpbiBhbnkgZm9ybWF0IGFuZCBpdOKAmWxsIGJlIGNvbnZlcnRlZCBmb3IgeW91In1dLCJpY29uIjp7InN5cyI6eyJzcGFjZSI6eyJzeXMiOnsidHlwZSI6IkxpbmsiLCJsaW5rVHlwZSI6IlNwYWNlIiwiaWQiOiI2cDhvaHhmaWthazEifX0sImlkIjoia21HMFgzZkZRY0VzZWltY2VVa0lzIiwidHlwZSI6IkFzc2V0IiwiY3JlYXRlZEF0IjoiMjAxNy0wNi0xOFQxMDoyNDo1NC41ODBaIiwidXBkYXRlZEF0IjoiMjAxNy0wNi0xOFQxMDoyNDo1NC41ODBaIiwicmV2aXNpb24iOjEsImxvY2FsZSI6ImVuLU5aIn0sImZpZWxkcyI6eyJ0aXRsZSI6IlNlbWktZmxha2UtcG5nIiwiZGVzY3JpcHRpb24iOiJQTkcgdmVyc2lvbiBvZiBzZW1pLWZsYWtlIiwiZmlsZSI6eyJ1cmwiOiIvL2ltYWdlcy5jb250ZW50ZnVsLmNvbS82cDhvaHhmaWthazEva21HMFgzZkZRY0VzZWltY2VVa0lzLzk0M2MwNDc5MWEyZDQ0MmYxZjUwODAyYTM4NjhlMjllL3NlbWlmbGFrZS5wbmciLCJkZXRhaWxzIjp7InNpemUiOjI0MTkwLCJpbWFnZSI6eyJ3aWR0aCI6NTEyLCJoZWlnaHQiOjUxMn19LCJmaWxlTmFtZSI6InNlbWlmbGFrZS5wbmciLCJjb250ZW50VHlwZSI6ImltYWdlL3BuZyJ9fX19fQ=='
      )
      expect(state.router).to.exist()
    })

    it('has initial data injects router when its not there to start with', () => {
      browserMode('eyJmYWtlIjoidHJ1ZSJ9')
      expect(state.router).to.exist()
    })

    it('has initial data injects router when its not there to start with', () => {
      defineRoute({path: '/routeWithComponent', component: {fakeComponent: true}})
      expect(getRouteComponent('/routeWithComponent').fakeComponent).to.be.true()
    })

  })

})
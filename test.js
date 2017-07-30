import chai, {expect} from 'chai'
import dirtyChai from 'dirty-chai'
import { noCallThru } from 'proxyquire'
const proxyquire = noCallThru()
chai.use(dirtyChai)
import jsdomGlobal from 'jsdom-global'
import decache from 'decache'

let jsdom = jsdomGlobal()
let halfcab
let halfcabModule
let { ssr, html, route, formField, component, updateState, injectMarkdown, formValid } = {}

function serverMode(){
    jsdom && jsdom()
    decache('bel')
    halfcabModule = proxyquire('./halfcab', {})
    ;({ ssr, html } = halfcabModule)
}

function browserMode(){
    global.requestAnimationFrame = (fcn) => {
        fcn()
    }
    decache('bel')
    jsdom = jsdomGlobal()
    halfcabModule = proxyquire('./halfcab', {})
    ;({ html, route, formField, component, updateState, injectMarkdown, formValid } = halfcabModule)
    halfcab = halfcabModule.default
}


describe('halfcab', () =>{

    describe('Server', () => {
        before(done => {
            serverMode()
            done()
        })

        it('Produces a string when doing SSR', () =>{
            var { componentsString, stylesString } = ssr(html`
            <div oninput=${() => {}}></div>
        `)
            expect(typeof componentsString === 'string').to.be.true()
        })
    })

    describe('Client', () => {
        before(done => {
            browserMode()
            done()
        })

        it('Produces an HTML element when rendering', () =>{
            var el = html`
                <div oninput=${() => {}}></div>
            `
            expect(el instanceof HTMLDivElement).to.be.true()
        })

        it('Produces an HTML element wrapping as a reusable component', () =>{
            var el = component(() => html`
                <div oninput=${() => {}}></div>
            `, {})
            expect(el instanceof HTMLDivElement).to.be.true()
        })


        it('Runs halfcab function without error', () =>{
            return halfcab({
                baseName: 'Resorts Interactive',
                baseApiPath: '/api/webroutes',
                components(){
                    return html `<div></div>`
                }
            })
            .then(rootEl => {
                expect(typeof rootEl === 'object').to.be.true()
            })
        })

        it('updating state causes a rerender with state', () =>{
            return halfcab({
                baseName: 'Resorts Interactive',
                baseApiPath: '/api/webroutes',
                components(args){
                    return html `<div>${args.testing || ''}</div>`
                }
            })
            .then(rootEl => {
                updateState({testing: 'works'})
                expect(rootEl.innerHTML.indexOf('works') !== -1).to.be.true()
            })
        })

        it('injects external content without error', () =>{
            return halfcab({
                baseName: 'Resorts Interactive',
                baseApiPath: '/api/webroutes',
                components(args){
                    return html `<div>${injectMarkdown('### Heading')}</div>`
                }
            })
            .then(rootEl => {
                expect(rootEl.innerHTML.indexOf('###')).to.equal(-1)
                expect(rootEl.innerHTML.indexOf('<h3')).not.to.equal(-1)
            })
        })

        describe('formField', () => {

            it('Returns a function', () =>{
                var holdingPen = {};
                var output = formField(holdingPen, 'test')

                expect(typeof output === 'function').to.be.true()
            })

            it('Sets a property within the valid object of the same name', () =>{
                var holdingPen = {};
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

            it('Sets checkboxes without error', () =>{
                var holdingPen = {};
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

            it('Sets radio buttons without error', () =>{
                var holdingPen = {};
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

            it('Validates a form without error', () =>{
                var holdingPen = {};
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

                expect(formValid(holdingPen)).to.be.true()
            })
        })

    })

})
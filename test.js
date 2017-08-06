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
let { ssr, html, defineRoute, formField, cache, updateState, injectMarkdown, formIsValid, emptyBody, css } = {}

function serverMode(){
    jsdom && jsdom()
    decache('bel')
    halfcabModule = proxyquire('./halfcab', {})
    ;({ ssr, html, css } = halfcabModule)
}

function browserMode(){
    global.requestAnimationFrame = (fcn) => {
        fcn()
    }
    decache('bel')
    jsdom = jsdomGlobal()
    halfcabModule = proxyquire('./halfcab', {})
    ;({ html, defineRoute, formField, cache, updateState, injectMarkdown, formIsValid, emptyBody, css } = halfcabModule)
    halfcab = halfcabModule.default
}


describe('halfcab', () =>{

    describe('Server', () => {
        before(done => {
            serverMode()
            done()
        })

        it('Produces a string when doing SSR', () =>{
            var style = css`
                .myStyle {
                    width: 100px;
                }
            `
            var { componentsString, stylesString } = ssr(html`
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

        it('Produces an HTML element when rendering', () =>{
            var el = html`
                <div oninput=${() => {}}></div>
            `
            expect(el instanceof HTMLDivElement).to.be.true()
        })

        it('Produces an HTML element wrapping as a reusable component', () =>{
            var el = cache(() => html`
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

        it('updating state without deepmerge overwrites objects', () =>{
            var style = css`
                .myStyle {
                    width: 100px;
                }
            `
            return halfcab({
                baseName: 'Resorts Interactive',
                baseApiPath: '/api/webroutes',
                components(args){
                    return html `<div class="${style.myStyle}">${args.testing.inner || ''}</div>`
                }
            })
            .then(rootEl => {
                updateState({testing: { inner: 'works'}})
                updateState({testing: { inner2: 'works'}}, {
                    deepMerge: false
                })
                expect(rootEl.innerHTML.indexOf('works')).to.equal(-1)
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
                emptyBody()
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
        })

    })

})
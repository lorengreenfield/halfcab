import chai, {expect} from 'chai'
import dirtyChai from 'dirty-chai'
import { noPreserveCache } from 'proxyquire'
const proxyquire = noPreserveCache().noCallThru()
chai.use(dirtyChai)
import halfcab, { ssr, html, route, formField } from './halfcab'
import geb from './eventEmitter'

describe('halfcab', () =>{

    before(function(){
        // halfcab({
        //
        // })
    })

    describe('Server', () => {
        it('Produces a string when doing SSR', () =>{
            var { componentsString, stylesString } = ssr(html`
            <div oninput=${() => {}}></div>
        `)
            expect(typeof componentsString === 'string').to.be.true()
        })
    })

    describe('Client', () => {
        it('Produces an object when doing regular render', () =>{
            var el = html`
                <div oninput=${() => {}}></div>
            `
            expect(typeof el === 'object').to.be.true()
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

            expect(holdingPen.valid).to.exist()
        })
    })


})
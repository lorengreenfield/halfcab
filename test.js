import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import { noPreserveCache } from 'proxyquire';
const proxyquire = noPreserveCache().noCallThru();
chai.use(dirtyChai);
import halfcab, { ssr, html } from './halfcab'
import geb from './eventEmitter'

describe('halfcab', function(){

    before(function(){
        // halfcab({
        //
        // })
    });

    it('Should produce a string when doing SSR', function(){
        var { componentsString, stylesString } = ssr(html`
            <div oninput=${() => {}}></div>
        `)
        expect(typeof componentsString === 'string').to.be.true()
    });

    it('Should produce an object when doing regular render', function(){
        var el = html`
            <div oninput=${() => {}}></div>
        `
        expect(typeof el === 'object').to.be.true()
    });

});
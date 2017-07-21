import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import { noPreserveCache } from 'proxyquire';
const proxyquire = noPreserveCache().noCallThru();
chai.use(dirtyChai);

describe('halfcab', function(){

    before(function(){

    });

    it('Fake 1', function(){
        expect(true).to.equal(true)
    });

    it('Fake 2', function(){
        expect(true).to.equal(true)
    });

    it('Fake 3', function(){
        expect(true).to.equal(true)
    });

    it('Fake 3', function(){
        expect(true).to.equal(true)
    });

});
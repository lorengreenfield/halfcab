import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import { noPreserveCache } from 'proxyquire';
const proxyquire = noPreserveCache().noCallThru();
chai.use(dirtyChai);
chai.use(sinonChai);

var mocks = {
    emit: sinon.stub(),
    on: sinon.stub(),
    once: sinon.stub(),
    off: sinon.stub()
}

global.window = {}
var moduleUnderTest = proxyquire('./index.js', {
    'event-emitter'(){
        return mocks
    }
}).default



import geb, { eventEmitter } from './index'

describe('eventEmitter', function(){

    before(function(){
        return new Promise(resolve => {

            resolve()
        })

    });

    describe('client', function(){

        it('calls broadcast correctly', (done) => {
            moduleUnderTest.broadcast('some event', {})
            expect(mocks.emit).to.have.been.called()
            mocks.emit.reset()
            done()
        })

        it('calls on correctly', (done) => {
            moduleUnderTest.on('some event', () => {})
            expect(mocks.on).to.have.been.called()
            mocks.on.reset()
            done()
        })

        it('calls once correctly', (done) => {
            moduleUnderTest.once('some event', () => {})
            expect(mocks.once).to.have.been.called()
            mocks.once.reset()
            done()
        })

        it('calls off correctly', (done) => {
            moduleUnderTest.off('some event', () => {})
            expect(mocks.off).to.have.been.called()
            mocks.off.reset()
            done()
        })
    })


    describe('server', function(){
        return new Promise(resolve => {
            it('calls a noop for broadcast', () => {
                global.window = undefined
                var emitter = new eventEmitter()

                emitter.broadcast('some new event')
                expect(mocks.emit).not.to.have.been.called()
            })

            it('calls a noop for on', () => {
                global.window = undefined
                var emitter = new eventEmitter()

                emitter.on('some new event', () => {})
                expect(mocks.on).not.to.have.been.called()
            })

            it('calls a noop for broadcast', () => {
                global.window = undefined
                var emitter = new eventEmitter()

                emitter.broadcast('some new event')
                expect(mocks.emit).not.to.have.been.called()
            })

            it('calls a noop for broadcast', () => {
                global.window = undefined
                var emitter = new eventEmitter()

                emitter.broadcast('some new event')
                expect(mocks.emit).not.to.have.been.called()
            })
            resolve()
        })
    })
})
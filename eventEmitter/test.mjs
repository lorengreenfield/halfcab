import chai from 'chai'
import dirtyChai from 'dirty-chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import eventEmitter from './index'
import jsdomGlobal from 'jsdom-global'

const {expect} = chai
chai.use(dirtyChai)
chai.use(sinonChai)
let jsdom = jsdomGlobal()
let mocks = {
  emit: sinon.stub(),
  on: sinon.stub(),
  once: sinon.stub(),
  off: sinon.stub()
}

let ee = () => {
  return mocks
}


let geb = new eventEmitter({ee})

describe('eventEmitter', function () {

  before(function () {
    return new Promise(resolve => {

      resolve()
    })

  })

  describe('client', function () {

    it('calls broadcast correctly', (done) => {
      geb.broadcast('some event', {})
      expect(mocks.emit).to.have.been.called()
      mocks.emit.reset()
      done()
    })

    it('calls on correctly', (done) => {
      geb.on('some event', () => {})
      expect(mocks.on).to.have.been.called()
      mocks.on.reset()
      done()
    })

    it('calls once correctly', (done) => {
      geb.once('some event', () => {})
      expect(mocks.once).to.have.been.called()
      mocks.once.reset()
      done()
    })

    it('calls off correctly', (done) => {
      geb.off('some event', () => {})
      expect(mocks.off).to.have.been.called()
      mocks.off.reset()
      done()
    })
  })

  describe('server', () => {

    before(async () => {
      jsdom()
    })

    return new Promise(resolve => {
      it('calls a noop for broadcast', () => {
        //jsdom()
        var emitter = new eventEmitter({ee})

        emitter.broadcast('some new event')
        expect(mocks.emit).not.to.have.been.called()
      })

      it('calls a noop for on', () => {
        //jsdom()
        var emitter = new eventEmitter({ee})

        emitter.on('some new event', () => {})
        expect(mocks.on).not.to.have.been.called()
      })

      it('calls a noop for broadcast', () => {
        //jsdom()
        var emitter = new eventEmitter({ee})

        emitter.broadcast('some new event')
        expect(mocks.emit).not.to.have.been.called()
      })

      it('calls a noop for broadcast', () => {
        //jsdom()
        var emitter = new eventEmitter({ee})

        emitter.broadcast('some new event')
        expect(mocks.emit).not.to.have.been.called()
      })
      resolve()
    })
  })
})
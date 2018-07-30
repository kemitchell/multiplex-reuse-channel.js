var Multiplex = require('multiplex')
var tape = require('tape')

tape('createStream', function (test) {
  var STREAM_ID = 'test stream'

  var alice = Multiplex()
  alice.createStream(STREAM_ID)
    .once('error', function (error) {
      test.assert(
        /destroyed/i.test(error.message),
        'alice stream destroyed'
      )
      alice.createStream(STREAM_ID)
    })

  var bob = Multiplex()
  var count = 0
  bob.on('stream', function (receiving, id) {
    count++
    test.equal(id, STREAM_ID, 'same id')
    if (count === 1) {
      test.pass('bob received stream')
      receiving.destroy()
    }
    if (count === 2) {
      test.pass('bob received stream again')
      test.end()
    }
  })

  alice.pipe(bob).pipe(alice)
})

tape('createSharedStream', function (test) {
  var STREAM_ID = 'test stream'

  var alice = Multiplex()
  var firstSharedStream = alice.createSharedStream(STREAM_ID)
    .once('error', function (error) {
      test.assert(
        /destroyed/i.test(error.message),
        'alice stream destroyed'
      )
      var secondSharedStream = alice.createSharedStream(STREAM_ID)
    // This write call is necessary, since .createSharedStream
    // initializes write streams as lazy.
      secondSharedStream.write('test')
    })
  // This write call is necessary, since .createSharedStream
  // initializes write streams as lazy.
  firstSharedStream.write('test')

  var bob = Multiplex()
  var count = 0
  bob.on('stream', function (receiving, id) {
    count++
    test.equal(id, STREAM_ID, 'same id')
    if (count === 1) {
      test.pass('bob received stream')
      receiving.destroy()
      bob.createStream(id).destroy()
    }
    if (count === 2) {
      test.pass('bob received stream again')
      test.end()
    }
  })

  alice.pipe(bob).pipe(alice)
})

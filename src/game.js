var firebase = require('./firebase');
var render = require('./render');
var controls = require('./controls');

var players, blocks;

players = firebase.create('players');
render.bindEntity(players);

blocks = firebase.create('blocks');
render.bindEntity(blocks);

// when the document has loaded
render.on('ready', function() {
  render.start();  
});

// update
render.on('frame', function() {
    
});



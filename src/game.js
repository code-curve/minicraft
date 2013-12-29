var firebase = require('./firebase');
var render = require('./render')('game-canvas');
var controls = require('./controls');

var players, blocks, player, playerRef;

player = {
  x: 0,
  y: 0,
  sprite: 'player' 
};

// create a new player for this user
playerRef = firebase.child('players');
playerRef.set(player);
playerRef.onDisconnect().remove();

// create a reference to players
players = firebase.create('players');
render.bindEntity(players);

// create a reference to blocks
blocks = firebase.create('blocks');
render.bindEntity(blocks);

// when the document has loaded
render.on('ready', function() {
  render();  
});

// update
render.on('frame', function() {
  // check control states and update player
});

var firebase = require('./firebase'),
    render = require('./render')('game-canvas'),
    controls = require('./controls'),
    camera = require('./camera');

var players, blocks, player, playerRef, actionCoolDown;

actionCoolDown = 0;

player = {
  x: 0,
  y: 0,
  sprite: 'player' 
};

console.log(camera);
camera.follow(player);

// create a new player for this user
playerRef = firebase.child('players');
playerRef.set(player);
playerRef.onDisconnect().remove();

// create a reference to blocks
blocks = firebase.create('blocks');
render.bindEntity(blocks);

// create a reference to players
players = firebase.create('players');
render.bindEntity(players);

// when the document has loaded
render.on('ready', function() {
  render();  
});

// update
render.on('frame', function() {
  // check control states and update player
  var step, needsUpdate, blockRef;

  step = 4;
  needsUpdate = false;
  
  if(actionCoolDown) {
    actionCoolDown -= 1;
  }  
 
  if(controls.left) {
    player.x -= step;
    needsUpdate = true;
  } else if(controls.right) {
    player.x += step;
    needsUpdate = true;
  }

  if(controls.up) {
    player.y -= step;
    needsUpdate = true;
  } else if(controls.down) {
    player.y += step;
    needsUpdate = true;
  }

  if(controls.space && !actionCoolDown) {
    blockRef = firebase.child('blocks');
    blockRef.set({
      type: 0,
      sprite: 'stone',
      x: player.x - player.x % 32,
      y: player.y - player.y % 32
    });
    actionCoolDown = 5;
  }

  if(needsUpdate) {
    playerRef.set(player);
  }
});

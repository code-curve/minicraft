var firebase = require('./firebase'),
    render = require('./render')('game-canvas'),
    controls = require('./controls'),
    camera = require('./camera'),
    ui = require('./interface');

var players, blocks, player, playerRef, 
actionCoolDown, messageTimeout;

actionCoolDown = 0;

player = {
  x: 10 * 32,
  y: 10 * 32,
  admin: true,
  sprite: 'player' 
};

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
  // expose some externals to UI
  ui({
    message: message
  });
  
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
 
  if(controls.a) {
    if(player.x - step >= 0) {
      player.x -= step;
      needsUpdate = true;
    }
  } else if(controls.d) {
    player.x += step;
    needsUpdate = true;
  }

  if(controls.w) {
    if(player.y - step >= 0) {
      player.y -= step;
    }
    needsUpdate = true;
  } else if(controls.s) {
    player.y += step;
    needsUpdate = true;
  }

  if(controls.enter && !actionCoolDown) {
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



function message(text) {
  clearTimeout(messageTimeout);
  player.message = text;
  playerRef.set(player);

  messageTimeout = setTimeout(function() {
    delete player.message;
    playerRef.set(player);
  }, 5000);
}

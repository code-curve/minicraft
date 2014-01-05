var firebase = require('./firebase'),
    render = require('./render')('game-canvas'),
    controls = require('./controls'),
    camera = require('./camera'),
    ui = require('./interface'),
    blockStore = require('./blocks');

var players, blocks, player, playerRef, 
actionCoolDown, messageTimeout, blockType;

actionCoolDown = 0;
blockType = 0;

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
    message: message,
    changeBlock: function(block) {
      blockType = block;
    }
  });
 
  render();  
});

// update
render.on('frame', function() {
  // check control states and update player
  updatePlayer();
  
});

function updatePlayer() {
  var step, blockRef, movement;
  step = 4;
  movement = {
    x: 0,
    y: 0
  };
  
  if(actionCoolDown) {
    actionCoolDown -= 1;
  }  
  
  if(controls.a) {
    if(player.x - step >= 0) {
      movement.x = -step;
    }
  } else if(controls.d) {
    movement.x = step;
  }

  if(controls.w) {
    if(player.y - step >= 0) {
      movement.y = -step;
    }
  } else if(controls.s) {
    movement.y = step;
  }

  player.x += movement.x;
  player.y += movement.y;

  // check collisions at 
  for(var id in blocks) {
    var block = blocks[id];
    // get hold of both sprites
    //if (RectA.X1 < RectB.X2 && RectA.X2 > RectB.X1 &&
    //RectA.Y1 < RectB.Y2 && RectA.Y2 > RectB.Y1) 
    
  } 
    
  // if we are going to move
  playerRef.set(player);

  if(controls.space && !actionCoolDown) {
    console.log(blockStore, blockType);
    blockRef = firebase.child('blocks');
    blockRef.set({
      sprite: blockStore[blockType].name,
      x: player.x - player.x % 32,
      y: player.y - player.y % 32
    });
    actionCoolDown = 5;
  }
}

function message(text) {
  clearTimeout(messageTimeout);
  player.message = text;
  playerRef.set(player);

  messageTimeout = setTimeout(function() {
    delete player.message;
    playerRef.set(player);
  }, 5000);
}

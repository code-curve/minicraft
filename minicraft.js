(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var sprites = require('./sprites');

module.exports = [
  sprites.stone,
  sprites.wood
];

},{"./sprites":10}],2:[function(require,module,exports){
module.exports = {
  _x: 0,
  _y: 0,
  following: false,
  entity: null,

  follow: function(entity) {
    this.following = true;
    this.entity = entity;
  },

  get x() {
    return this.following ? this.entity.x : this._x;
  },

  get y() {
    return this.following ? this.entity.y : this._y; 
  }
};

},{}],3:[function(require,module,exports){
module.exports = (function() {
  var states, keyMap;  
  
  states = {};
  keyMap = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    32: 'space',
    13: 'enter',
    9: 'tab'
  };

  function changeState(state) {
    return function(e) {
      var mapped;
      mapped = keyMap[e.keyCode] || String.fromCharCode(e.keyCode);
      states[mapped.toLowerCase()] = state;
    }
  }

  window.addEventListener('keydown', changeState(true));
  window.addEventListener('keyup', changeState(false));
  
  return states;
})();

},{}],4:[function(require,module,exports){
var firebase = new Firebase("https://minicraft.firebaseio.com");

function create(name) {
  var ref, data, loaded;
   
  ref = reference(name);
  data = {};
  loaded = false;
  
  /*ref.on('value', function(snap) {
    // stop the reference from being overwritten
    if(!loaded && snap.val()) {
      loaded = true;
      console.log('change', name);
      data = snap.val();
    }
  });*/

  ref.on('child_added', function(snap) {
    data[snap.name()] = snap.val(); 
  });

  ref.on('child_removed', function(snap) {
    delete data[snap.name()];
  });

  ref.on('child_changed', function(snap) {
    data[snap.name()] = snap.val();
  });
  
  return data;
}

function reference(name) {
  return firebase.child(name);
}

function child(name) {
  var ref;
  ref = firebase.child(name);
  return ref.push();
}

module.exports = {
  create: create,
  child: child,
  reference: reference
};

},{}],5:[function(require,module,exports){
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

},{"./blocks":1,"./camera":2,"./controls":3,"./firebase":4,"./interface":6,"./render":7}],6:[function(require,module,exports){
var blocks = require('./blocks');

module.exports = function(externals) {
  // should only be called when DOM is ready
  var messageInput, sendButton, gameCanvas, blockTypes;
  messageInput = document.getElementById('message');
  sendButton = document.getElementById('send');
  gameCanvas = document.getElementById('game-canvas');
  blockTypes = document.getElementById('blocks');
  
  function keyUp(e) {
    // stop these events from
    // triggering game events
    e.stopPropagation();
    
    if(e.keyCode === 13) {
        sendMessage();
    }
  }

  function globalKeyUp(e) {
        
    if(e.keyCode === 84) {
      console.log('focus');
      messageInput.focus();
    }
    if(e.keyCode === 13) {
      // switch to chat
      messageInput.focus();
    }
    if(e.keyCode > 47 && e.keyCode < 58) {
      externals.changeBlock(e.keyCode - 48);
    }
  }

  function keyDown(e) {
    // stop these events from
    // triggering game events
    e.stopPropagation();
  }

  function sendMessage() {
    externals.message(messageInput.value);
    messageInput.value = '';
    console.log(gameCanvas);
    messageInput.blur();
  }
  
  function displayTiles() {
    for(var id in blocks) {
      console.log(blocks[id]);
      blockTypes.appendChild(blocks[id]);
    }   
  }
      
  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', keyDown);
  messageInput.addEventListener('keyup', keyUp);
  window.addEventListener('keyup', globalKeyUp);
  gameCanvas.focus();
  displayTiles();
};

},{"./blocks":1}],7:[function(require,module,exports){
var sprites = require('./sprites'),
    sort = require('./sort');
    camera = require('./camera');
  
module.exports = function(canvasId) {
  var canvas, ctx, events, entities, height, width;
  
  events = {};
  entities = []; 
 
  function init() {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext('2d');
  
    // resize canvas to fit screen
    resize();
    
    // trigger our ready events
    render.trigger('ready');
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function render() {
    setTimeout(render, 50);
    //requestAnimationFrame(render);
    render.trigger('frame');
    
    ctx.fillStyle = 'green';
    ctx.fillRect(0, 0, width, height);
       
    for(var i = 0; i < entities.length; i++) {
      renderEntityList(entities[i]);
    }
  }

  function renderEntityList(entityList) {
    // sort entities into ascending y order
    entityList = sort(entityList, 'y');
    for(var id in entityList) {
      renderEntity(entityList[id]);
    }
  }

    
  function renderEntity(entity) {
    var offsetX, offsetY, sprite, midX, midY, msg;

    sprite = sprites[entity.sprite];
    midX = width / 2;
    midY = height / 2;      
    offsetX = 64 - sprite.w * 2;
    offsetY = 64 - sprite.h * 2;
    
    ctx.save();
    if(entity.message) {
      console.group('Context');
      console.log('Translate', entity.x, entity.y);
      console.log('Draw At', 2 * midX - camera.x, 2 * midY - camera.y,
        sprite.w * 2, sprite.h * 2
      )
      console.groupEnd('Context');
    }
    ctx.translate(entity.x * 2, entity.y * 2);
    ctx.drawImage(sprite, 
      midX - camera.x * 2, 
      midY - camera.y * 2,
      sprite.w * 2,
      sprite.h * 2);
     
    if(msg = entity.message) {
      renderMessage(entity, entity.message, 
        midX - camera.x * 2 + sprite.w,
        midY - camera.y * 2); 
    }

    ctx.restore();
  }

  function renderMessage(entity, string, x, y){
    var textWidth, pad, halfway;
    ctx.font = '8pt arial';
    if(entity.admin) {
      string = '♛' + string;
    }

    pad = 4;
    textWidth = ctx.measureText(string).width;
    halfway = textWidth / 2;    

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - pad / 2 - halfway, y - 20, textWidth + pad, 14);
    
    if(entity.admin) {
      ctx.fillStyle = '#ffaa00';
    } else {
      ctx.fillStyle = '#fff';
    }
    ctx.fillText(string, x - halfway, y - 10);
  }
 
  render.bindEntity = function(entity) {
    entities.push(entity);
  }

  render.on = function(name, callback) {
    if(!events[name]) events[name] = [];
    events[name].push(callback);
  }

  render.trigger = function(name) {
    if(!events[name]) return;
    for(var i = 0; i < events[name].length; i++) {
      events[name][i].apply(render, arguments);
    }
  }

  window.addEventListener('load', init);
  window.addEventListener('resize', resize);

  return render;
};

},{"./camera":2,"./sort":8,"./sprites":10}],8:[function(require,module,exports){
module.exports = function sort(list, on) {
  var val, ordered, sorted;
  sorted = [];
  ordered = [];

  for(var id in list) {
    val = list[id][on];

    while(typeof ordered[val] !== 'undefined') {
      val++;
    }

    if(ordered[val] instanceof Array) {
      ordered[val].push(list[id])
    } else {
      ordered[val] = [list[id]];
    }
  }

  for(var i = 0; i < ordered.length; i++) {
    if(ordered[i]) {
      sorted = sorted.concat(ordered[i]);
    }
  }

  return sorted;
}


},{}],9:[function(require,module,exports){
module.exports = function(url, width, height, name) {
  var image;
  image = new Image();
  image.name = name;
  image.src = 'img/' + url;
  image.h = height;
  image.w = width; 
  return image;
};

},{}],10:[function(require,module,exports){
var sprite = require('./sprite');

module.exports = {
  player: sprite('player.png', 32, 32, 'player'),
  stone: sprite('stone.png', 32, 48, 'stone'),
  wood: sprite('wood.png', 32, 48, 'wood')
};

},{"./sprite":9}]},{},[1,2,3,4,5,6,7,8,9,10])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvYmxvY2tzLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2NhbWVyYS5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9jb250cm9scy5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9maXJlYmFzZS5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9nYW1lLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2ludGVyZmFjZS5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9yZW5kZXIuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvc29ydC5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9zcHJpdGUuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvc3ByaXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInZhciBzcHJpdGVzID0gcmVxdWlyZSgnLi9zcHJpdGVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gW1xuICBzcHJpdGVzLnN0b25lLFxuICBzcHJpdGVzLndvb2Rcbl07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgX3g6IDAsXG4gIF95OiAwLFxuICBmb2xsb3dpbmc6IGZhbHNlLFxuICBlbnRpdHk6IG51bGwsXG5cbiAgZm9sbG93OiBmdW5jdGlvbihlbnRpdHkpIHtcbiAgICB0aGlzLmZvbGxvd2luZyA9IHRydWU7XG4gICAgdGhpcy5lbnRpdHkgPSBlbnRpdHk7XG4gIH0sXG5cbiAgZ2V0IHgoKSB7XG4gICAgcmV0dXJuIHRoaXMuZm9sbG93aW5nID8gdGhpcy5lbnRpdHkueCA6IHRoaXMuX3g7XG4gIH0sXG5cbiAgZ2V0IHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuZm9sbG93aW5nID8gdGhpcy5lbnRpdHkueSA6IHRoaXMuX3k7IFxuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBzdGF0ZXMsIGtleU1hcDsgIFxuICBcbiAgc3RhdGVzID0ge307XG4gIGtleU1hcCA9IHtcbiAgICAzNzogJ2xlZnQnLFxuICAgIDM4OiAndXAnLFxuICAgIDM5OiAncmlnaHQnLFxuICAgIDQwOiAnZG93bicsXG4gICAgMzI6ICdzcGFjZScsXG4gICAgMTM6ICdlbnRlcicsXG4gICAgOTogJ3RhYidcbiAgfTtcblxuICBmdW5jdGlvbiBjaGFuZ2VTdGF0ZShzdGF0ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgbWFwcGVkO1xuICAgICAgbWFwcGVkID0ga2V5TWFwW2Uua2V5Q29kZV0gfHwgU3RyaW5nLmZyb21DaGFyQ29kZShlLmtleUNvZGUpO1xuICAgICAgc3RhdGVzW21hcHBlZC50b0xvd2VyQ2FzZSgpXSA9IHN0YXRlO1xuICAgIH1cbiAgfVxuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgY2hhbmdlU3RhdGUodHJ1ZSkpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBjaGFuZ2VTdGF0ZShmYWxzZSkpO1xuICBcbiAgcmV0dXJuIHN0YXRlcztcbn0pKCk7XG4iLCJ2YXIgZmlyZWJhc2UgPSBuZXcgRmlyZWJhc2UoXCJodHRwczovL21pbmljcmFmdC5maXJlYmFzZWlvLmNvbVwiKTtcblxuZnVuY3Rpb24gY3JlYXRlKG5hbWUpIHtcbiAgdmFyIHJlZiwgZGF0YSwgbG9hZGVkO1xuICAgXG4gIHJlZiA9IHJlZmVyZW5jZShuYW1lKTtcbiAgZGF0YSA9IHt9O1xuICBsb2FkZWQgPSBmYWxzZTtcbiAgXG4gIC8qcmVmLm9uKCd2YWx1ZScsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICAvLyBzdG9wIHRoZSByZWZlcmVuY2UgZnJvbSBiZWluZyBvdmVyd3JpdHRlblxuICAgIGlmKCFsb2FkZWQgJiYgc25hcC52YWwoKSkge1xuICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUubG9nKCdjaGFuZ2UnLCBuYW1lKTtcbiAgICAgIGRhdGEgPSBzbmFwLnZhbCgpO1xuICAgIH1cbiAgfSk7Ki9cblxuICByZWYub24oJ2NoaWxkX2FkZGVkJywgZnVuY3Rpb24oc25hcCkge1xuICAgIGRhdGFbc25hcC5uYW1lKCldID0gc25hcC52YWwoKTsgXG4gIH0pO1xuXG4gIHJlZi5vbignY2hpbGRfcmVtb3ZlZCcsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICBkZWxldGUgZGF0YVtzbmFwLm5hbWUoKV07XG4gIH0pO1xuXG4gIHJlZi5vbignY2hpbGRfY2hhbmdlZCcsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICBkYXRhW3NuYXAubmFtZSgpXSA9IHNuYXAudmFsKCk7XG4gIH0pO1xuICBcbiAgcmV0dXJuIGRhdGE7XG59XG5cbmZ1bmN0aW9uIHJlZmVyZW5jZShuYW1lKSB7XG4gIHJldHVybiBmaXJlYmFzZS5jaGlsZChuYW1lKTtcbn1cblxuZnVuY3Rpb24gY2hpbGQobmFtZSkge1xuICB2YXIgcmVmO1xuICByZWYgPSBmaXJlYmFzZS5jaGlsZChuYW1lKTtcbiAgcmV0dXJuIHJlZi5wdXNoKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6IGNyZWF0ZSxcbiAgY2hpbGQ6IGNoaWxkLFxuICByZWZlcmVuY2U6IHJlZmVyZW5jZVxufTtcbiIsInZhciBmaXJlYmFzZSA9IHJlcXVpcmUoJy4vZmlyZWJhc2UnKSxcbiAgICByZW5kZXIgPSByZXF1aXJlKCcuL3JlbmRlcicpKCdnYW1lLWNhbnZhcycpLFxuICAgIGNvbnRyb2xzID0gcmVxdWlyZSgnLi9jb250cm9scycpLFxuICAgIGNhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhJyksXG4gICAgdWkgPSByZXF1aXJlKCcuL2ludGVyZmFjZScpLFxuICAgIGJsb2NrU3RvcmUgPSByZXF1aXJlKCcuL2Jsb2NrcycpO1xuXG52YXIgcGxheWVycywgYmxvY2tzLCBwbGF5ZXIsIHBsYXllclJlZiwgXG5hY3Rpb25Db29sRG93biwgbWVzc2FnZVRpbWVvdXQsIGJsb2NrVHlwZTtcblxuYWN0aW9uQ29vbERvd24gPSAwO1xuYmxvY2tUeXBlID0gMDtcblxucGxheWVyID0ge1xuICB4OiAxMCAqIDMyLFxuICB5OiAxMCAqIDMyLFxuICBhZG1pbjogdHJ1ZSxcbiAgc3ByaXRlOiAncGxheWVyJyBcbn07XG5cbmNhbWVyYS5mb2xsb3cocGxheWVyKTtcblxuLy8gY3JlYXRlIGEgbmV3IHBsYXllciBmb3IgdGhpcyB1c2VyXG5wbGF5ZXJSZWYgPSBmaXJlYmFzZS5jaGlsZCgncGxheWVycycpO1xucGxheWVyUmVmLnNldChwbGF5ZXIpO1xucGxheWVyUmVmLm9uRGlzY29ubmVjdCgpLnJlbW92ZSgpO1xuXG4vLyBjcmVhdGUgYSByZWZlcmVuY2UgdG8gYmxvY2tzXG5ibG9ja3MgPSBmaXJlYmFzZS5jcmVhdGUoJ2Jsb2NrcycpO1xucmVuZGVyLmJpbmRFbnRpdHkoYmxvY2tzKTtcblxuLy8gY3JlYXRlIGEgcmVmZXJlbmNlIHRvIHBsYXllcnNcbnBsYXllcnMgPSBmaXJlYmFzZS5jcmVhdGUoJ3BsYXllcnMnKTtcbnJlbmRlci5iaW5kRW50aXR5KHBsYXllcnMpO1xuXG4vLyB3aGVuIHRoZSBkb2N1bWVudCBoYXMgbG9hZGVkXG5yZW5kZXIub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gIFxuICAvLyBleHBvc2Ugc29tZSBleHRlcm5hbHMgdG8gVUlcbiAgdWkoe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgY2hhbmdlQmxvY2s6IGZ1bmN0aW9uKGJsb2NrKSB7XG4gICAgICBibG9ja1R5cGUgPSBibG9jaztcbiAgICB9XG4gIH0pO1xuIFxuICByZW5kZXIoKTsgIFxufSk7XG5cbi8vIHVwZGF0ZVxucmVuZGVyLm9uKCdmcmFtZScsIGZ1bmN0aW9uKCkge1xuICAvLyBjaGVjayBjb250cm9sIHN0YXRlcyBhbmQgdXBkYXRlIHBsYXllclxuICB1cGRhdGVQbGF5ZXIoKTtcbiAgXG59KTtcblxuZnVuY3Rpb24gdXBkYXRlUGxheWVyKCkge1xuICB2YXIgc3RlcCwgYmxvY2tSZWYsIG1vdmVtZW50O1xuICBzdGVwID0gNDtcbiAgbW92ZW1lbnQgPSB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH07XG4gIFxuICBpZihhY3Rpb25Db29sRG93bikge1xuICAgIGFjdGlvbkNvb2xEb3duIC09IDE7XG4gIH0gIFxuICBcbiAgaWYoY29udHJvbHMuYSkge1xuICAgIGlmKHBsYXllci54IC0gc3RlcCA+PSAwKSB7XG4gICAgICBtb3ZlbWVudC54ID0gLXN0ZXA7XG4gICAgfVxuICB9IGVsc2UgaWYoY29udHJvbHMuZCkge1xuICAgIG1vdmVtZW50LnggPSBzdGVwO1xuICB9XG5cbiAgaWYoY29udHJvbHMudykge1xuICAgIGlmKHBsYXllci55IC0gc3RlcCA+PSAwKSB7XG4gICAgICBtb3ZlbWVudC55ID0gLXN0ZXA7XG4gICAgfVxuICB9IGVsc2UgaWYoY29udHJvbHMucykge1xuICAgIG1vdmVtZW50LnkgPSBzdGVwO1xuICB9XG5cbiAgcGxheWVyLnggKz0gbW92ZW1lbnQueDtcbiAgcGxheWVyLnkgKz0gbW92ZW1lbnQueTtcblxuICAvLyBjaGVjayBjb2xsaXNpb25zIGF0IFxuICBmb3IodmFyIGlkIGluIGJsb2Nrcykge1xuICAgIHZhciBibG9jayA9IGJsb2Nrc1tpZF07XG4gICAgLy8gZ2V0IGhvbGQgb2YgYm90aCBzcHJpdGVzXG4gICAgLy9pZiAoUmVjdEEuWDEgPCBSZWN0Qi5YMiAmJiBSZWN0QS5YMiA+IFJlY3RCLlgxICYmXG4gICAgLy9SZWN0QS5ZMSA8IFJlY3RCLlkyICYmIFJlY3RBLlkyID4gUmVjdEIuWTEpIFxuICAgIFxuICB9IFxuICAgIFxuICAvLyBpZiB3ZSBhcmUgZ29pbmcgdG8gbW92ZVxuICBwbGF5ZXJSZWYuc2V0KHBsYXllcik7XG5cbiAgaWYoY29udHJvbHMuc3BhY2UgJiYgIWFjdGlvbkNvb2xEb3duKSB7XG4gICAgY29uc29sZS5sb2coYmxvY2tTdG9yZSwgYmxvY2tUeXBlKTtcbiAgICBibG9ja1JlZiA9IGZpcmViYXNlLmNoaWxkKCdibG9ja3MnKTtcbiAgICBibG9ja1JlZi5zZXQoe1xuICAgICAgc3ByaXRlOiBibG9ja1N0b3JlW2Jsb2NrVHlwZV0ubmFtZSxcbiAgICAgIHg6IHBsYXllci54IC0gcGxheWVyLnggJSAzMixcbiAgICAgIHk6IHBsYXllci55IC0gcGxheWVyLnkgJSAzMlxuICAgIH0pO1xuICAgIGFjdGlvbkNvb2xEb3duID0gNTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtZXNzYWdlKHRleHQpIHtcbiAgY2xlYXJUaW1lb3V0KG1lc3NhZ2VUaW1lb3V0KTtcbiAgcGxheWVyLm1lc3NhZ2UgPSB0ZXh0O1xuICBwbGF5ZXJSZWYuc2V0KHBsYXllcik7XG5cbiAgbWVzc2FnZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGRlbGV0ZSBwbGF5ZXIubWVzc2FnZTtcbiAgICBwbGF5ZXJSZWYuc2V0KHBsYXllcik7XG4gIH0sIDUwMDApO1xufVxuIiwidmFyIGJsb2NrcyA9IHJlcXVpcmUoJy4vYmxvY2tzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZXh0ZXJuYWxzKSB7XG4gIC8vIHNob3VsZCBvbmx5IGJlIGNhbGxlZCB3aGVuIERPTSBpcyByZWFkeVxuICB2YXIgbWVzc2FnZUlucHV0LCBzZW5kQnV0dG9uLCBnYW1lQ2FudmFzLCBibG9ja1R5cGVzO1xuICBtZXNzYWdlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZScpO1xuICBzZW5kQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbmQnKTtcbiAgZ2FtZUNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnYW1lLWNhbnZhcycpO1xuICBibG9ja1R5cGVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jsb2NrcycpO1xuICBcbiAgZnVuY3Rpb24ga2V5VXAoZSkge1xuICAgIC8vIHN0b3AgdGhlc2UgZXZlbnRzIGZyb21cbiAgICAvLyB0cmlnZ2VyaW5nIGdhbWUgZXZlbnRzXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBcbiAgICBpZihlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAgIHNlbmRNZXNzYWdlKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2xvYmFsS2V5VXAoZSkge1xuICAgICAgICBcbiAgICBpZihlLmtleUNvZGUgPT09IDg0KSB7XG4gICAgICBjb25zb2xlLmxvZygnZm9jdXMnKTtcbiAgICAgIG1lc3NhZ2VJbnB1dC5mb2N1cygpO1xuICAgIH1cbiAgICBpZihlLmtleUNvZGUgPT09IDEzKSB7XG4gICAgICAvLyBzd2l0Y2ggdG8gY2hhdFxuICAgICAgbWVzc2FnZUlucHV0LmZvY3VzKCk7XG4gICAgfVxuICAgIGlmKGUua2V5Q29kZSA+IDQ3ICYmIGUua2V5Q29kZSA8IDU4KSB7XG4gICAgICBleHRlcm5hbHMuY2hhbmdlQmxvY2soZS5rZXlDb2RlIC0gNDgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGtleURvd24oZSkge1xuICAgIC8vIHN0b3AgdGhlc2UgZXZlbnRzIGZyb21cbiAgICAvLyB0cmlnZ2VyaW5nIGdhbWUgZXZlbnRzXG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbmRNZXNzYWdlKCkge1xuICAgIGV4dGVybmFscy5tZXNzYWdlKG1lc3NhZ2VJbnB1dC52YWx1ZSk7XG4gICAgbWVzc2FnZUlucHV0LnZhbHVlID0gJyc7XG4gICAgY29uc29sZS5sb2coZ2FtZUNhbnZhcyk7XG4gICAgbWVzc2FnZUlucHV0LmJsdXIoKTtcbiAgfVxuICBcbiAgZnVuY3Rpb24gZGlzcGxheVRpbGVzKCkge1xuICAgIGZvcih2YXIgaWQgaW4gYmxvY2tzKSB7XG4gICAgICBjb25zb2xlLmxvZyhibG9ja3NbaWRdKTtcbiAgICAgIGJsb2NrVHlwZXMuYXBwZW5kQ2hpbGQoYmxvY2tzW2lkXSk7XG4gICAgfSAgIFxuICB9XG4gICAgICBcbiAgc2VuZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbmRNZXNzYWdlKTtcbiAgbWVzc2FnZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBrZXlEb3duKTtcbiAgbWVzc2FnZUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywga2V5VXApO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBnbG9iYWxLZXlVcCk7XG4gIGdhbWVDYW52YXMuZm9jdXMoKTtcbiAgZGlzcGxheVRpbGVzKCk7XG59O1xuIiwidmFyIHNwcml0ZXMgPSByZXF1aXJlKCcuL3Nwcml0ZXMnKSxcbiAgICBzb3J0ID0gcmVxdWlyZSgnLi9zb3J0Jyk7XG4gICAgY2FtZXJhID0gcmVxdWlyZSgnLi9jYW1lcmEnKTtcbiAgXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNhbnZhc0lkKSB7XG4gIHZhciBjYW52YXMsIGN0eCwgZXZlbnRzLCBlbnRpdGllcywgaGVpZ2h0LCB3aWR0aDtcbiAgXG4gIGV2ZW50cyA9IHt9O1xuICBlbnRpdGllcyA9IFtdOyBcbiBcbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXNJZCk7XG4gICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIFxuICAgIC8vIHJlc2l6ZSBjYW52YXMgdG8gZml0IHNjcmVlblxuICAgIHJlc2l6ZSgpO1xuICAgIFxuICAgIC8vIHRyaWdnZXIgb3VyIHJlYWR5IGV2ZW50c1xuICAgIHJlbmRlci50cmlnZ2VyKCdyZWFkeScpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzaXplKCkge1xuICAgIHdpZHRoID0gY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgaGVpZ2h0ID0gY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICBzZXRUaW1lb3V0KHJlbmRlciwgNTApO1xuICAgIC8vcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgcmVuZGVyLnRyaWdnZXIoJ2ZyYW1lJyk7XG4gICAgXG4gICAgY3R4LmZpbGxTdHlsZSA9ICdncmVlbic7XG4gICAgY3R4LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgIFxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBlbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVuZGVyRW50aXR5TGlzdChlbnRpdGllc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyRW50aXR5TGlzdChlbnRpdHlMaXN0KSB7XG4gICAgLy8gc29ydCBlbnRpdGllcyBpbnRvIGFzY2VuZGluZyB5IG9yZGVyXG4gICAgZW50aXR5TGlzdCA9IHNvcnQoZW50aXR5TGlzdCwgJ3knKTtcbiAgICBmb3IodmFyIGlkIGluIGVudGl0eUxpc3QpIHtcbiAgICAgIHJlbmRlckVudGl0eShlbnRpdHlMaXN0W2lkXSk7XG4gICAgfVxuICB9XG5cbiAgICBcbiAgZnVuY3Rpb24gcmVuZGVyRW50aXR5KGVudGl0eSkge1xuICAgIHZhciBvZmZzZXRYLCBvZmZzZXRZLCBzcHJpdGUsIG1pZFgsIG1pZFksIG1zZztcblxuICAgIHNwcml0ZSA9IHNwcml0ZXNbZW50aXR5LnNwcml0ZV07XG4gICAgbWlkWCA9IHdpZHRoIC8gMjtcbiAgICBtaWRZID0gaGVpZ2h0IC8gMjsgICAgICBcbiAgICBvZmZzZXRYID0gNjQgLSBzcHJpdGUudyAqIDI7XG4gICAgb2Zmc2V0WSA9IDY0IC0gc3ByaXRlLmggKiAyO1xuICAgIFxuICAgIGN0eC5zYXZlKCk7XG4gICAgaWYoZW50aXR5Lm1lc3NhZ2UpIHtcbiAgICAgIGNvbnNvbGUuZ3JvdXAoJ0NvbnRleHQnKTtcbiAgICAgIGNvbnNvbGUubG9nKCdUcmFuc2xhdGUnLCBlbnRpdHkueCwgZW50aXR5LnkpO1xuICAgICAgY29uc29sZS5sb2coJ0RyYXcgQXQnLCAyICogbWlkWCAtIGNhbWVyYS54LCAyICogbWlkWSAtIGNhbWVyYS55LFxuICAgICAgICBzcHJpdGUudyAqIDIsIHNwcml0ZS5oICogMlxuICAgICAgKVxuICAgICAgY29uc29sZS5ncm91cEVuZCgnQ29udGV4dCcpO1xuICAgIH1cbiAgICBjdHgudHJhbnNsYXRlKGVudGl0eS54ICogMiwgZW50aXR5LnkgKiAyKTtcbiAgICBjdHguZHJhd0ltYWdlKHNwcml0ZSwgXG4gICAgICBtaWRYIC0gY2FtZXJhLnggKiAyLCBcbiAgICAgIG1pZFkgLSBjYW1lcmEueSAqIDIsXG4gICAgICBzcHJpdGUudyAqIDIsXG4gICAgICBzcHJpdGUuaCAqIDIpO1xuICAgICBcbiAgICBpZihtc2cgPSBlbnRpdHkubWVzc2FnZSkge1xuICAgICAgcmVuZGVyTWVzc2FnZShlbnRpdHksIGVudGl0eS5tZXNzYWdlLCBcbiAgICAgICAgbWlkWCAtIGNhbWVyYS54ICogMiArIHNwcml0ZS53LFxuICAgICAgICBtaWRZIC0gY2FtZXJhLnkgKiAyKTsgXG4gICAgfVxuXG4gICAgY3R4LnJlc3RvcmUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlck1lc3NhZ2UoZW50aXR5LCBzdHJpbmcsIHgsIHkpe1xuICAgIHZhciB0ZXh0V2lkdGgsIHBhZCwgaGFsZndheTtcbiAgICBjdHguZm9udCA9ICc4cHQgYXJpYWwnO1xuICAgIGlmKGVudGl0eS5hZG1pbikge1xuICAgICAgc3RyaW5nID0gJ+KZmycgKyBzdHJpbmc7XG4gICAgfVxuXG4gICAgcGFkID0gNDtcbiAgICB0ZXh0V2lkdGggPSBjdHgubWVhc3VyZVRleHQoc3RyaW5nKS53aWR0aDtcbiAgICBoYWxmd2F5ID0gdGV4dFdpZHRoIC8gMjsgICAgXG5cbiAgICBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsMC42KSc7XG4gICAgY3R4LmZpbGxSZWN0KHggLSBwYWQgLyAyIC0gaGFsZndheSwgeSAtIDIwLCB0ZXh0V2lkdGggKyBwYWQsIDE0KTtcbiAgICBcbiAgICBpZihlbnRpdHkuYWRtaW4pIHtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnI2ZmYWEwMCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnI2ZmZic7XG4gICAgfVxuICAgIGN0eC5maWxsVGV4dChzdHJpbmcsIHggLSBoYWxmd2F5LCB5IC0gMTApO1xuICB9XG4gXG4gIHJlbmRlci5iaW5kRW50aXR5ID0gZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgZW50aXRpZXMucHVzaChlbnRpdHkpO1xuICB9XG5cbiAgcmVuZGVyLm9uID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZighZXZlbnRzW25hbWVdKSBldmVudHNbbmFtZV0gPSBbXTtcbiAgICBldmVudHNbbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICByZW5kZXIudHJpZ2dlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZighZXZlbnRzW25hbWVdKSByZXR1cm47XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGV2ZW50c1tuYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgZXZlbnRzW25hbWVdW2ldLmFwcGx5KHJlbmRlciwgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGluaXQpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplKTtcblxuICByZXR1cm4gcmVuZGVyO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc29ydChsaXN0LCBvbikge1xuICB2YXIgdmFsLCBvcmRlcmVkLCBzb3J0ZWQ7XG4gIHNvcnRlZCA9IFtdO1xuICBvcmRlcmVkID0gW107XG5cbiAgZm9yKHZhciBpZCBpbiBsaXN0KSB7XG4gICAgdmFsID0gbGlzdFtpZF1bb25dO1xuXG4gICAgd2hpbGUodHlwZW9mIG9yZGVyZWRbdmFsXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhbCsrO1xuICAgIH1cblxuICAgIGlmKG9yZGVyZWRbdmFsXSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBvcmRlcmVkW3ZhbF0ucHVzaChsaXN0W2lkXSlcbiAgICB9IGVsc2Uge1xuICAgICAgb3JkZXJlZFt2YWxdID0gW2xpc3RbaWRdXTtcbiAgICB9XG4gIH1cblxuICBmb3IodmFyIGkgPSAwOyBpIDwgb3JkZXJlZC5sZW5ndGg7IGkrKykge1xuICAgIGlmKG9yZGVyZWRbaV0pIHtcbiAgICAgIHNvcnRlZCA9IHNvcnRlZC5jb25jYXQob3JkZXJlZFtpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNvcnRlZDtcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1cmwsIHdpZHRoLCBoZWlnaHQsIG5hbWUpIHtcbiAgdmFyIGltYWdlO1xuICBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICBpbWFnZS5uYW1lID0gbmFtZTtcbiAgaW1hZ2Uuc3JjID0gJ2ltZy8nICsgdXJsO1xuICBpbWFnZS5oID0gaGVpZ2h0O1xuICBpbWFnZS53ID0gd2lkdGg7IFxuICByZXR1cm4gaW1hZ2U7XG59O1xuIiwidmFyIHNwcml0ZSA9IHJlcXVpcmUoJy4vc3ByaXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBwbGF5ZXI6IHNwcml0ZSgncGxheWVyLnBuZycsIDMyLCAzMiwgJ3BsYXllcicpLFxuICBzdG9uZTogc3ByaXRlKCdzdG9uZS5wbmcnLCAzMiwgNDgsICdzdG9uZScpLFxuICB3b29kOiBzcHJpdGUoJ3dvb2QucG5nJywgMzIsIDQ4LCAnd29vZCcpXG59O1xuIl19

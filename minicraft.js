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
      needsUpdate = true;
    }
  } else if(controls.s) {
    player.y += step;
    needsUpdate = true;
  }

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

  if(needsUpdate) {
    playerRef.set(player);
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvYmxvY2tzLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2NhbWVyYS5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9jb250cm9scy5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9maXJlYmFzZS5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9nYW1lLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2ludGVyZmFjZS5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9yZW5kZXIuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvc29ydC5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9zcHJpdGUuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvc3ByaXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgc3ByaXRlcyA9IHJlcXVpcmUoJy4vc3ByaXRlcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFtcbiAgc3ByaXRlcy5zdG9uZSxcbiAgc3ByaXRlcy53b29kXG5dO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIF94OiAwLFxuICBfeTogMCxcbiAgZm9sbG93aW5nOiBmYWxzZSxcbiAgZW50aXR5OiBudWxsLFxuXG4gIGZvbGxvdzogZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgdGhpcy5mb2xsb3dpbmcgPSB0cnVlO1xuICAgIHRoaXMuZW50aXR5ID0gZW50aXR5O1xuICB9LFxuXG4gIGdldCB4KCkge1xuICAgIHJldHVybiB0aGlzLmZvbGxvd2luZyA/IHRoaXMuZW50aXR5LnggOiB0aGlzLl94O1xuICB9LFxuXG4gIGdldCB5KCkge1xuICAgIHJldHVybiB0aGlzLmZvbGxvd2luZyA/IHRoaXMuZW50aXR5LnkgOiB0aGlzLl95OyBcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgc3RhdGVzLCBrZXlNYXA7ICBcbiAgXG4gIHN0YXRlcyA9IHt9O1xuICBrZXlNYXAgPSB7XG4gICAgMzc6ICdsZWZ0JyxcbiAgICAzODogJ3VwJyxcbiAgICAzOTogJ3JpZ2h0JyxcbiAgICA0MDogJ2Rvd24nLFxuICAgIDMyOiAnc3BhY2UnLFxuICAgIDEzOiAnZW50ZXInLFxuICAgIDk6ICd0YWInXG4gIH07XG5cbiAgZnVuY3Rpb24gY2hhbmdlU3RhdGUoc3RhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIG1hcHBlZDtcbiAgICAgIG1hcHBlZCA9IGtleU1hcFtlLmtleUNvZGVdIHx8IFN0cmluZy5mcm9tQ2hhckNvZGUoZS5rZXlDb2RlKTtcbiAgICAgIHN0YXRlc1ttYXBwZWQudG9Mb3dlckNhc2UoKV0gPSBzdGF0ZTtcbiAgICB9XG4gIH1cblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGNoYW5nZVN0YXRlKHRydWUpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgY2hhbmdlU3RhdGUoZmFsc2UpKTtcbiAgXG4gIHJldHVybiBzdGF0ZXM7XG59KSgpO1xuIiwidmFyIGZpcmViYXNlID0gbmV3IEZpcmViYXNlKFwiaHR0cHM6Ly9taW5pY3JhZnQuZmlyZWJhc2Vpby5jb21cIik7XG5cbmZ1bmN0aW9uIGNyZWF0ZShuYW1lKSB7XG4gIHZhciByZWYsIGRhdGEsIGxvYWRlZDtcbiAgIFxuICByZWYgPSByZWZlcmVuY2UobmFtZSk7XG4gIGRhdGEgPSB7fTtcbiAgbG9hZGVkID0gZmFsc2U7XG4gIFxuICAvKnJlZi5vbigndmFsdWUnLCBmdW5jdGlvbihzbmFwKSB7XG4gICAgLy8gc3RvcCB0aGUgcmVmZXJlbmNlIGZyb20gYmVpbmcgb3ZlcndyaXR0ZW5cbiAgICBpZighbG9hZGVkICYmIHNuYXAudmFsKCkpIHtcbiAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmxvZygnY2hhbmdlJywgbmFtZSk7XG4gICAgICBkYXRhID0gc25hcC52YWwoKTtcbiAgICB9XG4gIH0pOyovXG5cbiAgcmVmLm9uKCdjaGlsZF9hZGRlZCcsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICBkYXRhW3NuYXAubmFtZSgpXSA9IHNuYXAudmFsKCk7IFxuICB9KTtcblxuICByZWYub24oJ2NoaWxkX3JlbW92ZWQnLCBmdW5jdGlvbihzbmFwKSB7XG4gICAgZGVsZXRlIGRhdGFbc25hcC5uYW1lKCldO1xuICB9KTtcblxuICByZWYub24oJ2NoaWxkX2NoYW5nZWQnLCBmdW5jdGlvbihzbmFwKSB7XG4gICAgZGF0YVtzbmFwLm5hbWUoKV0gPSBzbmFwLnZhbCgpO1xuICB9KTtcbiAgXG4gIHJldHVybiBkYXRhO1xufVxuXG5mdW5jdGlvbiByZWZlcmVuY2UobmFtZSkge1xuICByZXR1cm4gZmlyZWJhc2UuY2hpbGQobmFtZSk7XG59XG5cbmZ1bmN0aW9uIGNoaWxkKG5hbWUpIHtcbiAgdmFyIHJlZjtcbiAgcmVmID0gZmlyZWJhc2UuY2hpbGQobmFtZSk7XG4gIHJldHVybiByZWYucHVzaCgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlOiBjcmVhdGUsXG4gIGNoaWxkOiBjaGlsZCxcbiAgcmVmZXJlbmNlOiByZWZlcmVuY2Vcbn07XG4iLCJ2YXIgZmlyZWJhc2UgPSByZXF1aXJlKCcuL2ZpcmViYXNlJyksXG4gICAgcmVuZGVyID0gcmVxdWlyZSgnLi9yZW5kZXInKSgnZ2FtZS1jYW52YXMnKSxcbiAgICBjb250cm9scyA9IHJlcXVpcmUoJy4vY29udHJvbHMnKSxcbiAgICBjYW1lcmEgPSByZXF1aXJlKCcuL2NhbWVyYScpLFxuICAgIHVpID0gcmVxdWlyZSgnLi9pbnRlcmZhY2UnKSxcbiAgICBibG9ja1N0b3JlID0gcmVxdWlyZSgnLi9ibG9ja3MnKTtcblxudmFyIHBsYXllcnMsIGJsb2NrcywgcGxheWVyLCBwbGF5ZXJSZWYsIFxuYWN0aW9uQ29vbERvd24sIG1lc3NhZ2VUaW1lb3V0LCBibG9ja1R5cGU7XG5cbmFjdGlvbkNvb2xEb3duID0gMDtcbmJsb2NrVHlwZSA9IDA7XG5cbnBsYXllciA9IHtcbiAgeDogMTAgKiAzMixcbiAgeTogMTAgKiAzMixcbiAgYWRtaW46IHRydWUsXG4gIHNwcml0ZTogJ3BsYXllcicgXG59O1xuXG5jYW1lcmEuZm9sbG93KHBsYXllcik7XG5cbi8vIGNyZWF0ZSBhIG5ldyBwbGF5ZXIgZm9yIHRoaXMgdXNlclxucGxheWVyUmVmID0gZmlyZWJhc2UuY2hpbGQoJ3BsYXllcnMnKTtcbnBsYXllclJlZi5zZXQocGxheWVyKTtcbnBsYXllclJlZi5vbkRpc2Nvbm5lY3QoKS5yZW1vdmUoKTtcblxuLy8gY3JlYXRlIGEgcmVmZXJlbmNlIHRvIGJsb2Nrc1xuYmxvY2tzID0gZmlyZWJhc2UuY3JlYXRlKCdibG9ja3MnKTtcbnJlbmRlci5iaW5kRW50aXR5KGJsb2Nrcyk7XG5cbi8vIGNyZWF0ZSBhIHJlZmVyZW5jZSB0byBwbGF5ZXJzXG5wbGF5ZXJzID0gZmlyZWJhc2UuY3JlYXRlKCdwbGF5ZXJzJyk7XG5yZW5kZXIuYmluZEVudGl0eShwbGF5ZXJzKTtcblxuLy8gd2hlbiB0aGUgZG9jdW1lbnQgaGFzIGxvYWRlZFxucmVuZGVyLm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICBcbiAgLy8gZXhwb3NlIHNvbWUgZXh0ZXJuYWxzIHRvIFVJXG4gIHVpKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGNoYW5nZUJsb2NrOiBmdW5jdGlvbihibG9jaykge1xuICAgICAgYmxvY2tUeXBlID0gYmxvY2s7XG4gICAgfVxuICB9KTtcbiBcbiAgcmVuZGVyKCk7ICBcbn0pO1xuXG4vLyB1cGRhdGVcbnJlbmRlci5vbignZnJhbWUnLCBmdW5jdGlvbigpIHtcbiAgLy8gY2hlY2sgY29udHJvbCBzdGF0ZXMgYW5kIHVwZGF0ZSBwbGF5ZXJcbiAgdXBkYXRlUGxheWVyKCk7XG4gIFxufSk7XG5cbmZ1bmN0aW9uIHVwZGF0ZVBsYXllcigpIHtcbiAgdmFyIHN0ZXAsIG5lZWRzVXBkYXRlLCBibG9ja1JlZjtcbiAgc3RlcCA9IDQ7XG4gIG5lZWRzVXBkYXRlID0gZmFsc2U7XG4gIFxuICBpZihhY3Rpb25Db29sRG93bikge1xuICAgIGFjdGlvbkNvb2xEb3duIC09IDE7XG4gIH0gIFxuICBcbiAgaWYoY29udHJvbHMuYSkge1xuICAgIGlmKHBsYXllci54IC0gc3RlcCA+PSAwKSB7XG4gICAgICBwbGF5ZXIueCAtPSBzdGVwO1xuICAgICAgbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIGlmKGNvbnRyb2xzLmQpIHtcbiAgICBwbGF5ZXIueCArPSBzdGVwO1xuICAgIG5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIGlmKGNvbnRyb2xzLncpIHtcbiAgICBpZihwbGF5ZXIueSAtIHN0ZXAgPj0gMCkge1xuICAgICAgcGxheWVyLnkgLT0gc3RlcDtcbiAgICAgIG5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSBpZihjb250cm9scy5zKSB7XG4gICAgcGxheWVyLnkgKz0gc3RlcDtcbiAgICBuZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH1cblxuICBpZihjb250cm9scy5zcGFjZSAmJiAhYWN0aW9uQ29vbERvd24pIHtcbiAgICBjb25zb2xlLmxvZyhibG9ja1N0b3JlLCBibG9ja1R5cGUpO1xuICAgIGJsb2NrUmVmID0gZmlyZWJhc2UuY2hpbGQoJ2Jsb2NrcycpO1xuICAgIGJsb2NrUmVmLnNldCh7XG4gICAgICBzcHJpdGU6IGJsb2NrU3RvcmVbYmxvY2tUeXBlXS5uYW1lLFxuICAgICAgeDogcGxheWVyLnggLSBwbGF5ZXIueCAlIDMyLFxuICAgICAgeTogcGxheWVyLnkgLSBwbGF5ZXIueSAlIDMyXG4gICAgfSk7XG4gICAgYWN0aW9uQ29vbERvd24gPSA1O1xuICB9XG5cbiAgaWYobmVlZHNVcGRhdGUpIHtcbiAgICBwbGF5ZXJSZWYuc2V0KHBsYXllcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWVzc2FnZSh0ZXh0KSB7XG4gIGNsZWFyVGltZW91dChtZXNzYWdlVGltZW91dCk7XG4gIHBsYXllci5tZXNzYWdlID0gdGV4dDtcbiAgcGxheWVyUmVmLnNldChwbGF5ZXIpO1xuXG4gIG1lc3NhZ2VUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBkZWxldGUgcGxheWVyLm1lc3NhZ2U7XG4gICAgcGxheWVyUmVmLnNldChwbGF5ZXIpO1xuICB9LCA1MDAwKTtcbn1cbiIsInZhciBibG9ja3MgPSByZXF1aXJlKCcuL2Jsb2NrcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGV4dGVybmFscykge1xuICAvLyBzaG91bGQgb25seSBiZSBjYWxsZWQgd2hlbiBET00gaXMgcmVhZHlcbiAgdmFyIG1lc3NhZ2VJbnB1dCwgc2VuZEJ1dHRvbiwgZ2FtZUNhbnZhcywgYmxvY2tUeXBlcztcbiAgbWVzc2FnZUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lc3NhZ2UnKTtcbiAgc2VuZEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZW5kJyk7XG4gIGdhbWVDYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ2FtZS1jYW52YXMnKTtcbiAgYmxvY2tUeXBlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdibG9ja3MnKTtcbiAgXG4gIGZ1bmN0aW9uIGtleVVwKGUpIHtcbiAgICAvLyBzdG9wIHRoZXNlIGV2ZW50cyBmcm9tXG4gICAgLy8gdHJpZ2dlcmluZyBnYW1lIGV2ZW50c1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgXG4gICAgaWYoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgICBzZW5kTWVzc2FnZSgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGdsb2JhbEtleVVwKGUpIHtcbiAgICAgICAgXG4gICAgaWYoZS5rZXlDb2RlID09PSA4NCkge1xuICAgICAgY29uc29sZS5sb2coJ2ZvY3VzJyk7XG4gICAgICBtZXNzYWdlSW5wdXQuZm9jdXMoKTtcbiAgICB9XG4gICAgaWYoZS5rZXlDb2RlID09PSAxMykge1xuICAgICAgLy8gc3dpdGNoIHRvIGNoYXRcbiAgICAgIG1lc3NhZ2VJbnB1dC5mb2N1cygpO1xuICAgIH1cbiAgICBpZihlLmtleUNvZGUgPiA0NyAmJiBlLmtleUNvZGUgPCA1OCkge1xuICAgICAgZXh0ZXJuYWxzLmNoYW5nZUJsb2NrKGUua2V5Q29kZSAtIDQ4KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBrZXlEb3duKGUpIHtcbiAgICAvLyBzdG9wIHRoZXNlIGV2ZW50cyBmcm9tXG4gICAgLy8gdHJpZ2dlcmluZyBnYW1lIGV2ZW50c1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kTWVzc2FnZSgpIHtcbiAgICBleHRlcm5hbHMubWVzc2FnZShtZXNzYWdlSW5wdXQudmFsdWUpO1xuICAgIG1lc3NhZ2VJbnB1dC52YWx1ZSA9ICcnO1xuICAgIGNvbnNvbGUubG9nKGdhbWVDYW52YXMpO1xuICAgIG1lc3NhZ2VJbnB1dC5ibHVyKCk7XG4gIH1cbiAgXG4gIGZ1bmN0aW9uIGRpc3BsYXlUaWxlcygpIHtcbiAgICBmb3IodmFyIGlkIGluIGJsb2Nrcykge1xuICAgICAgY29uc29sZS5sb2coYmxvY2tzW2lkXSk7XG4gICAgICBibG9ja1R5cGVzLmFwcGVuZENoaWxkKGJsb2Nrc1tpZF0pO1xuICAgIH0gICBcbiAgfVxuICAgICAgXG4gIHNlbmRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZW5kTWVzc2FnZSk7XG4gIG1lc3NhZ2VJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywga2V5RG93bik7XG4gIG1lc3NhZ2VJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGtleVVwKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZ2xvYmFsS2V5VXApO1xuICBnYW1lQ2FudmFzLmZvY3VzKCk7XG4gIGRpc3BsYXlUaWxlcygpO1xufTtcbiIsInZhciBzcHJpdGVzID0gcmVxdWlyZSgnLi9zcHJpdGVzJyksXG4gICAgc29ydCA9IHJlcXVpcmUoJy4vc29ydCcpO1xuICAgIGNhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhJyk7XG4gIFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjYW52YXNJZCkge1xuICB2YXIgY2FudmFzLCBjdHgsIGV2ZW50cywgZW50aXRpZXMsIGhlaWdodCwgd2lkdGg7XG4gIFxuICBldmVudHMgPSB7fTtcbiAgZW50aXRpZXMgPSBbXTsgXG4gXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2FudmFzSWQpO1xuICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBcbiAgICAvLyByZXNpemUgY2FudmFzIHRvIGZpdCBzY3JlZW5cbiAgICByZXNpemUoKTtcbiAgICBcbiAgICAvLyB0cmlnZ2VyIG91ciByZWFkeSBldmVudHNcbiAgICByZW5kZXIudHJpZ2dlcigncmVhZHknKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgICB3aWR0aCA9IGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgIGhlaWdodCA9IGNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgc2V0VGltZW91dChyZW5kZXIsIDUwKTtcbiAgICAvL3JlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuICAgIHJlbmRlci50cmlnZ2VyKCdmcmFtZScpO1xuICAgIFxuICAgIGN0eC5maWxsU3R5bGUgPSAnZ3JlZW4nO1xuICAgIGN0eC5maWxsUmVjdCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICBcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgZW50aXRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlbmRlckVudGl0eUxpc3QoZW50aXRpZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlckVudGl0eUxpc3QoZW50aXR5TGlzdCkge1xuICAgIC8vIHNvcnQgZW50aXRpZXMgaW50byBhc2NlbmRpbmcgeSBvcmRlclxuICAgIGVudGl0eUxpc3QgPSBzb3J0KGVudGl0eUxpc3QsICd5Jyk7XG4gICAgZm9yKHZhciBpZCBpbiBlbnRpdHlMaXN0KSB7XG4gICAgICByZW5kZXJFbnRpdHkoZW50aXR5TGlzdFtpZF0pO1xuICAgIH1cbiAgfVxuXG4gICAgXG4gIGZ1bmN0aW9uIHJlbmRlckVudGl0eShlbnRpdHkpIHtcbiAgICB2YXIgb2Zmc2V0WCwgb2Zmc2V0WSwgc3ByaXRlLCBtaWRYLCBtaWRZLCBtc2c7XG5cbiAgICBzcHJpdGUgPSBzcHJpdGVzW2VudGl0eS5zcHJpdGVdO1xuICAgIG1pZFggPSB3aWR0aCAvIDI7XG4gICAgbWlkWSA9IGhlaWdodCAvIDI7ICAgICAgXG4gICAgb2Zmc2V0WCA9IDY0IC0gc3ByaXRlLncgKiAyO1xuICAgIG9mZnNldFkgPSA2NCAtIHNwcml0ZS5oICogMjtcbiAgICBcbiAgICBjdHguc2F2ZSgpO1xuICAgIGlmKGVudGl0eS5tZXNzYWdlKSB7XG4gICAgICBjb25zb2xlLmdyb3VwKCdDb250ZXh0Jyk7XG4gICAgICBjb25zb2xlLmxvZygnVHJhbnNsYXRlJywgZW50aXR5LngsIGVudGl0eS55KTtcbiAgICAgIGNvbnNvbGUubG9nKCdEcmF3IEF0JywgMiAqIG1pZFggLSBjYW1lcmEueCwgMiAqIG1pZFkgLSBjYW1lcmEueSxcbiAgICAgICAgc3ByaXRlLncgKiAyLCBzcHJpdGUuaCAqIDJcbiAgICAgIClcbiAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoJ0NvbnRleHQnKTtcbiAgICB9XG4gICAgY3R4LnRyYW5zbGF0ZShlbnRpdHkueCAqIDIsIGVudGl0eS55ICogMik7XG4gICAgY3R4LmRyYXdJbWFnZShzcHJpdGUsIFxuICAgICAgbWlkWCAtIGNhbWVyYS54ICogMiwgXG4gICAgICBtaWRZIC0gY2FtZXJhLnkgKiAyLFxuICAgICAgc3ByaXRlLncgKiAyLFxuICAgICAgc3ByaXRlLmggKiAyKTtcbiAgICAgXG4gICAgaWYobXNnID0gZW50aXR5Lm1lc3NhZ2UpIHtcbiAgICAgIHJlbmRlck1lc3NhZ2UoZW50aXR5LCBlbnRpdHkubWVzc2FnZSwgXG4gICAgICAgIG1pZFggLSBjYW1lcmEueCAqIDIgKyBzcHJpdGUudyxcbiAgICAgICAgbWlkWSAtIGNhbWVyYS55ICogMik7IFxuICAgIH1cblxuICAgIGN0eC5yZXN0b3JlKCk7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJNZXNzYWdlKGVudGl0eSwgc3RyaW5nLCB4LCB5KXtcbiAgICB2YXIgdGV4dFdpZHRoLCBwYWQsIGhhbGZ3YXk7XG4gICAgY3R4LmZvbnQgPSAnOHB0IGFyaWFsJztcbiAgICBpZihlbnRpdHkuYWRtaW4pIHtcbiAgICAgIHN0cmluZyA9ICfimZsnICsgc3RyaW5nO1xuICAgIH1cblxuICAgIHBhZCA9IDQ7XG4gICAgdGV4dFdpZHRoID0gY3R4Lm1lYXN1cmVUZXh0KHN0cmluZykud2lkdGg7XG4gICAgaGFsZndheSA9IHRleHRXaWR0aCAvIDI7ICAgIFxuXG4gICAgY3R4LmZpbGxTdHlsZSA9ICdyZ2JhKDAsMCwwLDAuNiknO1xuICAgIGN0eC5maWxsUmVjdCh4IC0gcGFkIC8gMiAtIGhhbGZ3YXksIHkgLSAyMCwgdGV4dFdpZHRoICsgcGFkLCAxNCk7XG4gICAgXG4gICAgaWYoZW50aXR5LmFkbWluKSB7XG4gICAgICBjdHguZmlsbFN0eWxlID0gJyNmZmFhMDAnO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdHguZmlsbFN0eWxlID0gJyNmZmYnO1xuICAgIH1cbiAgICBjdHguZmlsbFRleHQoc3RyaW5nLCB4IC0gaGFsZndheSwgeSAtIDEwKTtcbiAgfVxuIFxuICByZW5kZXIuYmluZEVudGl0eSA9IGZ1bmN0aW9uKGVudGl0eSkge1xuICAgIGVudGl0aWVzLnB1c2goZW50aXR5KTtcbiAgfVxuXG4gIHJlbmRlci5vbiA9IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYoIWV2ZW50c1tuYW1lXSkgZXZlbnRzW25hbWVdID0gW107XG4gICAgZXZlbnRzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcmVuZGVyLnRyaWdnZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgaWYoIWV2ZW50c1tuYW1lXSkgcmV0dXJuO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBldmVudHNbbmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGV2ZW50c1tuYW1lXVtpXS5hcHBseShyZW5kZXIsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBpbml0KTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZSk7XG5cbiAgcmV0dXJuIHJlbmRlcjtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNvcnQobGlzdCwgb24pIHtcbiAgdmFyIHZhbCwgb3JkZXJlZCwgc29ydGVkO1xuICBzb3J0ZWQgPSBbXTtcbiAgb3JkZXJlZCA9IFtdO1xuXG4gIGZvcih2YXIgaWQgaW4gbGlzdCkge1xuICAgIHZhbCA9IGxpc3RbaWRdW29uXTtcblxuICAgIHdoaWxlKHR5cGVvZiBvcmRlcmVkW3ZhbF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YWwrKztcbiAgICB9XG5cbiAgICBpZihvcmRlcmVkW3ZhbF0gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgb3JkZXJlZFt2YWxdLnB1c2gobGlzdFtpZF0pXG4gICAgfSBlbHNlIHtcbiAgICAgIG9yZGVyZWRbdmFsXSA9IFtsaXN0W2lkXV07XG4gICAgfVxuICB9XG5cbiAgZm9yKHZhciBpID0gMDsgaSA8IG9yZGVyZWQubGVuZ3RoOyBpKyspIHtcbiAgICBpZihvcmRlcmVkW2ldKSB7XG4gICAgICBzb3J0ZWQgPSBzb3J0ZWQuY29uY2F0KG9yZGVyZWRbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzb3J0ZWQ7XG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odXJsLCB3aWR0aCwgaGVpZ2h0LCBuYW1lKSB7XG4gIHZhciBpbWFnZTtcbiAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgaW1hZ2UubmFtZSA9IG5hbWU7XG4gIGltYWdlLnNyYyA9ICdpbWcvJyArIHVybDtcbiAgaW1hZ2UuaCA9IGhlaWdodDtcbiAgaW1hZ2UudyA9IHdpZHRoOyBcbiAgcmV0dXJuIGltYWdlO1xufTtcbiIsInZhciBzcHJpdGUgPSByZXF1aXJlKCcuL3Nwcml0ZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcGxheWVyOiBzcHJpdGUoJ3BsYXllci5wbmcnLCAzMiwgMzIsICdwbGF5ZXInKSxcbiAgc3RvbmU6IHNwcml0ZSgnc3RvbmUucG5nJywgMzIsIDQ4LCAnc3RvbmUnKSxcbiAgd29vZDogc3ByaXRlKCd3b29kLnBuZycsIDMyLCA0OCwgJ3dvb2QnKVxufTtcbiJdfQ==

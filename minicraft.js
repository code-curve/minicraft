(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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
      states[mapped] = state;
    }
  }
  window.addEventListener('keydown', changeState(true));
  window.addEventListener('keyup', changeState(false));
  
  return states;
})();

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
var firebase = require('./firebase'),
    render = require('./render')('game-canvas'),
    controls = require('./controls'),
    camera = require('./camera'),
    ui = require('./interface');

var players, blocks, player, playerRef, 
actionCoolDown, messageTimeout;

actionCoolDown = 0;

player = {
  x: 0,
  y: 0,
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



function message(text) {
  clearTimeout(messageTimeout);
  player.message = text;
  playerRef.set(player);

  messageTimeout = setTimeout(function() {
    delete player.message;
    playerRef.set(player);
  }, 5000);
}

},{"./camera":1,"./controls":2,"./firebase":3,"./interface":5,"./render":6}],5:[function(require,module,exports){
module.exports = function(externals) {
  // should only be called when DOM is ready
  var messageInput, sendButton;
    
  messageInput = document.getElementById('message');
  sendButton = document.getElementById('send');

  messageInput.addEventListener('keyup', function(e) {
    switch(e.keyCode) {
      case 13:
        externals.message(messageInput.value);
        messageInput.value = ''; 
        break;
      case 85:
        messageInput.focus();
        break;
    }
  });

};

},{}],6:[function(require,module,exports){
var sprite = require('./sprite'),
    sort = require('./sort');
    camera = require('./camera');
  
module.exports = function(canvasId) {
  var canvas, ctx, events, entities, sprites, height, width;
  
  events = {};
  entities = [];
  
  sprites = {
    player: sprite('player.png', 32, 32),
    stone: sprite('stone.png', 32, 48)
  };
  
  function init() {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext('2d');
    ctx.font = '12pt monospace';
  
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
    offsetX = 32 - sprite.w;
    offsetY = 32 - sprite.h;
    
    ctx.save();
    ctx.translate(entity.x, entity.y);
    ctx.drawImage(sprites[entity.sprite], 
      midX - camera.x, 
      midY - camera.y);
     
    if(msg = entity.message) {
      renderMessage(entity.message, 
        midX - camera.x + sprite.w / 2,
        midY - camera.y); 
    }

    ctx.restore();
  }

  function renderMessage(string, x, y) {
    var textWidth, pad, halfway;
    
    pad = 4;
    textWidth = ctx.measureText(string).width;
    halfway = textWidth / 2;    

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - pad / 2 - halfway, y - 20, textWidth + pad, 14);
    ctx.fillStyle = '#fff';
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

},{"./camera":1,"./sort":7,"./sprite":8}],7:[function(require,module,exports){
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


},{}],8:[function(require,module,exports){
module.exports = function(url, width, height) {
  var image;
  image = new Image();
  image.src = 'img/' + url;
  image.h = height;
  image.w = width; 
  return image;
};

},{}]},{},[1,2,3,4,5,6,7,8])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvY2FtZXJhLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2NvbnRyb2xzLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2ZpcmViYXNlLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2dhbWUuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvaW50ZXJmYWNlLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL3JlbmRlci5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9zb3J0LmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL3Nwcml0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSB7XG4gIF94OiAwLFxuICBfeTogMCxcbiAgZm9sbG93aW5nOiBmYWxzZSxcbiAgZW50aXR5OiBudWxsLFxuXG4gIGZvbGxvdzogZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgdGhpcy5mb2xsb3dpbmcgPSB0cnVlO1xuICAgIHRoaXMuZW50aXR5ID0gZW50aXR5O1xuICB9LFxuXG4gIGdldCB4KCkge1xuICAgIHJldHVybiB0aGlzLmZvbGxvd2luZyA/IHRoaXMuZW50aXR5LnggOiB0aGlzLl94O1xuICB9LFxuXG4gIGdldCB5KCkge1xuICAgIHJldHVybiB0aGlzLmZvbGxvd2luZyA/IHRoaXMuZW50aXR5LnkgOiB0aGlzLl95OyBcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgc3RhdGVzLCBrZXlNYXA7ICBcbiAgXG4gIHN0YXRlcyA9IHt9O1xuICBrZXlNYXAgPSB7XG4gICAgMzc6ICdsZWZ0JyxcbiAgICAzODogJ3VwJyxcbiAgICAzOTogJ3JpZ2h0JyxcbiAgICA0MDogJ2Rvd24nLFxuICAgIDMyOiAnc3BhY2UnLFxuICAgIDEzOiAnZW50ZXInLFxuICAgIDk6ICd0YWInXG4gIH07XG5cbiAgZnVuY3Rpb24gY2hhbmdlU3RhdGUoc3RhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIG1hcHBlZDtcbiAgICAgIG1hcHBlZCA9IGtleU1hcFtlLmtleUNvZGVdIHx8IFN0cmluZy5mcm9tQ2hhckNvZGUoZS5rZXlDb2RlKTtcbiAgICAgIHN0YXRlc1ttYXBwZWRdID0gc3RhdGU7XG4gICAgfVxuICB9XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgY2hhbmdlU3RhdGUodHJ1ZSkpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBjaGFuZ2VTdGF0ZShmYWxzZSkpO1xuICBcbiAgcmV0dXJuIHN0YXRlcztcbn0pKCk7XG4iLCJ2YXIgZmlyZWJhc2UgPSBuZXcgRmlyZWJhc2UoXCJodHRwczovL21pbmljcmFmdC5maXJlYmFzZWlvLmNvbVwiKTtcblxuZnVuY3Rpb24gY3JlYXRlKG5hbWUpIHtcbiAgdmFyIHJlZiwgZGF0YSwgbG9hZGVkO1xuICAgXG4gIHJlZiA9IHJlZmVyZW5jZShuYW1lKTtcbiAgZGF0YSA9IHt9O1xuICBsb2FkZWQgPSBmYWxzZTtcbiAgXG4gIC8qcmVmLm9uKCd2YWx1ZScsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICAvLyBzdG9wIHRoZSByZWZlcmVuY2UgZnJvbSBiZWluZyBvdmVyd3JpdHRlblxuICAgIGlmKCFsb2FkZWQgJiYgc25hcC52YWwoKSkge1xuICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUubG9nKCdjaGFuZ2UnLCBuYW1lKTtcbiAgICAgIGRhdGEgPSBzbmFwLnZhbCgpO1xuICAgIH1cbiAgfSk7Ki9cblxuICByZWYub24oJ2NoaWxkX2FkZGVkJywgZnVuY3Rpb24oc25hcCkge1xuICAgIGRhdGFbc25hcC5uYW1lKCldID0gc25hcC52YWwoKTsgXG4gIH0pO1xuXG4gIHJlZi5vbignY2hpbGRfcmVtb3ZlZCcsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICBkZWxldGUgZGF0YVtzbmFwLm5hbWUoKV07XG4gIH0pO1xuXG4gIHJlZi5vbignY2hpbGRfY2hhbmdlZCcsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICBkYXRhW3NuYXAubmFtZSgpXSA9IHNuYXAudmFsKCk7XG4gIH0pO1xuICBcbiAgcmV0dXJuIGRhdGE7XG59XG5cbmZ1bmN0aW9uIHJlZmVyZW5jZShuYW1lKSB7XG4gIHJldHVybiBmaXJlYmFzZS5jaGlsZChuYW1lKTtcbn1cblxuZnVuY3Rpb24gY2hpbGQobmFtZSkge1xuICB2YXIgcmVmO1xuICByZWYgPSBmaXJlYmFzZS5jaGlsZChuYW1lKTtcbiAgcmV0dXJuIHJlZi5wdXNoKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6IGNyZWF0ZSxcbiAgY2hpbGQ6IGNoaWxkLFxuICByZWZlcmVuY2U6IHJlZmVyZW5jZVxufTtcbiIsInZhciBmaXJlYmFzZSA9IHJlcXVpcmUoJy4vZmlyZWJhc2UnKSxcbiAgICByZW5kZXIgPSByZXF1aXJlKCcuL3JlbmRlcicpKCdnYW1lLWNhbnZhcycpLFxuICAgIGNvbnRyb2xzID0gcmVxdWlyZSgnLi9jb250cm9scycpLFxuICAgIGNhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhJyksXG4gICAgdWkgPSByZXF1aXJlKCcuL2ludGVyZmFjZScpO1xuXG52YXIgcGxheWVycywgYmxvY2tzLCBwbGF5ZXIsIHBsYXllclJlZiwgXG5hY3Rpb25Db29sRG93biwgbWVzc2FnZVRpbWVvdXQ7XG5cbmFjdGlvbkNvb2xEb3duID0gMDtcblxucGxheWVyID0ge1xuICB4OiAwLFxuICB5OiAwLFxuICBzcHJpdGU6ICdwbGF5ZXInIFxufTtcblxuY2FtZXJhLmZvbGxvdyhwbGF5ZXIpO1xuXG4vLyBjcmVhdGUgYSBuZXcgcGxheWVyIGZvciB0aGlzIHVzZXJcbnBsYXllclJlZiA9IGZpcmViYXNlLmNoaWxkKCdwbGF5ZXJzJyk7XG5wbGF5ZXJSZWYuc2V0KHBsYXllcik7XG5wbGF5ZXJSZWYub25EaXNjb25uZWN0KCkucmVtb3ZlKCk7XG5cbi8vIGNyZWF0ZSBhIHJlZmVyZW5jZSB0byBibG9ja3NcbmJsb2NrcyA9IGZpcmViYXNlLmNyZWF0ZSgnYmxvY2tzJyk7XG5yZW5kZXIuYmluZEVudGl0eShibG9ja3MpO1xuXG4vLyBjcmVhdGUgYSByZWZlcmVuY2UgdG8gcGxheWVyc1xucGxheWVycyA9IGZpcmViYXNlLmNyZWF0ZSgncGxheWVycycpO1xucmVuZGVyLmJpbmRFbnRpdHkocGxheWVycyk7XG5cbi8vIHdoZW4gdGhlIGRvY3VtZW50IGhhcyBsb2FkZWRcbnJlbmRlci5vbigncmVhZHknLCBmdW5jdGlvbigpIHtcbiAgdWkoe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgfSk7XG4gIHJlbmRlcigpOyAgXG59KTtcblxuLy8gdXBkYXRlXG5yZW5kZXIub24oJ2ZyYW1lJywgZnVuY3Rpb24oKSB7XG4gIC8vIGNoZWNrIGNvbnRyb2wgc3RhdGVzIGFuZCB1cGRhdGUgcGxheWVyXG4gIHZhciBzdGVwLCBuZWVkc1VwZGF0ZSwgYmxvY2tSZWY7XG5cbiAgc3RlcCA9IDQ7XG4gIG5lZWRzVXBkYXRlID0gZmFsc2U7XG4gIFxuICBpZihhY3Rpb25Db29sRG93bikge1xuICAgIGFjdGlvbkNvb2xEb3duIC09IDE7XG4gIH0gIFxuIFxuICBpZihjb250cm9scy5sZWZ0KSB7XG4gICAgcGxheWVyLnggLT0gc3RlcDtcbiAgICBuZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH0gZWxzZSBpZihjb250cm9scy5yaWdodCkge1xuICAgIHBsYXllci54ICs9IHN0ZXA7XG4gICAgbmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgaWYoY29udHJvbHMudXApIHtcbiAgICBwbGF5ZXIueSAtPSBzdGVwO1xuICAgIG5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfSBlbHNlIGlmKGNvbnRyb2xzLmRvd24pIHtcbiAgICBwbGF5ZXIueSArPSBzdGVwO1xuICAgIG5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIGlmKGNvbnRyb2xzLnNwYWNlICYmICFhY3Rpb25Db29sRG93bikge1xuICAgIGJsb2NrUmVmID0gZmlyZWJhc2UuY2hpbGQoJ2Jsb2NrcycpO1xuICAgIGJsb2NrUmVmLnNldCh7XG4gICAgICB0eXBlOiAwLFxuICAgICAgc3ByaXRlOiAnc3RvbmUnLFxuICAgICAgeDogcGxheWVyLnggLSBwbGF5ZXIueCAlIDMyLFxuICAgICAgeTogcGxheWVyLnkgLSBwbGF5ZXIueSAlIDMyXG4gICAgfSk7XG4gICAgYWN0aW9uQ29vbERvd24gPSA1O1xuICB9XG5cbiAgaWYobmVlZHNVcGRhdGUpIHtcbiAgICBwbGF5ZXJSZWYuc2V0KHBsYXllcik7XG4gIH1cbn0pO1xuXG5cblxuZnVuY3Rpb24gbWVzc2FnZSh0ZXh0KSB7XG4gIGNsZWFyVGltZW91dChtZXNzYWdlVGltZW91dCk7XG4gIHBsYXllci5tZXNzYWdlID0gdGV4dDtcbiAgcGxheWVyUmVmLnNldChwbGF5ZXIpO1xuXG4gIG1lc3NhZ2VUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBkZWxldGUgcGxheWVyLm1lc3NhZ2U7XG4gICAgcGxheWVyUmVmLnNldChwbGF5ZXIpO1xuICB9LCA1MDAwKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZXh0ZXJuYWxzKSB7XG4gIC8vIHNob3VsZCBvbmx5IGJlIGNhbGxlZCB3aGVuIERPTSBpcyByZWFkeVxuICB2YXIgbWVzc2FnZUlucHV0LCBzZW5kQnV0dG9uO1xuICAgIFxuICBtZXNzYWdlSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZScpO1xuICBzZW5kQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbmQnKTtcblxuICBtZXNzYWdlSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihlKSB7XG4gICAgc3dpdGNoKGUua2V5Q29kZSkge1xuICAgICAgY2FzZSAxMzpcbiAgICAgICAgZXh0ZXJuYWxzLm1lc3NhZ2UobWVzc2FnZUlucHV0LnZhbHVlKTtcbiAgICAgICAgbWVzc2FnZUlucHV0LnZhbHVlID0gJyc7IFxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgODU6XG4gICAgICAgIG1lc3NhZ2VJbnB1dC5mb2N1cygpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH0pO1xuXG59O1xuIiwidmFyIHNwcml0ZSA9IHJlcXVpcmUoJy4vc3ByaXRlJyksXG4gICAgc29ydCA9IHJlcXVpcmUoJy4vc29ydCcpO1xuICAgIGNhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhJyk7XG4gIFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjYW52YXNJZCkge1xuICB2YXIgY2FudmFzLCBjdHgsIGV2ZW50cywgZW50aXRpZXMsIHNwcml0ZXMsIGhlaWdodCwgd2lkdGg7XG4gIFxuICBldmVudHMgPSB7fTtcbiAgZW50aXRpZXMgPSBbXTtcbiAgXG4gIHNwcml0ZXMgPSB7XG4gICAgcGxheWVyOiBzcHJpdGUoJ3BsYXllci5wbmcnLCAzMiwgMzIpLFxuICAgIHN0b25lOiBzcHJpdGUoJ3N0b25lLnBuZycsIDMyLCA0OClcbiAgfTtcbiAgXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2FudmFzSWQpO1xuICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGN0eC5mb250ID0gJzEycHQgbW9ub3NwYWNlJztcbiAgXG4gICAgLy8gcmVzaXplIGNhbnZhcyB0byBmaXQgc2NyZWVuXG4gICAgcmVzaXplKCk7XG4gICAgXG4gICAgLy8gdHJpZ2dlciBvdXIgcmVhZHkgZXZlbnRzXG4gICAgcmVuZGVyLnRyaWdnZXIoJ3JlYWR5Jyk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNpemUoKSB7XG4gICAgd2lkdGggPSBjYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICBoZWlnaHQgPSBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHNldFRpbWVvdXQocmVuZGVyLCA1MCk7XG4gICAgLy9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICByZW5kZXIudHJpZ2dlcignZnJhbWUnKTtcbiAgICBcbiAgICBjdHguZmlsbFN0eWxlID0gJ2dyZWVuJztcbiAgICBjdHguZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZW5kZXJFbnRpdHlMaXN0KGVudGl0aWVzW2ldKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJFbnRpdHlMaXN0KGVudGl0eUxpc3QpIHtcbiAgICAvLyBzb3J0IGVudGl0aWVzIGludG8gYXNjZW5kaW5nIHkgb3JkZXJcbiAgICBlbnRpdHlMaXN0ID0gc29ydChlbnRpdHlMaXN0LCAneScpO1xuICAgIGZvcih2YXIgaWQgaW4gZW50aXR5TGlzdCkge1xuICAgICAgcmVuZGVyRW50aXR5KGVudGl0eUxpc3RbaWRdKTtcbiAgICB9XG4gIH1cblxuICAgIFxuICBmdW5jdGlvbiByZW5kZXJFbnRpdHkoZW50aXR5KSB7XG4gICAgdmFyIG9mZnNldFgsIG9mZnNldFksIHNwcml0ZSwgbWlkWCwgbWlkWSwgbXNnO1xuXG4gICAgc3ByaXRlID0gc3ByaXRlc1tlbnRpdHkuc3ByaXRlXTtcbiAgICBtaWRYID0gd2lkdGggLyAyO1xuICAgIG1pZFkgPSBoZWlnaHQgLyAyOyAgICAgIFxuICAgIG9mZnNldFggPSAzMiAtIHNwcml0ZS53O1xuICAgIG9mZnNldFkgPSAzMiAtIHNwcml0ZS5oO1xuICAgIFxuICAgIGN0eC5zYXZlKCk7XG4gICAgY3R4LnRyYW5zbGF0ZShlbnRpdHkueCwgZW50aXR5LnkpO1xuICAgIGN0eC5kcmF3SW1hZ2Uoc3ByaXRlc1tlbnRpdHkuc3ByaXRlXSwgXG4gICAgICBtaWRYIC0gY2FtZXJhLngsIFxuICAgICAgbWlkWSAtIGNhbWVyYS55KTtcbiAgICAgXG4gICAgaWYobXNnID0gZW50aXR5Lm1lc3NhZ2UpIHtcbiAgICAgIHJlbmRlck1lc3NhZ2UoZW50aXR5Lm1lc3NhZ2UsIFxuICAgICAgICBtaWRYIC0gY2FtZXJhLnggKyBzcHJpdGUudyAvIDIsXG4gICAgICAgIG1pZFkgLSBjYW1lcmEueSk7IFxuICAgIH1cblxuICAgIGN0eC5yZXN0b3JlKCk7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJNZXNzYWdlKHN0cmluZywgeCwgeSkge1xuICAgIHZhciB0ZXh0V2lkdGgsIHBhZCwgaGFsZndheTtcbiAgICBcbiAgICBwYWQgPSA0O1xuICAgIHRleHRXaWR0aCA9IGN0eC5tZWFzdXJlVGV4dChzdHJpbmcpLndpZHRoO1xuICAgIGhhbGZ3YXkgPSB0ZXh0V2lkdGggLyAyOyAgICBcblxuICAgIGN0eC5maWxsU3R5bGUgPSAncmdiYSgwLDAsMCwwLjYpJztcbiAgICBjdHguZmlsbFJlY3QoeCAtIHBhZCAvIDIgLSBoYWxmd2F5LCB5IC0gMjAsIHRleHRXaWR0aCArIHBhZCwgMTQpO1xuICAgIGN0eC5maWxsU3R5bGUgPSAnI2ZmZic7XG4gICAgY3R4LmZpbGxUZXh0KHN0cmluZywgeCAtIGhhbGZ3YXksIHkgLSAxMCk7XG4gIH1cbiBcbiAgcmVuZGVyLmJpbmRFbnRpdHkgPSBmdW5jdGlvbihlbnRpdHkpIHtcbiAgICBlbnRpdGllcy5wdXNoKGVudGl0eSk7XG4gIH1cblxuICByZW5kZXIub24gPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xuICAgIGlmKCFldmVudHNbbmFtZV0pIGV2ZW50c1tuYW1lXSA9IFtdO1xuICAgIGV2ZW50c1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHJlbmRlci50cmlnZ2VyID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGlmKCFldmVudHNbbmFtZV0pIHJldHVybjtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgZXZlbnRzW25hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICBldmVudHNbbmFtZV1baV0uYXBwbHkocmVuZGVyLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgaW5pdCk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZXNpemUpO1xuXG4gIHJldHVybiByZW5kZXI7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzb3J0KGxpc3QsIG9uKSB7XG4gIHZhciB2YWwsIG9yZGVyZWQsIHNvcnRlZDtcbiAgc29ydGVkID0gW107XG4gIG9yZGVyZWQgPSBbXTtcblxuICBmb3IodmFyIGlkIGluIGxpc3QpIHtcbiAgICB2YWwgPSBsaXN0W2lkXVtvbl07XG5cbiAgICB3aGlsZSh0eXBlb2Ygb3JkZXJlZFt2YWxdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFsKys7XG4gICAgfVxuXG4gICAgaWYob3JkZXJlZFt2YWxdIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIG9yZGVyZWRbdmFsXS5wdXNoKGxpc3RbaWRdKVxuICAgIH0gZWxzZSB7XG4gICAgICBvcmRlcmVkW3ZhbF0gPSBbbGlzdFtpZF1dO1xuICAgIH1cbiAgfVxuXG4gIGZvcih2YXIgaSA9IDA7IGkgPCBvcmRlcmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYob3JkZXJlZFtpXSkge1xuICAgICAgc29ydGVkID0gc29ydGVkLmNvbmNhdChvcmRlcmVkW2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gc29ydGVkO1xufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHVybCwgd2lkdGgsIGhlaWdodCkge1xuICB2YXIgaW1hZ2U7XG4gIGltYWdlID0gbmV3IEltYWdlKCk7XG4gIGltYWdlLnNyYyA9ICdpbWcvJyArIHVybDtcbiAgaW1hZ2UuaCA9IGhlaWdodDtcbiAgaW1hZ2UudyA9IHdpZHRoOyBcbiAgcmV0dXJuIGltYWdlO1xufTtcbiJdfQ==

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
      states[mapped.toLowerCase()] = state;
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
    ctx.font = '18pt Calibri';
  
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvY2FtZXJhLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2NvbnRyb2xzLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2ZpcmViYXNlLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2dhbWUuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvaW50ZXJmYWNlLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL3JlbmRlci5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9zb3J0LmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL3Nwcml0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSB7XG4gIF94OiAwLFxuICBfeTogMCxcbiAgZm9sbG93aW5nOiBmYWxzZSxcbiAgZW50aXR5OiBudWxsLFxuXG4gIGZvbGxvdzogZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgdGhpcy5mb2xsb3dpbmcgPSB0cnVlO1xuICAgIHRoaXMuZW50aXR5ID0gZW50aXR5O1xuICB9LFxuXG4gIGdldCB4KCkge1xuICAgIHJldHVybiB0aGlzLmZvbGxvd2luZyA/IHRoaXMuZW50aXR5LnggOiB0aGlzLl94O1xuICB9LFxuXG4gIGdldCB5KCkge1xuICAgIHJldHVybiB0aGlzLmZvbGxvd2luZyA/IHRoaXMuZW50aXR5LnkgOiB0aGlzLl95OyBcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgc3RhdGVzLCBrZXlNYXA7ICBcbiAgXG4gIHN0YXRlcyA9IHt9O1xuICBrZXlNYXAgPSB7XG4gICAgMzc6ICdsZWZ0JyxcbiAgICAzODogJ3VwJyxcbiAgICAzOTogJ3JpZ2h0JyxcbiAgICA0MDogJ2Rvd24nLFxuICAgIDMyOiAnc3BhY2UnLFxuICAgIDEzOiAnZW50ZXInLFxuICAgIDk6ICd0YWInXG4gIH07XG5cbiAgZnVuY3Rpb24gY2hhbmdlU3RhdGUoc3RhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZSkge1xuICAgICAgdmFyIG1hcHBlZDtcbiAgICAgIG1hcHBlZCA9IGtleU1hcFtlLmtleUNvZGVdIHx8IFN0cmluZy5mcm9tQ2hhckNvZGUoZS5rZXlDb2RlKTtcbiAgICAgIHN0YXRlc1ttYXBwZWQudG9Mb3dlckNhc2UoKV0gPSBzdGF0ZTtcbiAgICB9XG4gIH1cblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGNoYW5nZVN0YXRlKHRydWUpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgY2hhbmdlU3RhdGUoZmFsc2UpKTtcbiAgXG4gIHJldHVybiBzdGF0ZXM7XG59KSgpO1xuIiwidmFyIGZpcmViYXNlID0gbmV3IEZpcmViYXNlKFwiaHR0cHM6Ly9taW5pY3JhZnQuZmlyZWJhc2Vpby5jb21cIik7XG5cbmZ1bmN0aW9uIGNyZWF0ZShuYW1lKSB7XG4gIHZhciByZWYsIGRhdGEsIGxvYWRlZDtcbiAgIFxuICByZWYgPSByZWZlcmVuY2UobmFtZSk7XG4gIGRhdGEgPSB7fTtcbiAgbG9hZGVkID0gZmFsc2U7XG4gIFxuICAvKnJlZi5vbigndmFsdWUnLCBmdW5jdGlvbihzbmFwKSB7XG4gICAgLy8gc3RvcCB0aGUgcmVmZXJlbmNlIGZyb20gYmVpbmcgb3ZlcndyaXR0ZW5cbiAgICBpZighbG9hZGVkICYmIHNuYXAudmFsKCkpIHtcbiAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmxvZygnY2hhbmdlJywgbmFtZSk7XG4gICAgICBkYXRhID0gc25hcC52YWwoKTtcbiAgICB9XG4gIH0pOyovXG5cbiAgcmVmLm9uKCdjaGlsZF9hZGRlZCcsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICBkYXRhW3NuYXAubmFtZSgpXSA9IHNuYXAudmFsKCk7IFxuICB9KTtcblxuICByZWYub24oJ2NoaWxkX3JlbW92ZWQnLCBmdW5jdGlvbihzbmFwKSB7XG4gICAgZGVsZXRlIGRhdGFbc25hcC5uYW1lKCldO1xuICB9KTtcblxuICByZWYub24oJ2NoaWxkX2NoYW5nZWQnLCBmdW5jdGlvbihzbmFwKSB7XG4gICAgZGF0YVtzbmFwLm5hbWUoKV0gPSBzbmFwLnZhbCgpO1xuICB9KTtcbiAgXG4gIHJldHVybiBkYXRhO1xufVxuXG5mdW5jdGlvbiByZWZlcmVuY2UobmFtZSkge1xuICByZXR1cm4gZmlyZWJhc2UuY2hpbGQobmFtZSk7XG59XG5cbmZ1bmN0aW9uIGNoaWxkKG5hbWUpIHtcbiAgdmFyIHJlZjtcbiAgcmVmID0gZmlyZWJhc2UuY2hpbGQobmFtZSk7XG4gIHJldHVybiByZWYucHVzaCgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlOiBjcmVhdGUsXG4gIGNoaWxkOiBjaGlsZCxcbiAgcmVmZXJlbmNlOiByZWZlcmVuY2Vcbn07XG4iLCJ2YXIgZmlyZWJhc2UgPSByZXF1aXJlKCcuL2ZpcmViYXNlJyksXG4gICAgcmVuZGVyID0gcmVxdWlyZSgnLi9yZW5kZXInKSgnZ2FtZS1jYW52YXMnKSxcbiAgICBjb250cm9scyA9IHJlcXVpcmUoJy4vY29udHJvbHMnKSxcbiAgICBjYW1lcmEgPSByZXF1aXJlKCcuL2NhbWVyYScpLFxuICAgIHVpID0gcmVxdWlyZSgnLi9pbnRlcmZhY2UnKTtcblxudmFyIHBsYXllcnMsIGJsb2NrcywgcGxheWVyLCBwbGF5ZXJSZWYsIFxuYWN0aW9uQ29vbERvd24sIG1lc3NhZ2VUaW1lb3V0O1xuXG5hY3Rpb25Db29sRG93biA9IDA7XG5cbnBsYXllciA9IHtcbiAgeDogMTAgKiAzMixcbiAgeTogMTAgKiAzMixcbiAgYWRtaW46IHRydWUsXG4gIHNwcml0ZTogJ3BsYXllcicgXG59O1xuXG5jYW1lcmEuZm9sbG93KHBsYXllcik7XG5cbi8vIGNyZWF0ZSBhIG5ldyBwbGF5ZXIgZm9yIHRoaXMgdXNlclxucGxheWVyUmVmID0gZmlyZWJhc2UuY2hpbGQoJ3BsYXllcnMnKTtcbnBsYXllclJlZi5zZXQocGxheWVyKTtcbnBsYXllclJlZi5vbkRpc2Nvbm5lY3QoKS5yZW1vdmUoKTtcblxuLy8gY3JlYXRlIGEgcmVmZXJlbmNlIHRvIGJsb2Nrc1xuYmxvY2tzID0gZmlyZWJhc2UuY3JlYXRlKCdibG9ja3MnKTtcbnJlbmRlci5iaW5kRW50aXR5KGJsb2Nrcyk7XG5cbi8vIGNyZWF0ZSBhIHJlZmVyZW5jZSB0byBwbGF5ZXJzXG5wbGF5ZXJzID0gZmlyZWJhc2UuY3JlYXRlKCdwbGF5ZXJzJyk7XG5yZW5kZXIuYmluZEVudGl0eShwbGF5ZXJzKTtcblxuLy8gd2hlbiB0aGUgZG9jdW1lbnQgaGFzIGxvYWRlZFxucmVuZGVyLm9uKCdyZWFkeScsIGZ1bmN0aW9uKCkge1xuICAvLyBleHBvc2Ugc29tZSBleHRlcm5hbHMgdG8gVUlcbiAgdWkoe1xuICAgIG1lc3NhZ2U6IG1lc3NhZ2VcbiAgfSk7XG4gIFxuICByZW5kZXIoKTsgIFxufSk7XG5cbi8vIHVwZGF0ZVxucmVuZGVyLm9uKCdmcmFtZScsIGZ1bmN0aW9uKCkge1xuICAvLyBjaGVjayBjb250cm9sIHN0YXRlcyBhbmQgdXBkYXRlIHBsYXllclxuICB2YXIgc3RlcCwgbmVlZHNVcGRhdGUsIGJsb2NrUmVmO1xuXG4gIHN0ZXAgPSA0O1xuICBuZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICBcbiAgaWYoYWN0aW9uQ29vbERvd24pIHtcbiAgICBhY3Rpb25Db29sRG93biAtPSAxO1xuICB9ICBcbiBcbiAgaWYoY29udHJvbHMuYSkge1xuICAgIGlmKHBsYXllci54IC0gc3RlcCA+PSAwKSB7XG4gICAgICBwbGF5ZXIueCAtPSBzdGVwO1xuICAgICAgbmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIH1cbiAgfSBlbHNlIGlmKGNvbnRyb2xzLmQpIHtcbiAgICBwbGF5ZXIueCArPSBzdGVwO1xuICAgIG5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIGlmKGNvbnRyb2xzLncpIHtcbiAgICBpZihwbGF5ZXIueSAtIHN0ZXAgPj0gMCkge1xuICAgICAgcGxheWVyLnkgLT0gc3RlcDtcbiAgICB9XG4gICAgbmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9IGVsc2UgaWYoY29udHJvbHMucykge1xuICAgIHBsYXllci55ICs9IHN0ZXA7XG4gICAgbmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgaWYoY29udHJvbHMuZW50ZXIgJiYgIWFjdGlvbkNvb2xEb3duKSB7XG4gICAgYmxvY2tSZWYgPSBmaXJlYmFzZS5jaGlsZCgnYmxvY2tzJyk7XG4gICAgYmxvY2tSZWYuc2V0KHtcbiAgICAgIHR5cGU6IDAsXG4gICAgICBzcHJpdGU6ICdzdG9uZScsXG4gICAgICB4OiBwbGF5ZXIueCAtIHBsYXllci54ICUgMzIsXG4gICAgICB5OiBwbGF5ZXIueSAtIHBsYXllci55ICUgMzJcbiAgICB9KTtcbiAgICBhY3Rpb25Db29sRG93biA9IDU7XG4gIH1cblxuICBpZihuZWVkc1VwZGF0ZSkge1xuICAgIHBsYXllclJlZi5zZXQocGxheWVyKTtcbiAgfVxufSk7XG5cblxuXG5mdW5jdGlvbiBtZXNzYWdlKHRleHQpIHtcbiAgY2xlYXJUaW1lb3V0KG1lc3NhZ2VUaW1lb3V0KTtcbiAgcGxheWVyLm1lc3NhZ2UgPSB0ZXh0O1xuICBwbGF5ZXJSZWYuc2V0KHBsYXllcik7XG5cbiAgbWVzc2FnZVRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGRlbGV0ZSBwbGF5ZXIubWVzc2FnZTtcbiAgICBwbGF5ZXJSZWYuc2V0KHBsYXllcik7XG4gIH0sIDUwMDApO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihleHRlcm5hbHMpIHtcbiAgLy8gc2hvdWxkIG9ubHkgYmUgY2FsbGVkIHdoZW4gRE9NIGlzIHJlYWR5XG4gIHZhciBtZXNzYWdlSW5wdXQsIHNlbmRCdXR0b247XG4gICAgXG4gIG1lc3NhZ2VJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZXNzYWdlJyk7XG4gIHNlbmRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VuZCcpO1xuXG4gIG1lc3NhZ2VJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uKGUpIHtcbiAgICBzd2l0Y2goZS5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDEzOlxuICAgICAgICBleHRlcm5hbHMubWVzc2FnZShtZXNzYWdlSW5wdXQudmFsdWUpO1xuICAgICAgICBtZXNzYWdlSW5wdXQudmFsdWUgPSAnJzsgXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA4NTpcbiAgICAgICAgbWVzc2FnZUlucHV0LmZvY3VzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfSk7XG5cbn07XG4iLCJ2YXIgc3ByaXRlID0gcmVxdWlyZSgnLi9zcHJpdGUnKSxcbiAgICBzb3J0ID0gcmVxdWlyZSgnLi9zb3J0Jyk7XG4gICAgY2FtZXJhID0gcmVxdWlyZSgnLi9jYW1lcmEnKTtcbiAgXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNhbnZhc0lkKSB7XG4gIHZhciBjYW52YXMsIGN0eCwgZXZlbnRzLCBlbnRpdGllcywgc3ByaXRlcywgaGVpZ2h0LCB3aWR0aDtcbiAgXG4gIGV2ZW50cyA9IHt9O1xuICBlbnRpdGllcyA9IFtdO1xuICBcbiAgc3ByaXRlcyA9IHtcbiAgICBwbGF5ZXI6IHNwcml0ZSgncGxheWVyLnBuZycsIDMyLCAzMiksXG4gICAgc3RvbmU6IHNwcml0ZSgnc3RvbmUucG5nJywgMzIsIDQ4KVxuICB9O1xuICBcbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXNJZCk7XG4gICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgY3R4LmZvbnQgPSAnMThwdCBDYWxpYnJpJztcbiAgXG4gICAgLy8gcmVzaXplIGNhbnZhcyB0byBmaXQgc2NyZWVuXG4gICAgcmVzaXplKCk7XG4gICAgXG4gICAgLy8gdHJpZ2dlciBvdXIgcmVhZHkgZXZlbnRzXG4gICAgcmVuZGVyLnRyaWdnZXIoJ3JlYWR5Jyk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNpemUoKSB7XG4gICAgd2lkdGggPSBjYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICBoZWlnaHQgPSBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHNldFRpbWVvdXQocmVuZGVyLCA1MCk7XG4gICAgLy9yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICByZW5kZXIudHJpZ2dlcignZnJhbWUnKTtcbiAgICBcbiAgICBjdHguZmlsbFN0eWxlID0gJ2dyZWVuJztcbiAgICBjdHguZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gICAgICAgXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGVudGl0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICByZW5kZXJFbnRpdHlMaXN0KGVudGl0aWVzW2ldKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJFbnRpdHlMaXN0KGVudGl0eUxpc3QpIHtcbiAgICAvLyBzb3J0IGVudGl0aWVzIGludG8gYXNjZW5kaW5nIHkgb3JkZXJcbiAgICBlbnRpdHlMaXN0ID0gc29ydChlbnRpdHlMaXN0LCAneScpO1xuICAgIGZvcih2YXIgaWQgaW4gZW50aXR5TGlzdCkge1xuICAgICAgcmVuZGVyRW50aXR5KGVudGl0eUxpc3RbaWRdKTtcbiAgICB9XG4gIH1cblxuICAgIFxuICBmdW5jdGlvbiByZW5kZXJFbnRpdHkoZW50aXR5KSB7XG4gICAgdmFyIG9mZnNldFgsIG9mZnNldFksIHNwcml0ZSwgbWlkWCwgbWlkWSwgbXNnO1xuXG4gICAgc3ByaXRlID0gc3ByaXRlc1tlbnRpdHkuc3ByaXRlXTtcbiAgICBtaWRYID0gd2lkdGggLyAyO1xuICAgIG1pZFkgPSBoZWlnaHQgLyAyOyAgICAgIFxuICAgIG9mZnNldFggPSAzMiAtIHNwcml0ZS53O1xuICAgIG9mZnNldFkgPSAzMiAtIHNwcml0ZS5oO1xuICAgIFxuICAgIGN0eC5zYXZlKCk7XG4gICAgaWYoZW50aXR5Lm1lc3NhZ2UpIHtcbiAgICAgIGNvbnNvbGUuZ3JvdXAoJ0NvbnRleHQnKTtcbiAgICAgIGNvbnNvbGUubG9nKCdUcmFuc2xhdGUnLCBlbnRpdHkueCwgZW50aXR5LnkpO1xuICAgICAgY29uc29sZS5sb2coJ0RyYXcgQXQnLCAyICogbWlkWCAtIGNhbWVyYS54LCAyICogbWlkWSAtIGNhbWVyYS55LFxuICAgICAgICBzcHJpdGUudyAqIDIsIHNwcml0ZS5oICogMlxuICAgICAgKVxuICAgICAgY29uc29sZS5ncm91cEVuZCgnQ29udGV4dCcpO1xuICAgIH1cbiAgICBjdHgudHJhbnNsYXRlKGVudGl0eS54ICogMiwgZW50aXR5LnkgKiAyKTtcbiAgICBjdHguZHJhd0ltYWdlKHNwcml0ZSwgXG4gICAgICBtaWRYIC0gY2FtZXJhLnggKiAyLCBcbiAgICAgIG1pZFkgLSBjYW1lcmEueSAqIDIsXG4gICAgICBzcHJpdGUudyAqIDIsXG4gICAgICBzcHJpdGUuaCAqIDIpO1xuICAgICBcbiAgICBpZihtc2cgPSBlbnRpdHkubWVzc2FnZSkge1xuICAgICAgcmVuZGVyTWVzc2FnZShlbnRpdHksIGVudGl0eS5tZXNzYWdlLCBcbiAgICAgICAgbWlkWCAtIGNhbWVyYS54ICogMiArIHNwcml0ZS53LFxuICAgICAgICBtaWRZIC0gY2FtZXJhLnkgKiAyKTsgXG4gICAgfVxuXG4gICAgY3R4LnJlc3RvcmUoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlck1lc3NhZ2UoZW50aXR5LCBzdHJpbmcsIHgsIHkpe1xuICAgIHZhciB0ZXh0V2lkdGgsIHBhZCwgaGFsZndheTtcbiAgICBjdHguZm9udCA9ICc4cHQgYXJpYWwnO1xuICAgIGlmKGVudGl0eS5hZG1pbikge1xuICAgICAgc3RyaW5nID0gJ+KZmycgKyBzdHJpbmc7XG4gICAgfVxuXG4gICAgcGFkID0gNDtcbiAgICB0ZXh0V2lkdGggPSBjdHgubWVhc3VyZVRleHQoc3RyaW5nKS53aWR0aDtcbiAgICBoYWxmd2F5ID0gdGV4dFdpZHRoIC8gMjsgICAgXG5cbiAgICBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwwLDAsMC42KSc7XG4gICAgY3R4LmZpbGxSZWN0KHggLSBwYWQgLyAyIC0gaGFsZndheSwgeSAtIDIwLCB0ZXh0V2lkdGggKyBwYWQsIDE0KTtcbiAgICBcbiAgICBpZihlbnRpdHkuYWRtaW4pIHtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnI2ZmYWEwMCc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSAnI2ZmZic7XG4gICAgfVxuICAgIGN0eC5maWxsVGV4dChzdHJpbmcsIHggLSBoYWxmd2F5LCB5IC0gMTApO1xuICB9XG4gXG4gIHJlbmRlci5iaW5kRW50aXR5ID0gZnVuY3Rpb24oZW50aXR5KSB7XG4gICAgZW50aXRpZXMucHVzaChlbnRpdHkpO1xuICB9XG5cbiAgcmVuZGVyLm9uID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICBpZighZXZlbnRzW25hbWVdKSBldmVudHNbbmFtZV0gPSBbXTtcbiAgICBldmVudHNbbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICByZW5kZXIudHJpZ2dlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBpZighZXZlbnRzW25hbWVdKSByZXR1cm47XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGV2ZW50c1tuYW1lXS5sZW5ndGg7IGkrKykge1xuICAgICAgZXZlbnRzW25hbWVdW2ldLmFwcGx5KHJlbmRlciwgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGluaXQpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgcmVzaXplKTtcblxuICByZXR1cm4gcmVuZGVyO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc29ydChsaXN0LCBvbikge1xuICB2YXIgdmFsLCBvcmRlcmVkLCBzb3J0ZWQ7XG4gIHNvcnRlZCA9IFtdO1xuICBvcmRlcmVkID0gW107XG5cbiAgZm9yKHZhciBpZCBpbiBsaXN0KSB7XG4gICAgdmFsID0gbGlzdFtpZF1bb25dO1xuXG4gICAgd2hpbGUodHlwZW9mIG9yZGVyZWRbdmFsXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHZhbCsrO1xuICAgIH1cblxuICAgIGlmKG9yZGVyZWRbdmFsXSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBvcmRlcmVkW3ZhbF0ucHVzaChsaXN0W2lkXSlcbiAgICB9IGVsc2Uge1xuICAgICAgb3JkZXJlZFt2YWxdID0gW2xpc3RbaWRdXTtcbiAgICB9XG4gIH1cblxuICBmb3IodmFyIGkgPSAwOyBpIDwgb3JkZXJlZC5sZW5ndGg7IGkrKykge1xuICAgIGlmKG9yZGVyZWRbaV0pIHtcbiAgICAgIHNvcnRlZCA9IHNvcnRlZC5jb25jYXQob3JkZXJlZFtpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHNvcnRlZDtcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1cmwsIHdpZHRoLCBoZWlnaHQpIHtcbiAgdmFyIGltYWdlO1xuICBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICBpbWFnZS5zcmMgPSAnaW1nLycgKyB1cmw7XG4gIGltYWdlLmggPSBoZWlnaHQ7XG4gIGltYWdlLncgPSB3aWR0aDsgXG4gIHJldHVybiBpbWFnZTtcbn07XG4iXX0=

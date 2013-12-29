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

},{"./camera":1,"./controls":2,"./firebase":3,"./render":5}],5:[function(require,module,exports){
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
    var offsetX, offsetY, sprite;
    sprite = sprites[entity.sprite];
      
    offsetX = 32 - sprite.w;
    offsetY = 32 - sprite.h;

    ctx.save();
    ctx.translate(entity.x, entity.y);
    ctx.drawImage(sprites[entity.sprite], 
      width / 2 - camera.x, 
      height / 2 - camera.y);
    ctx.restore();
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

},{"./camera":1,"./sort":6,"./sprite":7}],6:[function(require,module,exports){
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


},{}],7:[function(require,module,exports){
module.exports = function(url, width, height) {
  var image;
  image = new Image();
  image.src = 'img/' + url;
  image.h = height;
  image.w = width; 
  return image;
};

},{}]},{},[1,2,3,4,5,6,7])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvY2FtZXJhLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2NvbnRyb2xzLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2ZpcmViYXNlLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL2dhbWUuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvcmVuZGVyLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL3NvcnQuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvc3ByaXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0ge1xuICBfeDogMCxcbiAgX3k6IDAsXG4gIGZvbGxvd2luZzogZmFsc2UsXG4gIGVudGl0eTogbnVsbCxcblxuICBmb2xsb3c6IGZ1bmN0aW9uKGVudGl0eSkge1xuICAgIHRoaXMuZm9sbG93aW5nID0gdHJ1ZTtcbiAgICB0aGlzLmVudGl0eSA9IGVudGl0eTtcbiAgfSxcblxuICBnZXQgeCgpIHtcbiAgICByZXR1cm4gdGhpcy5mb2xsb3dpbmcgPyB0aGlzLmVudGl0eS54IDogdGhpcy5feDtcbiAgfSxcblxuICBnZXQgeSgpIHtcbiAgICByZXR1cm4gdGhpcy5mb2xsb3dpbmcgPyB0aGlzLmVudGl0eS55IDogdGhpcy5feTsgXG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHN0YXRlcywga2V5TWFwOyAgXG4gIFxuICBzdGF0ZXMgPSB7fTtcbiAga2V5TWFwID0ge1xuICAgIDM3OiAnbGVmdCcsXG4gICAgMzg6ICd1cCcsXG4gICAgMzk6ICdyaWdodCcsXG4gICAgNDA6ICdkb3duJyxcbiAgICAzMjogJ3NwYWNlJyxcbiAgICAxMzogJ2VudGVyJyxcbiAgICA5OiAndGFiJ1xuICB9O1xuXG4gIGZ1bmN0aW9uIGNoYW5nZVN0YXRlKHN0YXRlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBtYXBwZWQ7XG4gICAgICBtYXBwZWQgPSBrZXlNYXBbZS5rZXlDb2RlXSB8fCBTdHJpbmcuZnJvbUNoYXJDb2RlKGUua2V5Q29kZSk7XG4gICAgICBzdGF0ZXNbbWFwcGVkXSA9IHN0YXRlO1xuICAgIH1cbiAgfVxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGNoYW5nZVN0YXRlKHRydWUpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgY2hhbmdlU3RhdGUoZmFsc2UpKTtcbiAgXG4gIHJldHVybiBzdGF0ZXM7XG59KSgpO1xuIiwidmFyIGZpcmViYXNlID0gbmV3IEZpcmViYXNlKFwiaHR0cHM6Ly9taW5pY3JhZnQuZmlyZWJhc2Vpby5jb21cIik7XG5cbmZ1bmN0aW9uIGNyZWF0ZShuYW1lKSB7XG4gIHZhciByZWYsIGRhdGEsIGxvYWRlZDtcbiAgIFxuICByZWYgPSByZWZlcmVuY2UobmFtZSk7XG4gIGRhdGEgPSB7fTtcbiAgbG9hZGVkID0gZmFsc2U7XG4gIFxuICAvKnJlZi5vbigndmFsdWUnLCBmdW5jdGlvbihzbmFwKSB7XG4gICAgLy8gc3RvcCB0aGUgcmVmZXJlbmNlIGZyb20gYmVpbmcgb3ZlcndyaXR0ZW5cbiAgICBpZighbG9hZGVkICYmIHNuYXAudmFsKCkpIHtcbiAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmxvZygnY2hhbmdlJywgbmFtZSk7XG4gICAgICBkYXRhID0gc25hcC52YWwoKTtcbiAgICB9XG4gIH0pOyovXG5cbiAgcmVmLm9uKCdjaGlsZF9hZGRlZCcsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICBkYXRhW3NuYXAubmFtZSgpXSA9IHNuYXAudmFsKCk7IFxuICB9KTtcblxuICByZWYub24oJ2NoaWxkX3JlbW92ZWQnLCBmdW5jdGlvbihzbmFwKSB7XG4gICAgZGVsZXRlIGRhdGFbc25hcC5uYW1lKCldO1xuICB9KTtcblxuICByZWYub24oJ2NoaWxkX2NoYW5nZWQnLCBmdW5jdGlvbihzbmFwKSB7XG4gICAgZGF0YVtzbmFwLm5hbWUoKV0gPSBzbmFwLnZhbCgpO1xuICB9KTtcbiAgXG4gIHJldHVybiBkYXRhO1xufVxuXG5mdW5jdGlvbiByZWZlcmVuY2UobmFtZSkge1xuICByZXR1cm4gZmlyZWJhc2UuY2hpbGQobmFtZSk7XG59XG5cbmZ1bmN0aW9uIGNoaWxkKG5hbWUpIHtcbiAgdmFyIHJlZjtcbiAgcmVmID0gZmlyZWJhc2UuY2hpbGQobmFtZSk7XG4gIHJldHVybiByZWYucHVzaCgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlOiBjcmVhdGUsXG4gIGNoaWxkOiBjaGlsZCxcbiAgcmVmZXJlbmNlOiByZWZlcmVuY2Vcbn07XG4iLCJ2YXIgZmlyZWJhc2UgPSByZXF1aXJlKCcuL2ZpcmViYXNlJyksXG4gICAgcmVuZGVyID0gcmVxdWlyZSgnLi9yZW5kZXInKSgnZ2FtZS1jYW52YXMnKSxcbiAgICBjb250cm9scyA9IHJlcXVpcmUoJy4vY29udHJvbHMnKSxcbiAgICBjYW1lcmEgPSByZXF1aXJlKCcuL2NhbWVyYScpO1xuXG52YXIgcGxheWVycywgYmxvY2tzLCBwbGF5ZXIsIHBsYXllclJlZiwgYWN0aW9uQ29vbERvd247XG5cbmFjdGlvbkNvb2xEb3duID0gMDtcblxucGxheWVyID0ge1xuICB4OiAwLFxuICB5OiAwLFxuICBzcHJpdGU6ICdwbGF5ZXInIFxufTtcblxuY29uc29sZS5sb2coY2FtZXJhKTtcbmNhbWVyYS5mb2xsb3cocGxheWVyKTtcblxuLy8gY3JlYXRlIGEgbmV3IHBsYXllciBmb3IgdGhpcyB1c2VyXG5wbGF5ZXJSZWYgPSBmaXJlYmFzZS5jaGlsZCgncGxheWVycycpO1xucGxheWVyUmVmLnNldChwbGF5ZXIpO1xucGxheWVyUmVmLm9uRGlzY29ubmVjdCgpLnJlbW92ZSgpO1xuXG4vLyBjcmVhdGUgYSByZWZlcmVuY2UgdG8gYmxvY2tzXG5ibG9ja3MgPSBmaXJlYmFzZS5jcmVhdGUoJ2Jsb2NrcycpO1xucmVuZGVyLmJpbmRFbnRpdHkoYmxvY2tzKTtcblxuLy8gY3JlYXRlIGEgcmVmZXJlbmNlIHRvIHBsYXllcnNcbnBsYXllcnMgPSBmaXJlYmFzZS5jcmVhdGUoJ3BsYXllcnMnKTtcbnJlbmRlci5iaW5kRW50aXR5KHBsYXllcnMpO1xuXG4vLyB3aGVuIHRoZSBkb2N1bWVudCBoYXMgbG9hZGVkXG5yZW5kZXIub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gIHJlbmRlcigpOyAgXG59KTtcblxuLy8gdXBkYXRlXG5yZW5kZXIub24oJ2ZyYW1lJywgZnVuY3Rpb24oKSB7XG4gIC8vIGNoZWNrIGNvbnRyb2wgc3RhdGVzIGFuZCB1cGRhdGUgcGxheWVyXG4gIHZhciBzdGVwLCBuZWVkc1VwZGF0ZSwgYmxvY2tSZWY7XG5cbiAgc3RlcCA9IDQ7XG4gIG5lZWRzVXBkYXRlID0gZmFsc2U7XG4gIFxuICBpZihhY3Rpb25Db29sRG93bikge1xuICAgIGFjdGlvbkNvb2xEb3duIC09IDE7XG4gIH0gIFxuIFxuICBpZihjb250cm9scy5sZWZ0KSB7XG4gICAgcGxheWVyLnggLT0gc3RlcDtcbiAgICBuZWVkc1VwZGF0ZSA9IHRydWU7XG4gIH0gZWxzZSBpZihjb250cm9scy5yaWdodCkge1xuICAgIHBsYXllci54ICs9IHN0ZXA7XG4gICAgbmVlZHNVcGRhdGUgPSB0cnVlO1xuICB9XG5cbiAgaWYoY29udHJvbHMudXApIHtcbiAgICBwbGF5ZXIueSAtPSBzdGVwO1xuICAgIG5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfSBlbHNlIGlmKGNvbnRyb2xzLmRvd24pIHtcbiAgICBwbGF5ZXIueSArPSBzdGVwO1xuICAgIG5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgfVxuXG4gIGlmKGNvbnRyb2xzLnNwYWNlICYmICFhY3Rpb25Db29sRG93bikge1xuICAgIGJsb2NrUmVmID0gZmlyZWJhc2UuY2hpbGQoJ2Jsb2NrcycpO1xuICAgIGJsb2NrUmVmLnNldCh7XG4gICAgICB0eXBlOiAwLFxuICAgICAgc3ByaXRlOiAnc3RvbmUnLFxuICAgICAgeDogcGxheWVyLnggLSBwbGF5ZXIueCAlIDMyLFxuICAgICAgeTogcGxheWVyLnkgLSBwbGF5ZXIueSAlIDMyXG4gICAgfSk7XG4gICAgYWN0aW9uQ29vbERvd24gPSA1O1xuICB9XG5cbiAgaWYobmVlZHNVcGRhdGUpIHtcbiAgICBwbGF5ZXJSZWYuc2V0KHBsYXllcik7XG4gIH1cbn0pO1xuIiwidmFyIHNwcml0ZSA9IHJlcXVpcmUoJy4vc3ByaXRlJyksXG4gICAgc29ydCA9IHJlcXVpcmUoJy4vc29ydCcpO1xuICAgIGNhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhJyk7XG4gIFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjYW52YXNJZCkge1xuICB2YXIgY2FudmFzLCBjdHgsIGV2ZW50cywgZW50aXRpZXMsIHNwcml0ZXMsIGhlaWdodCwgd2lkdGg7XG4gIFxuICBldmVudHMgPSB7fTtcbiAgZW50aXRpZXMgPSBbXTtcbiAgXG4gIHNwcml0ZXMgPSB7XG4gICAgcGxheWVyOiBzcHJpdGUoJ3BsYXllci5wbmcnLCAzMiwgMzIpLFxuICAgIHN0b25lOiBzcHJpdGUoJ3N0b25lLnBuZycsIDMyLCA0OClcbiAgfTtcbiAgXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2FudmFzSWQpO1xuICAgIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIFxuICAgIC8vIHJlc2l6ZSBjYW52YXMgdG8gZml0IHNjcmVlblxuICAgIHJlc2l6ZSgpO1xuICAgIFxuICAgIC8vIHRyaWdnZXIgb3VyIHJlYWR5IGV2ZW50c1xuICAgIHJlbmRlci50cmlnZ2VyKCdyZWFkeScpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzaXplKCkge1xuICAgIHdpZHRoID0gY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgaGVpZ2h0ID0gY2FudmFzLmhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICBzZXRUaW1lb3V0KHJlbmRlciwgNTApO1xuICAgIC8vcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgcmVuZGVyLnRyaWdnZXIoJ2ZyYW1lJyk7XG4gICAgXG4gICAgY3R4LmZpbGxTdHlsZSA9ICdncmVlbic7XG4gICAgY3R4LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICAgIFxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBlbnRpdGllcy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVuZGVyRW50aXR5TGlzdChlbnRpdGllc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyRW50aXR5TGlzdChlbnRpdHlMaXN0KSB7XG4gICAgLy8gc29ydCBlbnRpdGllcyBpbnRvIGFzY2VuZGluZyB5IG9yZGVyXG4gICAgZW50aXR5TGlzdCA9IHNvcnQoZW50aXR5TGlzdCwgJ3knKTtcbiAgICBmb3IodmFyIGlkIGluIGVudGl0eUxpc3QpIHtcbiAgICAgIHJlbmRlckVudGl0eShlbnRpdHlMaXN0W2lkXSk7XG4gICAgfVxuICB9XG5cbiAgICBcbiAgZnVuY3Rpb24gcmVuZGVyRW50aXR5KGVudGl0eSkge1xuICAgIHZhciBvZmZzZXRYLCBvZmZzZXRZLCBzcHJpdGU7XG4gICAgc3ByaXRlID0gc3ByaXRlc1tlbnRpdHkuc3ByaXRlXTtcbiAgICAgIFxuICAgIG9mZnNldFggPSAzMiAtIHNwcml0ZS53O1xuICAgIG9mZnNldFkgPSAzMiAtIHNwcml0ZS5oO1xuXG4gICAgY3R4LnNhdmUoKTtcbiAgICBjdHgudHJhbnNsYXRlKGVudGl0eS54LCBlbnRpdHkueSk7XG4gICAgY3R4LmRyYXdJbWFnZShzcHJpdGVzW2VudGl0eS5zcHJpdGVdLCBcbiAgICAgIHdpZHRoIC8gMiAtIGNhbWVyYS54LCBcbiAgICAgIGhlaWdodCAvIDIgLSBjYW1lcmEueSk7XG4gICAgY3R4LnJlc3RvcmUoKTtcbiAgfVxuIFxuICByZW5kZXIuYmluZEVudGl0eSA9IGZ1bmN0aW9uKGVudGl0eSkge1xuICAgIGVudGl0aWVzLnB1c2goZW50aXR5KTtcbiAgfVxuXG4gIHJlbmRlci5vbiA9IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYoIWV2ZW50c1tuYW1lXSkgZXZlbnRzW25hbWVdID0gW107XG4gICAgZXZlbnRzW25hbWVdLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgcmVuZGVyLnRyaWdnZXIgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgaWYoIWV2ZW50c1tuYW1lXSkgcmV0dXJuO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBldmVudHNbbmFtZV0ubGVuZ3RoOyBpKyspIHtcbiAgICAgIGV2ZW50c1tuYW1lXVtpXS5hcHBseShyZW5kZXIsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBpbml0KTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZSk7XG5cbiAgcmV0dXJuIHJlbmRlcjtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHNvcnQobGlzdCwgb24pIHtcbiAgdmFyIHZhbCwgb3JkZXJlZCwgc29ydGVkO1xuICBzb3J0ZWQgPSBbXTtcbiAgb3JkZXJlZCA9IFtdO1xuXG4gIGZvcih2YXIgaWQgaW4gbGlzdCkge1xuICAgIHZhbCA9IGxpc3RbaWRdW29uXTtcblxuICAgIHdoaWxlKHR5cGVvZiBvcmRlcmVkW3ZhbF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICB2YWwrKztcbiAgICB9XG5cbiAgICBpZihvcmRlcmVkW3ZhbF0gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgb3JkZXJlZFt2YWxdLnB1c2gobGlzdFtpZF0pXG4gICAgfSBlbHNlIHtcbiAgICAgIG9yZGVyZWRbdmFsXSA9IFtsaXN0W2lkXV07XG4gICAgfVxuICB9XG5cbiAgZm9yKHZhciBpID0gMDsgaSA8IG9yZGVyZWQubGVuZ3RoOyBpKyspIHtcbiAgICBpZihvcmRlcmVkW2ldKSB7XG4gICAgICBzb3J0ZWQgPSBzb3J0ZWQuY29uY2F0KG9yZGVyZWRbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBzb3J0ZWQ7XG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odXJsLCB3aWR0aCwgaGVpZ2h0KSB7XG4gIHZhciBpbWFnZTtcbiAgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgaW1hZ2Uuc3JjID0gJ2ltZy8nICsgdXJsO1xuICBpbWFnZS5oID0gaGVpZ2h0O1xuICBpbWFnZS53ID0gd2lkdGg7IFxuICByZXR1cm4gaW1hZ2U7XG59O1xuIl19

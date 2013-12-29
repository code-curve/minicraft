(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = (function() {
  var states, keyMap;  
  
  states = {};
  keyMap = {
    37: 'left',
    38: 'up',
    39: 'right',
    30: 'down',
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

  document.addEventListener('keydown', changeState(true));
  document.addEventListener('keyup', changeState(false));
  
  return states;
});

},{}],2:[function(require,module,exports){
var firebase = new Firebase("https://minicraft.firebaseio.com");

function create(name) {
  var ref, data, loaded;
   
  ref = reference(name);
  data = {};
  loaded = false;
  
  ref.on('value', function(snap) {
    // stop the reference from being overwritten
    if(!loaded && snap.val()) {
      loaded = true;
      data = snap.val();
    }
  })

  ref.on('child_added', function(snap) {
    data[snap.name()] = snap.val(); 
  })

  ref.on('child_removed', function(snap) {
    delete data[snap.name()];
  })

  ref.on('child_changed', function(snap) {
    data[snap.name()] = snap.val();
  })
    
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

},{}],3:[function(require,module,exports){
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

},{"./controls":1,"./firebase":2,"./render":5}],4:[function(require,module,exports){
module.exports = function() {
  return {
    x: 0,
    y: 0
  }
};

},{}],5:[function(require,module,exports){
var sprite = require('./sprite');

module.exports = function(canvasId) {
  var canvas, ctx, events, entities, sprites, height, width;
  
  events = {};
  entities = [];
  
  sprites = {
    player: sprite('player.png')
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
    requestAnimationFrame(render, 1000);
    //render.trigger('frame');
    ctx.fillStyle = 'green';
    ctx.fillRect(0, 0, width, height);
     
    for(var i = 0; i < entities.length; i++) {
      renderEntityList(entities[i]);
    }
  }

  function renderEntityList(entityList) {
    console.log(entityList);
    for(var id in entityList) { 
      renderEntity(entityList[id]);
    }
  }
  
  function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.x);
    ctx.translate(entity.y); 
    ctx.drawImage(sprites[entity.spriteId], 0, 0);
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

},{"./sprite":6}],6:[function(require,module,exports){
module.exports = function(url) {
  var image;
  image = new Image();
  image.src = 'img/' + url;
  return image;
};

},{}]},{},[1,2,3,4,5,6])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvY29udHJvbHMuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvZmlyZWJhc2UuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvZ2FtZS5qcyIsIi9ob21lL2Rhbi9kZXYvbWluaWNyYWZ0L3NyYy9wbGF5ZXIuanMiLCIvaG9tZS9kYW4vZGV2L21pbmljcmFmdC9zcmMvcmVuZGVyLmpzIiwiL2hvbWUvZGFuL2Rldi9taW5pY3JhZnQvc3JjL3Nwcml0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBzdGF0ZXMsIGtleU1hcDsgIFxuICBcbiAgc3RhdGVzID0ge307XG4gIGtleU1hcCA9IHtcbiAgICAzNzogJ2xlZnQnLFxuICAgIDM4OiAndXAnLFxuICAgIDM5OiAncmlnaHQnLFxuICAgIDMwOiAnZG93bicsXG4gICAgMzI6ICdzcGFjZScsXG4gICAgMTM6ICdlbnRlcicsXG4gICAgOTogJ3RhYidcbiAgfTtcblxuICBmdW5jdGlvbiBjaGFuZ2VTdGF0ZShzdGF0ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgbWFwcGVkO1xuICAgICAgbWFwcGVkID0ga2V5TWFwW2Uua2V5Q29kZV0gfHwgU3RyaW5nLmZyb21DaGFyQ29kZShlLmtleUNvZGUpO1xuICAgICAgc3RhdGVzW21hcHBlZF0gPSBzdGF0ZTtcbiAgICB9XG4gIH1cblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgY2hhbmdlU3RhdGUodHJ1ZSkpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGNoYW5nZVN0YXRlKGZhbHNlKSk7XG4gIFxuICByZXR1cm4gc3RhdGVzO1xufSk7XG4iLCJ2YXIgZmlyZWJhc2UgPSBuZXcgRmlyZWJhc2UoXCJodHRwczovL21pbmljcmFmdC5maXJlYmFzZWlvLmNvbVwiKTtcblxuZnVuY3Rpb24gY3JlYXRlKG5hbWUpIHtcbiAgdmFyIHJlZiwgZGF0YSwgbG9hZGVkO1xuICAgXG4gIHJlZiA9IHJlZmVyZW5jZShuYW1lKTtcbiAgZGF0YSA9IHt9O1xuICBsb2FkZWQgPSBmYWxzZTtcbiAgXG4gIHJlZi5vbigndmFsdWUnLCBmdW5jdGlvbihzbmFwKSB7XG4gICAgLy8gc3RvcCB0aGUgcmVmZXJlbmNlIGZyb20gYmVpbmcgb3ZlcndyaXR0ZW5cbiAgICBpZighbG9hZGVkICYmIHNuYXAudmFsKCkpIHtcbiAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICBkYXRhID0gc25hcC52YWwoKTtcbiAgICB9XG4gIH0pXG5cbiAgcmVmLm9uKCdjaGlsZF9hZGRlZCcsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICBkYXRhW3NuYXAubmFtZSgpXSA9IHNuYXAudmFsKCk7IFxuICB9KVxuXG4gIHJlZi5vbignY2hpbGRfcmVtb3ZlZCcsIGZ1bmN0aW9uKHNuYXApIHtcbiAgICBkZWxldGUgZGF0YVtzbmFwLm5hbWUoKV07XG4gIH0pXG5cbiAgcmVmLm9uKCdjaGlsZF9jaGFuZ2VkJywgZnVuY3Rpb24oc25hcCkge1xuICAgIGRhdGFbc25hcC5uYW1lKCldID0gc25hcC52YWwoKTtcbiAgfSlcbiAgICBcbiAgcmV0dXJuIGRhdGE7XG59XG5cbmZ1bmN0aW9uIHJlZmVyZW5jZShuYW1lKSB7XG4gIHJldHVybiBmaXJlYmFzZS5jaGlsZChuYW1lKTtcbn1cblxuZnVuY3Rpb24gY2hpbGQobmFtZSkge1xuICB2YXIgcmVmO1xuICByZWYgPSBmaXJlYmFzZS5jaGlsZChuYW1lKTtcbiAgcmV0dXJuIHJlZi5wdXNoKCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGU6IGNyZWF0ZSxcbiAgY2hpbGQ6IGNoaWxkLFxuICByZWZlcmVuY2U6IHJlZmVyZW5jZVxufTtcbiIsInZhciBmaXJlYmFzZSA9IHJlcXVpcmUoJy4vZmlyZWJhc2UnKTtcbnZhciByZW5kZXIgPSByZXF1aXJlKCcuL3JlbmRlcicpKCdnYW1lLWNhbnZhcycpO1xudmFyIGNvbnRyb2xzID0gcmVxdWlyZSgnLi9jb250cm9scycpO1xuXG52YXIgcGxheWVycywgYmxvY2tzLCBwbGF5ZXIsIHBsYXllclJlZjtcblxucGxheWVyID0ge1xuICB4OiAwLFxuICB5OiAwLFxuICBzcHJpdGU6ICdwbGF5ZXInIFxufTtcblxuLy8gY3JlYXRlIGEgbmV3IHBsYXllciBmb3IgdGhpcyB1c2VyXG5wbGF5ZXJSZWYgPSBmaXJlYmFzZS5jaGlsZCgncGxheWVycycpO1xucGxheWVyUmVmLnNldChwbGF5ZXIpO1xucGxheWVyUmVmLm9uRGlzY29ubmVjdCgpLnJlbW92ZSgpO1xuXG4vLyBjcmVhdGUgYSByZWZlcmVuY2UgdG8gcGxheWVyc1xucGxheWVycyA9IGZpcmViYXNlLmNyZWF0ZSgncGxheWVycycpO1xucmVuZGVyLmJpbmRFbnRpdHkocGxheWVycyk7XG5cbi8vIGNyZWF0ZSBhIHJlZmVyZW5jZSB0byBibG9ja3NcbmJsb2NrcyA9IGZpcmViYXNlLmNyZWF0ZSgnYmxvY2tzJyk7XG5yZW5kZXIuYmluZEVudGl0eShibG9ja3MpO1xuXG4vLyB3aGVuIHRoZSBkb2N1bWVudCBoYXMgbG9hZGVkXG5yZW5kZXIub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XG4gIHJlbmRlcigpOyAgXG59KTtcblxuLy8gdXBkYXRlXG5yZW5kZXIub24oJ2ZyYW1lJywgZnVuY3Rpb24oKSB7XG4gIC8vIGNoZWNrIGNvbnRyb2wgc3RhdGVzIGFuZCB1cGRhdGUgcGxheWVyXG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgeDogMCxcbiAgICB5OiAwXG4gIH1cbn07XG4iLCJ2YXIgc3ByaXRlID0gcmVxdWlyZSgnLi9zcHJpdGUnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjYW52YXNJZCkge1xuICB2YXIgY2FudmFzLCBjdHgsIGV2ZW50cywgZW50aXRpZXMsIHNwcml0ZXMsIGhlaWdodCwgd2lkdGg7XG4gIFxuICBldmVudHMgPSB7fTtcbiAgZW50aXRpZXMgPSBbXTtcbiAgXG4gIHNwcml0ZXMgPSB7XG4gICAgcGxheWVyOiBzcHJpdGUoJ3BsYXllci5wbmcnKVxuICB9O1xuICBcbiAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXNJZCk7XG4gICAgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgXG4gICAgLy8gcmVzaXplIGNhbnZhcyB0byBmaXQgc2NyZWVuXG4gICAgcmVzaXplKCk7XG4gICAgXG4gICAgLy8gdHJpZ2dlciBvdXIgcmVhZHkgZXZlbnRzXG4gICAgcmVuZGVyLnRyaWdnZXIoJ3JlYWR5Jyk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNpemUoKSB7XG4gICAgd2lkdGggPSBjYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICBoZWlnaHQgPSBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIsIDEwMDApO1xuICAgIC8vcmVuZGVyLnRyaWdnZXIoJ2ZyYW1lJyk7XG4gICAgY3R4LmZpbGxTdHlsZSA9ICdncmVlbic7XG4gICAgY3R4LmZpbGxSZWN0KDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuICAgICBcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgZW50aXRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHJlbmRlckVudGl0eUxpc3QoZW50aXRpZXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlckVudGl0eUxpc3QoZW50aXR5TGlzdCkge1xuICAgIGNvbnNvbGUubG9nKGVudGl0eUxpc3QpO1xuICAgIGZvcih2YXIgaWQgaW4gZW50aXR5TGlzdCkgeyBcbiAgICAgIHJlbmRlckVudGl0eShlbnRpdHlMaXN0W2lkXSk7XG4gICAgfVxuICB9XG4gIFxuICBmdW5jdGlvbiByZW5kZXJFbnRpdHkoZW50aXR5KSB7XG4gICAgY3R4LnNhdmUoKTtcbiAgICBjdHgudHJhbnNsYXRlKGVudGl0eS54KTtcbiAgICBjdHgudHJhbnNsYXRlKGVudGl0eS55KTsgXG4gICAgY3R4LmRyYXdJbWFnZShzcHJpdGVzW2VudGl0eS5zcHJpdGVJZF0sIDAsIDApO1xuICAgIGN0eC5yZXN0b3JlKCk7XG4gIH1cbiBcbiAgcmVuZGVyLmJpbmRFbnRpdHkgPSBmdW5jdGlvbihlbnRpdHkpIHtcbiAgICBlbnRpdGllcy5wdXNoKGVudGl0eSk7XG4gIH1cblxuICByZW5kZXIub24gPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xuICAgIGlmKCFldmVudHNbbmFtZV0pIGV2ZW50c1tuYW1lXSA9IFtdO1xuICAgIGV2ZW50c1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHJlbmRlci50cmlnZ2VyID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGlmKCFldmVudHNbbmFtZV0pIHJldHVybjtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgZXZlbnRzW25hbWVdLmxlbmd0aDsgaSsrKSB7XG4gICAgICBldmVudHNbbmFtZV1baV0uYXBwbHkocmVuZGVyLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgaW5pdCk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZXNpemUpO1xuXG4gIHJldHVybiByZW5kZXI7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih1cmwpIHtcbiAgdmFyIGltYWdlO1xuICBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICBpbWFnZS5zcmMgPSAnaW1nLycgKyB1cmw7XG4gIHJldHVybiBpbWFnZTtcbn07XG4iXX0=

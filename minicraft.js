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

var firebase = new Firebase("https://minicraft.firebaseio.com");
var playersRef = firebase.child('players');
var blocksRef = firebase.child('blocks');

function create(name) {
  var ref, data;
  
  ref = firebase.child(name);
  
  ref.on('value', function(snap) {
    data = snap.val();
  });
  
  return data;
}

module.exports = {
  create: create
};

var firebase = require('./firebase');
var render = require('./render');
var controls = require('./controls');

var players, blocks;

players = firebase.create('players');
render.bindEntity(players);

blocks = firebase.create('blocks');
render.bindEntity(blocks);

// when the document has loaded
render.on('ready', function() {
  render.start();  
});

// update
render.on('frame', function() {
    
});



module.exports = function() {
  return {
    x: 0,
    y: 0
  }
};

module.exports = function(canvasId) {
  var canvas, ctx, events, entities;
  
  events = {};
  entities = [];

  function render() {
    requestAnimationFrame(render);
    render.trigger('frame');
    
    for(var i = 0; i < entities.length; i++) {
      renderEntity(entities[i]);
    }
  }

  function renderEntity(entity) {
    if(entity instanceof Array) {
      for(var i = 0; i < entity.length; i++) {
        renderEntity(entity[i]);
      }
    } else {
      
      ctx.save();
      ctx.translate(entity.x);
      ctx.translate(entity.y);
      ctx.drawImage(entity.sprite, 0, 0);
      ctx.restore();
      
    }
  }

  function init() {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext('2d');
    
    // trigger our ready events
    render.trigger('ready');
  }

  function bindEntity(entity) {
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

  document.addEventListener('load', init);
  
  return render;
};


//# sourceMappingURL=minicraft.js.map
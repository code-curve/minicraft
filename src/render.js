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

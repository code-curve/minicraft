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

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

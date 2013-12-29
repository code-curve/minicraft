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

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

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

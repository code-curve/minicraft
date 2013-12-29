var sprite = require('./sprite');

module.exports = {
  player: sprite('player.png', 32, 32, 'player'),
  stone: sprite('stone.png', 32, 48, 'stone'),
  wood: sprite('wood.png', 32, 48, 'wood')
};

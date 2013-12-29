module.exports = function(url) {
  var image;
  image = new Image();
  image.src = 'img/' + url;
  return image;
};

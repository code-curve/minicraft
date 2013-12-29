module.exports = function(url, width, height) {
  var image;
  image = new Image();
  image.src = 'img/' + url;
  image.h = height;
  image.w = width; 
  return image;
};

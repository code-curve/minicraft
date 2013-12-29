module.exports = function(url, width, height, name) {
  var image;
  image = new Image();
  image.name = name;
  image.src = 'img/' + url;
  image.h = height;
  image.w = width; 
  return image;
};

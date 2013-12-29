module.exports = function sort(list, on) {
  var val, ordered, sorted;
  sorted = [];
  ordered = [];

  for(var id in list) {
    val = list[id][on];

    while(typeof ordered[val] !== 'undefined') {
      val++;
    }

    if(ordered[val] instanceof Array) {
      ordered[val].push(list[id])
    } else {
      ordered[val] = [list[id]];
    }
  }

  for(var i = 0; i < ordered.length; i++) {
    if(ordered[i]) {
      sorted = sorted.concat(ordered[i]);
    }
  }

  return sorted;
}


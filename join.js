// 2 Implementations of relational join.
//   Eventually this functionality should be moved into a dataframe API
//

function digest(d, keys) {
  if(!d) { throw "digest called on undefined"; }
  return keys.map(function(k) { return d[k]; }).join(':');
}

function merge_row(a, b) {
  var o = {};
  for (k in b) { o[k] = b[k]; }
  for (k in a) { o[k] = a[k]; }
  return o;
}

// NB after calling this function the arguments will be differently sorted!

function join_sortmerge(as, bs, keys) {

  var sort = crossfilter.quicksort.by(function(d) { return digest(d,keys); });

  // sort-merge implementation of join...

  sort(as, 0, as.length);
  sort(bs, 0, bs.length);

  var cs = [], 
      i = 0,
      j = 0,
      j0 = 0;
  while(i<as.length && j<bs.length) {
    var a = digest(as[i], keys),
        b = digest(bs[j], keys);
    switch(d3.ascending(a, b)) {
      case -1: i++; j = j0; break;
      case 1: j++; j0 = j; break;
      case 0:
        var o = merge_row(as[i], bs[j]);
        cs.push(o);
        j++;
        break;
    }
  }
  return cs;
}

function join_hash(as, bs, keys) {
  var bs_idx = {};
  if (bs.length > as.length) { var temp = as; as = bs; bs = temp; }
  for (var i = 0; i < bs.length; i++) {
    var d = digest(bs[i], keys);
    if (d) {
      if (!bs_idx[d]) { bs_idx[d] = []; }
      bs_idx[d].push(bs[i]);
    }
  }
  var cs = [];
  for (var i = 0; i < as.length; i++) {
    var d = digest(as[i], keys),
        bsd = bs_idx[d];
    if (bsd) {
      for (var j = 0; j < bs_idx[d].length; j++) {
        var o = merge_row(as[i], bs_idx[d][j]);
        cs.push(o);
      }
    }
  }
  return cs;
}

/* end temporary */
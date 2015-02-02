// component visualization

mdat.visualization.genre_chord = function() {
  var width = 20,
      height = 30,
      title = "Genre Chord",
      datapoint = undefined,
      uid = 0;

  function chart() {
    var namespace = "genre_chord_" + uid++;
    var price = datapoint.dimension(function(d) { return d.price; });
    var priceGrp = price.group();
    d3.select(this).append("text").text(function(d) { return priceGrp.top(1)[0].value;});
  }

  chart.datapoint = function(value) {
    if (!arguments.length) return datapoint;
    datapoint = value;
    return chart;
  }

  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return chart;
  };

  chart.title = function(value) {
    if (!arguments.length) return title;
    title = value;
    return chart;
  };

  return chart;
};

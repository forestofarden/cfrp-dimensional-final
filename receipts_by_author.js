// component visualization

mdat.visualization.receipts_by_author = function() {

  var width = 20,
      height = 20,
      title = "Receipts by Author",
      cfrp = undefined,
      uid = 0;

  function chart() {
    var namespace = "receipts_by_author_" + uid++;

    var r = d3.max([width, height]) / 2.0;
    var circle = d3.select(this).append("circle")
     .attr("cx", r)
     .attr("cy", r)
     .attr("r", r)
     .on("click", function() {
       cfrp.change();
     });

    cfrp.on("change." + namespace, function() {
      var r = circle.attr("r");
      r = +r + (Math.random() * 20 - 20);
      circle.transition().attr("r", Math.abs(r));
    });
  }

  chart.datapoint = function(value) {
    if (!arguments.length) return cfrp;
    cfrp = value;
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

// Total receipts, graphed as a time series

mdat.visualization.receipts_timeseries = function() {

  var width = 700, // width = 1024,
      height = 150, //height = 768,
      title = "Receipts timeline",
      cfrp = undefined,
      uid = 0;

  function chart() {
    var namespace = "receipts_timeseries_" + uid++;

    var receiptsByDate = cfrp.date
      .group(d3.time.year)
      .reduceSum(function(d) { return d.sold * d.price; });

    var x = d3.time.scale()
      .range([0, width]);

    var y = d3.scale.linear()
      .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var commasFormatter = d3.format(",.0f");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickFormat(commasFormatter);  

    var line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x(d.key); })
        .y(function(d) { return y(d.value); });

    var root = d3.select(this)
        .classed("receipts_timeseries", true);

    var background = root.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    var path = root.append("path")
        .attr("class", "line");

    var xAxisElm = root.append("g")
        .call(xAxis)
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")");

    var yAxisElm = root.append("g")
        .call(yAxis)
        .attr("class", "y axis")
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Recettes totales (L.)");

    update();

    cfrp.on("change." + namespace, update);

    function update() {
      var data = receiptsByDate.all();

      x.domain(d3.extent(data, function(d) { return d.key; }));
      y.domain([0, d3.max(data, function(d) { return d.value; })]);

      path.attr("d", line(data));

      root.select(".x.axis").call(xAxis);
      root.select(".y.axis").call(yAxis);
    }
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

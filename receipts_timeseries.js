// Total receipts, graphed as a time series

mdat.visualization.receipts_timeseries = function() {

  var width = 700, // width = 1024,
      height = 150, //height = 768,
      height2 = 30,
      title = "Receipts timeline",
      cfrp = undefined,
      uid = 0;

  function chart() {
    var namespace = "receipts_timeseries_" + uid++;

    var receiptsByDate = cfrp.date
      .group(d3.time.year)
      .reduceSum(function(d) { return d.sold * d.price; });

    var x = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    var brush = d3.svg.brush()
        .x(x2)
        .on("brush", brushed);

    var commasFormatter = d3.format(",.0f");

    var xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(commasFormatter);

    var line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x(d.key); })
        .y(function(d) { return y(d.value); });

    var line2 = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return x2(d.key); })
        .y(function(d) { return y2(d.value); });

    var root = d3.select(this)
        .classed("receipts_timeseries", true);

    var background = root.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height + height2);

    // TODO. garbage collect / detect pre-existing defs / other svg roots / everything is wrong...
    root.append("clipPath")
        .attr("id", namespace + "_clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = root.append("g")
        .attr("class", "focus");

    focus.append("path")
        .attr("class", "line")
        .attr("clip-path", "url(#" + namespace + "_clip)");

    focus.append("g")
        .call(xAxis)
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")");

    focus.append("g")
        .call(yAxis)
        .attr("class", "y axis")
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Recettes totales (L.)");

    var context = root.append("g")
        .attr("class", "context")
        .attr("transform", "translate(0," + (height + 25) + ")");         // TODO.  proper margins?  axes hang down from border

    context.append("path")
        .attr("class", "line");

    context.append("g")
        .call(xAxis2)
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height2 + ")");

    context.append("g")
        .attr("class", "x brush")
        .call(brush)
      .selectAll("rect")
        .attr("y", -6)
        .attr("height", height2 + 7);

    update();

    cfrp.on("change." + namespace, update);

    function update() {
      var data = receiptsByDate.all();

      // TODO... see brushed()
      foo = data;

      x.domain(d3.extent(data, function(d) { return d.key; }));
      y.domain([0, d3.max(data, function(d) { return d.value; })]);
      x2.domain(x.domain());
      y2.domain(y.domain());

      focus.select(".line")
        .datum(data)
        .attr("d", line);
      context.select(".line")
        .datum(data)
        .attr("d", line2);

      focus.select(".x.axis").call(xAxis);
      focus.select(".y.axis").call(yAxis);
      context.select(".x.axis").call(xAxis2);
    }

    function brushed() {
      d3.event.sourceEvent.stopPropagation();
      x.domain(brush.empty() ? x2.domain() : brush.extent());

      // TODO.  data is over-ridden by mdat component list..
      //        how to do this without pushing all data up to
      //        mdat level?

      focus.select(".line").datum(foo).attr("d", line);
      focus.select(".x.axis").call(xAxis);
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

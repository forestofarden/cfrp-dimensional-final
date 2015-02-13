// Total receipts, graphed as a time series

mdat.visualization.receipts_timeseries = function() {

  var width = 700, // width = 1024,
      height = 150, //height = 768,
      height2 = 30,
      title = "Receipts timeline",
      sel_ratio = 7.0/12.0,
      format = d3.time.format("%e %b %Y");
      cfrp = undefined,
      uid = 0;

  function chart() {
    var namespace = "receipts_timeseries_" + uid++;

    var receiptsByDate = cfrp.date
      .group(d3.time.month)
      .reduceSum(function(d) { return d.sold * d.price; });

    var x = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    var brush = d3.svg.brush()
        .x(x2)
        .on("brush", brushed);

    var drag = d3.behavior.drag()
        .on("dragstart", function() {
          // disable mdat drag while brushing
          d3.event.sourceEvent.stopPropagation();
        });

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

    var selection = focus.append("g")
        .attr("class", "selection");

    selection.append("path")
        .attr("d", "M" + focus_sel_range()[0] +",0V" + height);

    selection.append("path")
        .attr("d", "M" + focus_sel_range()[1] + ",0V" + height);

    var sel1 = selection.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", focus_sel_range()[0] + 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");

    var sel2 = selection.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", focus_sel_range()[1] + 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");

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
        .call(drag)
      .selectAll("rect")
        .attr("y", -6)
        .attr("height", height2 + 7);

    update();

    cfrp.on("change." + namespace, update);

    function focus_domain(extent) {
      // TODO.  formula cleanup
      var brush_range = extent.map(x2),
          width = (brush_range[1] - brush_range[0]) / sel_ratio,
          center = (brush_range[1] + brush_range[0]) / 2.0,
          new_brush = [ center - width / 2.0, center + width / 2.0 ],
          new_domain = new_brush.map(x2.invert);
      return new_domain;
    }

    function focus_sel_range() {
      var offset = width * sel_ratio / 2.0;
      return [ width / 2.0 - offset, width / 2.0 + offset ];
    }

    function update() {
      var data = receiptsByDate.all();

      // TODO... see brushed()
      foo = data;

      x2.domain(d3.extent(data, function(d) { return d.key; }));
      y2.domain([0, d3.max(data, function(d) { return d.value; })]);
      x.domain(focus_domain(x2.domain()));
      y.domain(y2.domain());

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

      var sel_dom = brush.empty() ? x2.domain() : brush.extent(),
          dom = focus_domain(sel_dom);

      x.domain(dom);
      sel1.text(format(dom[0]));
      sel2.text(format(dom[1]));

      cfrp.date.filter(dom);

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

  chart.sel_ratio = function(value) {
    if (!arguments.length) return sel_ratio;
    sel_ratio = value;
    return chart;
  };

  return chart;
};

// Total receipts, graphed as a time series

mdat.visualization.receipts_timeseries = function() {

  var width = 700, // width = 1024,
      height = 150, //height = 768,
      height2 = 30,
      title = "Receipts Time Series",
      sel_ratio = 7.0/12.0,
      format = d3.time.format("%e %b %Y");
      cfrp = undefined,
      uid = 0;

  var css = " \
    text { \
      font: 10px sans-serif; \
    } \
    .axis path, \
    .axis line { \
      fill: none; \
      stroke: #000; \
      shape-rendering: crispEdges; \
    } \
    .line { \
      fill: none; \
      stroke: orange; \
      stroke-width: 1.5px; \
    } \
    .brush .extent { \
      stroke: #fff; \
      fill-opacity: .125; \
      shape-rendering: crispEdges; \
    } \
    .selection { \
      stroke: black; \
      stroke-opacity: 0.2; \
      stroke-dasharray: 5,2; \
    } \
    .selection text { \
      opacity: 0.5; \
    }";

  function chart() {
    var namespace = "receipts_timeseries_" + uid++;

    var date = cfrp.dimension(function(d) { return d.date; }),
        receiptsByDate = date.group(d3.time.month)
                           .reduceSum(function(d) { return d.sold * d.price; });

    var x = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    y.domain([0, receiptsByDate.top(1)[0].value]);
    y2.domain(y.domain());

    var brush = d3.svg.brush()
        .x(x2)
        .on("brushstart", function() {
          d3.event.sourceEvent.preventDefault();  // Necessary for Firefox
        })
        .on("brush", brushed)
        .on("brushend", function() {
          zoom.scaleExtent([focus_scale(), Infinity]);
        });

    var zoom = d3.behavior.zoom()
          .x(x)
          .scaleExtent([1, Infinity])
          .on('zoom', function() {
            draw();
            brush.extent(focus_domain());
          });

    // TODO.... not clear
    d3.select(this).call(zoom);

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

    root.append('defs')
      .append('style')
      .attr('type','text/css')
      .text(css);

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
        .text("Recettes par mois (L.)");

    var selection = focus.append("g")
        .attr("class", "selection");

    selection.append("path")
        .attr("d", "M" + focus_range()[0] +",0V" + height);

    selection.append("path")
        .attr("d", "M" + focus_range()[1] + ",0V" + height);

    var sel1 = selection.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", focus_range()[0] + 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");

    var sel2 = selection.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", focus_range()[1] + 6)
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
    cfrp.on("dispose." + namespace, dispose);

    function focus_domain() {
      // TODO.  formula cleanup
      var extent = brush.empty() ? x2.domain() : brush.extent(),
          brush_range = extent.map(x2),
          width = (brush_range[1] - brush_range[0]) / sel_ratio,
          center = (brush_range[1] + brush_range[0]) / 2.0,
          new_brush = [ center - width / 2.0, center + width / 2.0 ],
          new_domain = new_brush.map(x2.invert);
      return new_domain;
    }

    function focus_range() {
      var offset = width * sel_ratio / 2.0;
      return [ width / 2.0 - offset, width / 2.0 + offset ];
    }

    function focus_scale() {
      var data = receiptsByDate.all(),
          curDomain = focus_domain(),
          fullDomain = data_extent();
      return (curDomain[1] - curDomain[0]) / (fullDomain[1] - fullDomain[0]);
    }

    function data_extent() {
      // TODO.  possible with crossfilter rather than d3?
      var data = receiptsByDate.all(),
          extent = d3.extent(data, function(d) { return d.key; });
      return extent;
    }

    // TODO.  better solution for omitting events from self
    var recursive = false;

    function update() {
      if (recursive) { return; }

      var extent = data_extent();

      x2.domain(extent);
      x.domain(focus_domain());
      zoom.x(x);

      draw();
    }

    function draw() {
      var data = receiptsByDate.all(),
          dom = focus_domain();

      sel1.text(format(dom[0]));
      sel2.text(format(dom[1]));

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

      date.filter(focus_domain());
      cfrp.change();
    }

    function dispose() {
      console.log("detaching dimension for time series");
      cfrp.on("." + namespace, null);
      date.groupAll();
      date.dispose();
      cfrp.change();
    }

    return namespace;
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

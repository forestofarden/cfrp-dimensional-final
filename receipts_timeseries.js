// Total receipts, graphed as a time series

mdat.visualization.receipts_timeseries = function() {

  var decade = function(date) {
    date = d3.time.year(date);
    date.setFullYear(Math.floor(date.getFullYear() / 10) * 10);
    return date;
  };

  var width = 700, // width = 1024,
      height = 150, //height = 768,
      height2 = 30,
      title = "Receipts Time Series",
      sel_ratio = 7.0/12.0,
      intervals = [ decade, d3.time.year, d3.time.month, d3.time.week, d3.time.day ],
      interval_names = [ "décennie", "année", "mois", "semaine", "jour" ],
      context_interval = 2,
      format = d3.time.format("%e %b %Y"),
      commasFormatter = d3.format(",.0f"),
      uid = 0;

  var cfrp = undefined,
      maxReceipts = undefined;

  var css = " \
    text { \
      font: 10px sans-serif; \
    } \
    .receipts_timeseries .axis path, \
    .receipts_timeseries .axis line { \
      fill: none; \
      stroke: #000; \
      shape-rendering: crispEdges; \
    } \
    .receipts_timeseries .line { \
      fill: none; \
      stroke: orange; \
      stroke-width: 1.5px; \
    } \
    .receipts_timeseries .dot { \
      fill: white; \
      stroke: orange; \
      stroke-width: 1px; \
    } \
    .receipts_timeseries .granularity { \
      font: 25px sans-serif; \
      fill: orange; \
    } \
    .receipts_timeseries .brush .extent { \
      stroke: #fff; \
      fill-opacity: .125; \
      shape-rendering: crispEdges; \
    } \
    .receipts_timeseries .selection { \
      stroke: black; \
      stroke-opacity: 0.2; \
      stroke-dasharray: 5,2; \
    } \
    .receipts_timeseries .selection text { \
      opacity: 0.5; \
    }";

  function chart() {
    var namespace = "receipts_timeseries_" + uid++;

    var focus_interval = context_interval;

    var x = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

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

    // TODO.... not clear.  zoom not coordinated with brush
//    d3.select(this).call(zoom);

    var drag = d3.behavior.drag()
        .on("dragstart", function() {
          // disable mdat drag while brushing
          d3.event.sourceEvent.stopPropagation();
        });

    var xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(commasFormatter);

    var line = d3.svg.line()
        .interpolate("cardinal")
        .x(function(d) { return x(d.key); })
        .y(function(d) { return y(d.value); });

    var line2 = d3.svg.line()
        .interpolate("cardinal")
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

    var focusinfo = focus.append("g")
        .attr("class", "info")
        .attr("clip-path", "url(#" + namespace + "_clip)");

    focusinfo.append("path")
        .attr("class", "line")

    var focus_x_axis = focus.append("g")
        .call(xAxis)
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")");

    focus_x_axis.append("text")
        .attr("class", "granularity")
        .attr("x", width)
        .attr("dy", "-30")
        .style("text-anchor", "middle")
        .text("+")
        .on("click", function() {
          focus_interval = Math.min(focus_interval + 1, intervals.length - 1);
          update();
        });

    focus_x_axis.append("text")
        .attr("class", "granularity")
        .attr("x", width)
        .attr("dy", "-10")
        .style("text-anchor", "middle")
        .text("-")
        .on("click", function() {
          focus_interval = Math.max(focus_interval - 1, 0);
          update();
        });

    var focusAxisLabel = focus.append("g")
        .call(yAxis)
        .attr("class", "y axis")
      .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");

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

    var date = cfrp.dimension(function(d) { return d.date; }),
        focusReceipts,
        contextReceipts;

    cfrp.on("change." + namespace, update);
    cfrp.on("dispose." + namespace, dispose);

    update();

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
      var curDomain = focus_domain(),
          fullDomain = data_extent();
      return (curDomain[1] - curDomain[0]) / (fullDomain[1] - fullDomain[0]);
    }

    function data_extent() {
      var all_dates = date.group().all(),
          low = all_dates[0].key,
          high = all_dates[all_dates.length-1].key;
      return [ low, high ];
    }

    // TODO.  better solution for omitting events from self
    var recursive = false;

    function update() {
      if (recursive) { return; }

      var context_min_interval = Math.min(context_interval, focus_interval),
          context_ext = data_extent().map(intervals[context_min_interval]);

      x2.domain(context_ext);
      y2.domain([0, maxReceipts[context_min_interval]]);

      x.domain(focus_domain());
      y.domain([0, maxReceipts[focus_interval]]);
      zoom.x(x);

      focusReceipts = date.group(intervals[focus_interval])
                          .reduceSum(function(d) { return d.sold * d.price; });
      contextReceipts = date.group(intervals[context_min_interval])
                            .reduceSum(function(d) { return d.sold * d.price; });

      draw();
    }

    function draw() {
      var contextData = contextReceipts.all(),
          focusData = focusReceipts.all(),
          dom = focus_domain();

      sel1.text(format(dom[0]));
      sel2.text(format(dom[1]));

      var dots = focusinfo.selectAll(".dot")
        .data(focusData);

      dots.exit().remove();

      dots.enter().append("circle")
         .attr("class", "dot")
         .attr("r", 3)
        .append("title")
         .text(function(d) { return "L. " + commasFormatter(d.value); });

      dots.attr("cx", line.x())
          .attr("cy", line.y());

      focusinfo.select(".line")
        .datum(focusData)
        .attr("d", line);

      context.select(".line")
        .datum(contextData)
        .attr("d", line2);

      focus.select(".x.axis").call(xAxis);
      focus.select(".y.axis").call(yAxis);
      context.select(".x.axis").call(xAxis2);

      focusAxisLabel.text("Recettes par " + interval_names[focus_interval] + " (L.)");
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

    var date = cfrp.dimension(function(d) { return d.date; });

    maxReceipts = intervals.map(function(interval) {
      var grp = date.group(interval).reduceSum(function(d) { return d.sold * d.price; });
      return grp.top(1)[0].value;
    });

    date.dispose();

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

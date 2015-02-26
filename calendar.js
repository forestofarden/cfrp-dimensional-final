mdat.visualization.calendar = function() {

  var all_years = d3.range(1680, 1700); // 1794);

  var cellSize = 8,
      years_visible = 8,
      width = 52 * cellSize + 15 + 40,
      height = 8 * years_visible * cellSize,
//      height = "100%",// 8 * cellSize * (1794 - 1680),    // TODO.  calculate domain
      title = "Calendar Heatmap",
      cfrp = undefined,
      uid = 0,
      sel_extent = [];

  var css = "\
    text { \
      font: 10px sans-serif; \
    } \
    rect.day.selected { \
      fill: red; \
    } \
    .year_rug { \
      stroke: #ccc; \
    } \
    .brush .extent { \
      stroke: #fff; \
      fill-opacity: .125; \
      shape-rendering: crispEdges; \
    } \
    .brush .resize { \
      display: none; \
    } \
    .day { \
      stroke: #ccc; \
    } \
    .month { \
      fill: none; \
      stroke: #000; \
      stroke-width: 1.5px; \
    }";

  function chart() {
    var namespace = "calendar_" + uid++;

    var date = cfrp.dimension(function(d) { return d.date; }),
        receiptsByDate = date.group().reduceSum(function(d) { return d.sold * d.price; }),
        receiptsByYear = date.group(d3.time.year).reduceSum(function(d) { return d.sold * d.price; });

    var day = d3.time.format("%w"),
        week = d3.time.format("%U"),
        percent = d3.format(".1%"),
        format = d3.time.format("%a %e %b %Y"),
        commasFormatter = d3.format(",.0f");

    var y = d3.scale.ordinal()
        .domain(all_years)
        .rangeBands([0, height]);

    var brush = d3.svg.brush()
        .y(y)
        .extent([y(all_years[0]), y(all_years[years_visible])])
        .clamp(true)
        .on("brush", brushed);

    var drag = d3.behavior.drag()
        .on("dragstart", function() {
          // disable mdat drag while brushing
          d3.event.sourceEvent.stopPropagation();
        });

    var root = d3.select(this)
        .classed("calendar", true);

    var defs = root.append('defs');

    defs.append('style')
      .attr('type','text/css')
      .text(css);

    defs.append("clipPath")
        .attr("id", namespace + "_clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    var context = root.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + (width - 10) + ",30)");

    var c_year = context.selectAll("year")
        .data(all_years)
      .enter().append("rect")
        .attr("class", "year_rug")
        .attr("x", 4)
        .attr("y", function(d) { return y(d); })
        .attr("width", cellSize)
        .attr("height", y.rangeBand());

    context.append("g")
        .attr("class", "y brush")
        .call(brush)
        .call(drag)
      .selectAll("rect")
        .attr("width", cellSize + 8);

    var focus = root.append("g")
        .attr("class", "focus")        
        .attr("transform", "translate(0,30)")
        .attr("style", "clip-path: url(#" + namespace + "_clip);");

    // TODO.  get years range from data
    var years = focus.selectAll("year")
        .data(all_years)
      .enter().append("g")
        .attr("class", "year")
        .attr("transform", function(d,i) { return "translate(15," + (cellSize * 8 * i) + ")"; });

    years.append("text")
        .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
        .style("text-anchor", "middle")
        .text(function(d) { return d; });

    var rect = years.selectAll(".day")
        .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter().append("rect")
        .attr("class", "day")
        .attr("width", cellSize)
        .attr("height", cellSize)
        .attr("x", function(d) { return week(d) * cellSize; })
        .attr("y", function(d) { return day(d) * cellSize; });

    rect.on("click", select);

    rect.append("title")
        .text(format);

    years.selectAll(".month")
        .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
      .enter().append("path")
        .attr("class", "month")
        .attr("d", monthPath);

    update();

    cfrp.on("change." + namespace, update);

    function select(d) {
      var dist = sel_extent.map(function(p) { return Math.abs(p - d); }),
          ndx = dist.indexOf(d3.min(dist));

      if (dist.some(function(p) { return p === 0.0; })) { sel_extent = []; }
      else if (ndx >= 0 && sel_extent.length > 1) { sel_extent[ndx] = d; }
      else { sel_extent.push(d); }

      rect.classed("selected", function(p) {
        switch (sel_extent.length) {
          case 0: return false;
          case 1: return p === sel_extent[0];
          case 2: return (sel_extent[0] <= p) && (p <= sel_extent[1]);
        }
      });

      switch (sel_extent.length) {
        case 0: date.filterAll(); break;
        case 1: date.filterExact(sel_extent[0]); break;
        case 2: date.filterRange(sel_extent); break;
      }

      cfrp.change();
    }

    function update() {
      var start = new Date(),
          middle,
          finish;

      // TODO.  make local var
      focusData = d3.map(receiptsByDate.all(), 
                    function(d) { return d.key; });
      contextData = d3.map(receiptsByYear.all(), function(d) { return d.key.getFullYear(); });

      var receipts_domain = receiptsByDate.top(receiptsByDate.size()).map(function(d) { return d.value; }).reverse(),
          context_domain = receiptsByYear.top(receiptsByYear.size()).map(function(d) { return d.value; }).reverse();

      // TODO.  calculate quantiles without projecting all values
      var focusColor = d3.scale.quantile()
        .domain(receipts_domain)
        .range(colorbrewer.YlGnBu[9]);

      var contextColor = d3.scale.quantile()
        .domain(context_domain)
        .range(colorbrewer.YlGnBu[9]);

      c_year.attr("fill", function(d) {

        var dsum = contextData.get(d);
        return (dsum && dsum.value > 0) ? contextColor(dsum.value) : "white";
      });    

      middle = new Date();
      rect.attr("fill", function(d) {
        var dsum = focusData.get(d);
        return (dsum && dsum.value > 0) ? focusColor(dsum.value) : "white";
      }).select("title")
          .text(function(d) {
            var dsum = focusData.get(d);
            return format(d) + (dsum ? ": L. " + commasFormatter(dsum.value) : ""); });

      finish = new Date();
      console.log("calendar: quantize in " + (middle - start) + "ms, render in " + (finish - middle) + "ms");
    }

    function monthPath(t0) {
      var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
          d0 = +day(t0), w0 = +week(t0),
          d1 = +day(t1), w1 = +week(t1);
      return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
          + "H" + w0 * cellSize + "V" + 7 * cellSize
          + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
          + "H" + (w1 + 1) * cellSize + "V" + 0
          + "H" + (w0 + 1) * cellSize + "Z";
    }

    function brushed() {
      d3.event.sourceEvent.stopPropagation();
      var proportion = brush.extent()[0] / height,
          scrollHeight = cellSize * 8 * all_years.length;
      // TODO. scrolling disabled until we figure out a scalability solution for SVG
//      focus.attr("transform", "translate(0,-" + (proportion * scrollHeight) + ")");
    }

    return root;
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
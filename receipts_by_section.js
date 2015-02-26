// component visualization

mdat.visualization.receipts_by_section = function() {

  var width = 600,
      height = 100,
      title = "Receipts Dist. by Section",
      cfrp = undefined,
      uid = 0;

  // should be in CDATA
  var css = "\
    text { \
      font: 10px sans-serif; \
    } \
    .axis path, \
    .axis line { \
    fill: none; \
    stroke: #000; \
    shape-rendering: crispEdges; \
    } \
    .box line { \
      fill: none; \
      stroke-width: 1.5px; \
    } \
    .box, .decoration, \
    .outlier { \
      stroke: #1f77b4; \
      fill: none; \
    } \
    .outlier circle { \
      fill: white; \
    } \
    .outlier.extreme { \
      stroke: red; \
    } \
    .box:not(:hover) text, \
    .outlier:not(:hover) text { \
      display:none; \
    } \
    .selected { \
      fill: red; \
    }";

  var receiptFormat = d3.format(",.0f");

  function chart() {

    var namespace = "receipts_by_section" + uid++;

    var sectionDim     = cfrp.dimension(function(d) { return d.section; }),
        sectionNames   = sectionDim.group().top(Infinity).map(function(d) { return d.key; }),

        dateDim        = cfrp.dimension(function(d) { return d.date; }),
        receipts       = dateDim.group().reduceSum(function(d) { return d.sold * d.price; });

    var format = d3.time.format("%a %e %b %Y");

    // TODO.
    /*
    sectionNames = [ 'Places de Parterre', 'Premières Places', 'Troisièmes Places', 'Secondes Places', 'Loge basse',
                     'Irregular Receipts', 'Petites Loges', 'Secondes Loges 3', 'Loge haute', 'Secondes Loges',
                     'Parterre', 'Theatre', 'Premieres loges', 'Troisiemes Loges' ];
    */

    var root = d3.select(this).append("g")
        .classed("receipts_by_section", true);

    var data = section_summaries();

    var all_points = data.map(function(d) { return d.summary; })
          .reduce(function(a, b) { return a.concat(b); });

    var x = d3.scale.linear()
      .domain([0, d3.max(all_points)])
      .range([100, width]);

    var y = d3.scale.ordinal()
      .domain(data.map(function(d) { return d.section; }))
      .rangeRoundBands([0, height], .5);

    var xAxis = d3.svg.axis()
      .scale(x)
      .orient("top")
      .tickFormat(receiptFormat);

    root.append('defs')
      .append('style')
      .attr('type','text/css')
      .text(css);

    root.append("g")
        .call(xAxis)
        .attr("class", "x axis");

    var boxplot = root.selectAll(".boxplot")
          .data(data);

    boxplot.enter().append("g")
          .attr("class", "boxplot")
          .attr("transform", function(d) { return "translate(0," + y(d.section) + ")"; })
        .append("text")
          .attr("class", "label")
          .attr("x", 80)
          .attr("y", y.rangeBand() / 2.0)
          .attr("text-anchor", "end")
          .text(function(d) { return d.section; });

    var box = boxplot.selectAll(".box")
       .data(function(d) { return d.summary.slice(2,7); });

    var box_g = box.enter()
        .append("g")
        .attr("class", "box");
    box_g.append("line")
       .attr("y1", 0)
       .attr("y2", y.rangeBand());
    box_g.append("text")
      .attr("dy", "-5");

    // decoration: sides of the box between q2 and q4,
    //             and the whiskers

    var decoration = boxplot.append("path")
       .attr("class", "decoration");

    update();

    cfrp.on("change." + namespace, update);
    cfrp.on("dispose." + namespace, dispose);

    function update() {
      var data = section_summaries();

      var boxplot = root.selectAll(".boxplot")
          .data(data);

      var box = boxplot.selectAll(".box")
         .data(function(d) { return d.summary.slice(2,7); });

      box.select("line")
         .attr("x1", function(d) { return x(d); })
         .attr("x2", function(d) { return x(d); });

      box.select("text")
         .attr("x", function(d) { return x(d); })
         .text(function(d) { return "L. " + receiptFormat(d); });

      var decoration = boxplot.select(".decoration");

      decoration.attr("d", function(d) {
                      return "M" + x(d.summary[2]) + "," + y.rangeBand() / 2 + "H" + x(d.summary[3]) +
                             "M" + x(d.summary[3]) + ",0H" + x(d.summary[5]) + 
                             "M" + x(d.summary[3]) + "," + y.rangeBand() + "H" + x(d.summary[5]) +
                             "M" + x(d.summary[5]) + "," + y.rangeBand() / 2 + "H" + x(d.summary[6])});

      // outliers

      var outlier = boxplot.selectAll(".outlier")
         .data(function(d) {
           return d.outliers.map(function(v) { return { key: v.key, value: v.value, summary: d.summary }; }) });

      outlier.exit().remove();

      var outlier_e = outlier.enter()
        .append("g")
         .attr("class", "outlier");
      outlier_e.append("circle")
         .attr("cy", y.rangeBand() / 2)
         .attr("r", 2);
      outlier_e.append("text")
         .attr("dy", "-5");

      outlier.classed("extreme", function(d) {
        return d.value < d.summary[1] || d.value > d.summary[7];
      });

      outlier.select("circle")
        .attr("cx", function(d) { return x(d.value); });

      outlier.select("text")
        .attr("x", function(d) { return x(d.value); })
        .text(function(d) { return format(d.key) + ": L. " + receiptFormat(d.value); });
    }

    function section_summaries() {
      var data = sectionNames.map(function(section) {
        sectionDim.filter(section);

        var sectionReceiptsByDate = receipts.top(receipts.size()).map(dup_bucket).filter(function(d) { return d.value > 0.0; }).reverse(),
            points = sectionReceiptsByDate.map(function(d) { return d.value; });

        var median = d3.quantile(points, 0.5),
            irq    = d3.quantile(points, 0.75) - d3.quantile(points, 0.25),
            extent = [ points[0], points[points.length-1] ];

        var bracket = function(v) {
          if (v < extent[0]) { v = extent[0]; }
          else if (v > extent[1]) { v = extent[1]; }
          return v;
        };

        var summary = [ extent[0],                            // minimum
                        median - (irq / 2.0) - irq * 3.0,     // low outliers
                        median - (irq / 2.0) - irq * 1.5,     // low whiskers
                        median - (irq / 2.0),                 // first quartile
                        median,                               // second quartile
                        median + (irq / 2.0),                 // third quartile
                        median + (irq / 2.0) + irq * 1.5,     // high whiskers
                        median + (irq / 2.0) + irq * 3.0,     // high outliers
                        extent[1] ];                          // maximum
        summary = summary.map(bracket);

        var outliers = [];
        sectionReceiptsByDate.forEach(function(d) {
          if (summary[2] > d.value || summary[6] < d.value) { 
            outliers.push(d);
          }
        });

        sectionDim.groupAll();

        return {
            section: section,
            summary: summary,
            receipts: points,
            outliers: outliers.sort()
          };
      });

      return data;
    }

    function dispose() {
      console.log("detaching dimensions for boxplots");
      cfrp.on("." + namespace, null);
      sectionDim.groupAll();
      sectionDim.dispose();
      dateDim.groupAll();
      dateDim.dispose();
      cfrp.change();
    }

    function dup_bucket(d) { return { key: d.key, value: d.value }; }

    return namespace;
  }

  chart.datapoint = function(value) {
    if (!arguments.length) return cfrp;
    cfrp = value;
    // TODO remove
    mdat.cfrp = value;
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

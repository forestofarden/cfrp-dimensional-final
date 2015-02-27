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
        receipts       = dateDim.group(d3.time.day).reduceSum(function(d) { return d.sold * d.price; });

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

    var global_max = d3.max(data.map(function(d) { return d.summary[8]; }));

    var x = d3.scale.linear()
      .domain([0, global_max])
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

        var sectionReceiptsByDate = receipts.top(Infinity)
                                      .map(dup_bucket)
                                      .filter(function(d) { return d.value > 0.01; }) // TODO.  crossfilter's aggregation method magnifies small floating point errors
                                      .reverse(),
            points = sectionReceiptsByDate.map(function(d) { return d.value; });

        var q0  = points[0],
            q1  = d3.quantile(points, 0.25),
            q2  = d3.quantile(points, 0.5),
            q3  = d3.quantile(points, 0.75),
            q4  = points[points.length-1];
            irq = q3 -q1;

        function bracket(v) { return v ? Math.min(q4, Math.max(q0, v)) : 0.0; };

        var summary = [ q0,                 // minimum
                        q1 - irq * 3.0,     // low outliers
                        q1 - irq * 1.5,     // low whiskers
                        q1,                 // first quartile
                        q2,                 // second quartile
                        q3,                 // third quartile
                        q3 + irq * 1.5,     // high whiskers
                        q3 + irq * 3.0,     // high outliers
                        q4 ];               // maximum
        summary = summary.map(bracket);

        var outliers = [];
        sectionReceiptsByDate.forEach(function(d) {
          if (d.value < summary[2] || summary[6] < d.value) {
            outliers.push(d);
          }
        });

/*
        var sanity_sorted = points.reduce(function(v,d) { return (v >= 0.0) && (d >= v) ? d : -1 }, 0.0);
        sanity_sorted = (sanity_sorted >= 0.0 ? "sorted" : "not sorted");
        var in_irq = function(d) { return summary[3] <= d && d <= summary[5]; },
            sanity_count = points.reduce(function(v,d) { return in_irq(d) ? v+1 : v; }, 0);
        console.log(section + ": " + points.length + " results; " + sanity_count + " in irq; " + outliers.length + " outliers");
        console.log(JSON.stringify(summary) + " " + sanity_sorted);
*/

        sectionDim.groupAll();

        return {
            section: section,
            summary: summary,
            outliers: outliers
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

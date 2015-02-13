// component visualization

mdat.visualization.receipts_by_section = function() {

  var width = 300,
      height = 150,
      title = "Yearly Receipts by Section",
      cfrp = undefined,
      uid = 0;

  var receiptFormat = d3.format(",.0f");

  function chart() {

    var namespace = "receipts_by_section" + uid++;

    var sectionDim     = cfrp.dimension(function(d) { return d.section; }),
        sectionNames   = sectionDim.group().all().map(function(d) { return d.key; }),

        yearDim        = cfrp.dimension(function(d) { return d.date; }),
        yearAgg        = yearDim.group(function(d) { return d.getFullYear(); }),
        receipts       = yearAgg.reduceSum(function(d) { return d.sold * d.price; });


    // TODO.
    /*
    sectionNames = [ 'Places de Parterre', 'Premières Places', 'Troisièmes Places', 'Secondes Places', 'Loge basse',
                     'Irregular Receipts', 'Petites Loges', 'Secondes Loges 3', 'Loge haute', 'Secondes Loges',
                     'Parterre', 'Theatre', 'Premieres loges', 'Troisiemes Loges' ];
    */                     

    var root = d3.select(this).append("g")
        .classed("receipts_by_section", true);

    var background = root.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    update();

    cfrp.on("change." + namespace, update);

    function update() {
      var data = section_summaries();

      var all_points = data.map(function(d) { return d.summary; })
            .reduce(function(a, b) { return a.concat(b); });

      var x = d3.scale.linear()
        .domain(d3.extent(all_points))
        .range([100, width]);

      var y = d3.scale.ordinal()
        .domain(data.map(function(d) { return d.section; }))
        .rangeRoundBands([0, height], .5);

      var boxplot = root.selectAll(".boxplot")
          .data(data);

      boxplot.enter()
         .append("g")
            .attr("class", "boxplot")
            .attr("transform", function(d) { return "translate(0," + y(d.section) + ")"; })
          .append("text")
            .attr("class", "label");

      boxplot.select(".label")
          .attr("x", 80)
          .attr("y", y.rangeBand() / 2.0)
          .attr("text-anchor", "end")
          .text(function(d) { return d.section; });

      var box = boxplot.selectAll(".box")
         .data(function(d) { return d.summary.slice(2,7); });

      var box_g = box.enter()
          .append("g")
          .attr("class", "box");
      box_g.append("line");
      box_g.append("text")
        .attr("dy", "-5");          

      box.select("line")
         .attr("x1", function(d) { return x(d); })
         .attr("y1", 0)
         .attr("x2", function(d) { return x(d); })
         .attr("y2", y.rangeBand());

      box.select("text")
         .attr("x", function(d) { return x(d); })
         .text(function(d) { return "L. " + receiptFormat(d); });

      // decoration: sides of the box between q2 and q4,
      //             and outriggers to the whiskers

      var decoration = boxplot.append("path")
                .attr("class", "decoration");

      decoration.attr("d", function(d) {
                      return "M" + x(d.summary[2]) + "," + y.rangeBand() / 2 + "H" + x(d.summary[3]) +
                             "M" + x(d.summary[3]) + ",0H" + x(d.summary[5]) + 
                             "M" + x(d.summary[3]) + "," + y.rangeBand() + "H" + x(d.summary[5]) +
                             "M" + x(d.summary[5]) + "," + y.rangeBand() / 2 + "H" + x(d.summary[6])});

        // whiskers: near and outliers

        var whiskers = boxplot.selectAll(".whisker")
           .data(function(d) { return d.outliers.map(function(v) { return { key: v.key, value: v.value, summary: d.summary }; }) }); 

        var g = whiskers.enter()
          .append("g")
           .attr("class", "whisker");
        g.append("circle")
          .attr("cy", y.rangeBand() / 2)
          .attr("r", 2);
        g.append("text")
          .attr("dy", "-5");

        whiskers.classed("outlier", function(d) { 
          return d.value < d.summary[1] || d.value > d.summary[7];
        });

        whiskers.select("circle")
          .attr("cx", function(d) { return x(d.value); });

        whiskers.select("text")
          .attr("x", function(d) { return x(d.value); })
          .text(function(d) { return d.key + ": L. " + receiptFormat(d.value); });
    }

    function section_summaries() {
      var data = sectionNames.map(function(section) {
        sectionDim.filter(section);

        var sectionReceiptsByYear = receipts.top(receipts.size()).map(dup_bucket).reverse(),
            points = sectionReceiptsByYear.map(function(d) { return d.value; }).filter(function(d) { return d > 0.0; });
         
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
        sectionReceiptsByYear.forEach(function(d) {
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

    function dup_bucket(d) { return { key: d.key, value: d.value }; }

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

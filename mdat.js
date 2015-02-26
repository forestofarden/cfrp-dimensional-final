mdat = {};

mdat.visualization = {};

mdat.mplex = function (){
  var width  = 1200,
      height = 800,
      datapoint,
      datapoint_dispatch = d3.dispatch("change", "dispose"),
      dashboard = [];

  function chart() {
    var serial = 0;

    var svg = this.append("svg")
               .attr("class", "dashboard")
               .attr("width", "100%") // width)
               .attr("height", "100%") // height),
        sidebar = this.append("ul")
                    .attr("class", "sidebar");

    var drag = d3.behavior.drag()
      .origin(function(d) { return d; })
      .on("drag", function(d, i) {
        d.x = d3.event.x;
        d.y = d3.event.y;
        d3.select(this)
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      });

    var charts = d3.values(mdat.visualization)
      .map(function(fn) { return fn.call(); })
      .sort(function(a, b) {
        return +(a.title() > b.title()) || +(a.title() === b.title()) - 1;
      });

    sidebar.selectAll(".block")
        .data(charts)
      .enter().append("li")
        .attr("class", "block")
        .append("a")
          .attr("href", "#")
          .text(function(d) { return d.title(); })
        .on("click", function(d) {
          dashboard.push({id : serial++,
                               chart : d, 
                               x : width / 2 - d.width() / 2,
                               y : height / 2 - d.height() / 2 });
          change();
        });

    function change() {
      var viz = svg.selectAll(".viz")
          .data(dashboard, function(d) { return d.id; });

      viz.exit().remove();

      var enter = viz.enter().append("g")
         .attr("class", "viz")
         .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .call(drag);

      enter.append("rect")
           .attr("class", "background")
           .attr("width", function(d) { return d.chart.width(); })
           .attr("height", function(d) { return d.chart.height(); });

      enter.append("circle")
           .attr("class", "close")
           .attr("cx", function(d) { return d.chart.width(); })
           .attr("cy", 6)
           .attr("r", 4)
           .attr("stroke", "black")
           .attr("stroke-width", "2")
           .attr("fill", "white")
         .on("click", function(d) {
           dashboard = dashboard.filter(function(d0) { return d0.id !== d.id; });
           datapoint_dispatch.dispose(d.namespace);
           change();
         });

      var download_link = enter.append("a")
           .attr("xlink:href", "#");

      download_link.append("path")
           .attr("class", "download")
           .attr("d", function(d) { return "M" + (d.chart.width() - 15) + " 0 V 10 h 3 l -3 3 l -3 -3 h 3 z"; })
           .attr("stroke", "black")
           .attr("stroke-width", "1");

      enter.each(function(d, i) {
        // attach datapoint & render visualization
        d.namespace = d.chart.datapoint(datapoint).call(this);

        console.log("attached a viz (" + d.namespace + ").");

        // attach download handler
        download_link.on("click", function() {
          console.log("render as svg");
            /* later...
            var elem = d3.select(d.namespace),
                xml = '<svg xmlns="http://www.w3.org/2000/svg" width="' + d.chart.width() + '" height="'
                                                                    + d.chart.height() + '">'
                                                                    + elem.html() + '</svg>';
           download_link.attr("xlink:href", 'data:application/octet-stream;base64,' + btoa(xml));
           */
        });
      })
         .attr("opacity", 0)
        .transition().duration(1000)
         .attr("opacity", 1);
    };
  }

  chart.datapoint = function(value) {
    if (!arguments.length) return datapoint;
    datapoint = value;
    d3.rebind(datapoint, datapoint_dispatch, "on", "change", "dispatch");
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

  return chart;
};

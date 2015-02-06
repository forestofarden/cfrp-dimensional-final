mdat = {};

mdat.visualization = {};

mdat.mplex = function (){
  var width  = 900,
      height = 450,
      datapoint,
      datapoint_dispath = d3.dispatch("change"),
      dashboard = [];

  function chart() {
    var serial = 0;

    var svg = this.append("svg")
               .attr("class", "dashboard")
               .attr("width", width)
               .attr("height", height),
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
                               x : Math.random() * width, 
                               y : Math.random() * height});
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

      enter.each(function(d, i) { d.chart.datapoint(datapoint).call(this); })
         .attr("opacity", 0)
        .transition().duration(1000)
         .attr("opacity", 1);

      enter.append("circle")
           .attr("class", "close")
           .attr("cx", function(d) { return d.chart.width(); })
           .attr("r", 5)
           .attr("stroke", "black")
           .attr("stroke-width", "2")
           .attr("fill", "white")
         .on("click", function(d) {         
           dashboard = dashboard.filter(function(d0) { return d0.id !== d.id; });
           change();
         });
    };
  }

  chart.datapoint = function(value) {
    if (!arguments.length) return datapoint;
    datapoint = value;
    d3.rebind(datapoint, datapoint_dispath, "on", "change");
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
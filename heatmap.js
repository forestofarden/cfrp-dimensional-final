//
// an external url with regions updated according to 
//   d3 color quantiles
//
// the source SVG file should annotate the marks with class "mdat {section}"
// [ replace spaces with dashes ]
//
//  <svg>
//    <circle class="mdat parterre" cx="15" cy="15" r="5"></circle>
//    <circle class="mdat première_loge" cx="30" cy="15" r="5"></circle>
//    <circle class="mdat autre" cx="45" cy="15" r="5"></circle>
//  </svg>

mdat.visualization.heatmap = function() {

  var width = 550,
      height = 550,
      title = "Heatmap",
      cfrp = undefined,
      uid = 0,
      url = "assets/bordeaux1.svg",
      svg;


  function chart() {
    var namespace = "heatmap_" + uid++;

    var receiptsBySection = cfrp.section
      .group()
      .reduceSum(function(d) { return d.price * d.sold; });

    var color = d3.scale.quantile()
      .range(colorbrewer.YlGnBu[9]);

    var root = d3.select(this)
        .classed("heatmap", true);

    var background = root.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    d3.xml(url, "image/svg+xml", function(error, fragment) {
      fragment = fragment.getElementsByTagName("svg")[0];
      root.node().appendChild(fragment);
      root.select("svg")
        .attr("width", width)
        .attr("height", height);

      update();
      cfrp.on("change." + namespace, update);
    });

    function update() {
      var data = receiptsBySection.all(),
          data_ndx = d3.map(data, function(d) { return d.key; });

      color.domain(data.map(function(d) { return d.value; }));

      var marks = root.selectAll(".mdat")
        .datum(function() {
          // Join data on the SVG class instead of D3 default          
          var classes = d3.select(this).attr("class").split(" ");
          classes = classes.filter(function(d) { return d !== "mdat"; });
          var k = classes[0].replace("_", " ");
          return data_ndx[k];
        });

      marks.attr("fill", function(d, i) { 
        console.log("[heatmap]" + d3.select(this).attr("class") + ": " + d);
        return color(d) || "red";
      });
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

  chart.url = function(value) {
    if (!arguments.length) return url;
    url = value;
    return chart;
  };

  return chart;
};
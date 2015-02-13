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

  var width = 415,    // 756
      height = 320,   // 600
      title = "Heatmap",
      cfrp = undefined,
      uid = 0,
      url = "assets/bordeaux1.svg",
      svg;

  var capacity_per_diem = {
    'parterre': 400,  // 773,
    'première loge': 100, // 500,
    'autre': 100 }; // 2697 };


  function chart() {
    var namespace = "heatmap_" + uid++;

    var days = cfrp.dimension(function(d) { return d.date; });

    var receiptsBySection = cfrp.section
      .group()
      .reduceSum(function(d) { return d.sold; });

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
          data_ndx = d3.map(data, function(d) { return d.key; }),
          day_count = days.group().all().filter(function(d) { return d.value > 0}).length;

      var color = d3.scale.linear()
        .range(["#ef8a62","#67a9cf"]);

      var angle = d3.scale.linear()
        .range([0, 2 * Math.PI]);

      var marks = root.selectAll(".mdat")
        .datum(function() {
          // Join data on the SVG class instead of D3 default
          var k = elem_section(this);
          return data_ndx.get(k);
        });

      var arc = d3.svg.arc()
          .innerRadius(0)
          .outerRadius(25)
          .startAngle(0);

      marks.attr("d", arc.endAngle(function(d) {
//        angle.domain([0, capacity_per_diem[d.key] * day_count]);
//        return angle(d.value);
        return Math.PI * 2.0;
      }))
        .attr("fill", function(d) {
          color.domain([0, capacity_per_diem[d.key] * day_count]);
          return color(d.value);
        });
    }

    function elem_section(elem) { 
      var classes = d3.select(elem).attr("class").split(" ");
      classes = classes.filter(function(d) { return d !== "mdat"; });
      var k = classes[0].replace("_", " ");
      return k;
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
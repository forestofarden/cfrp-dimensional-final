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

  var width = 680,    // 756
      height = 544,   // 600
      title = "Theater Heatmap",
      cfrp = undefined,
      uid = 0,
      url = "assets/bordeaux1.svg",
      svg;

  var css = " \
    circle.mdat { \
      fill-opacity: 0.9; \
    } \
    circle.mdat.selected { \
      stroke: blue; \
      stroke-width: 2px; \
    }";

  var capacity_per_diem = {  // TODO.  estimates based on first 3 seasons
    'parterre': 650,
    'première loge': 150,
    'autre': 550 };


  function chart() {
    var namespace = "heatmap_" + uid++;

    var section = cfrp.dimension(function(d) { return d.section; });

    var receiptsBySection = section.group()
          .reduceSum(function(d) { return d.sold; });

    var selected;

    var root = d3.select(this)
        .classed("heatmap", true);

    root.append('defs')
      .append('style')
      .attr('type','text/css')
      .text(css);

    d3.xml(url, "image/svg+xml", function(error, fragment) {
      fragment = fragment.getElementsByTagName("svg")[0];
      root.node().appendChild(fragment);
      root.select("svg")
        .attr("width", width)
        .attr("height", height);

      update();
      cfrp.on("change." + namespace, update);
      cfrp.on("dispose." + namespace, dispose);
    });

    var recursive = false;
    function update() {
      if (recursive) { return; }

      var data = receiptsBySection.top(Infinity).map(function(d) { return { key : d.key, value : d.value }; }),
          data_ndx = d3.map(data, function(d) { return d.key; });

      var color = d3.scale.linear()
        .range(["#fee0d2","#de2d26"]);

      var marks = root.selectAll(".mdat")
        .datum(function() {
          // Join data on the SVG class instead of D3 default
          var k = elem_section(this);
          return data_ndx.get(k);
        });

      marks.attr("fill", function(d) {
        return "red";
      });

      marks.on("click", function(p) {
        if (selected === p.key) { selected = null; }
        else { selected = p.key; }

        section.filter(selected);

        recursive = true;
        cfrp.change();
        recursive = false;

        draw_selection(marks);
      });
    }

    function draw_selection(marks) {
      marks.classed("selected", function(p) {
        return selected === p.key;
      });
    }

    function dispose() {
      console.log("detaching dimensions for heatmap " + namespace);
      cfrp.on("." + namespace, null);
      section.groupAll();
      section.dispose();
      cfrp.change();
    }

    function elem_section(elem) { 
      var classes = d3.select(elem).attr("class").split(" ");
      classes = classes.filter(function(d) { return d !== "mdat"; });
      var k = classes[0].replace("_", " ");
      return k;
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

  chart.url = function(value) {
    if (!arguments.length) return url;
    url = value;
    return chart;
  };

  return chart;
};
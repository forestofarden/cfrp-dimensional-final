// component visualization

mdat.visualization.pivot = function() {
  var weekday = d3.time.format("%w");

  var width = 400,
      height = 4500,
      title = "Pivot",
      rows = [ function(d) { 
          var playbill = cfrp.playbill_idx[d.date],
              author = playbill ? playbill[0].author : null;
          return author || "n/a";
        }, function(d) { 
          var playbill = cfrp.playbill_idx[d.date],
              title = playbill ? playbill[0].title : null;
          return title || "n/a";
        } ],
      cols = [ ],
      uid = 0;

  var cfrp = undefined;

  var commasFormatter = d3.format(",.0f");

  var css = "\
    .pivot .node.root { \
      display: none; \
    } \
    .pivot .node circle { \
      fill: #fff; \
      stroke: steelblue; \
      stroke-width: 1.5px; \
    } \
    .pivot .node { \
      font: 10px sans-serif; \
    } \
    .pivot .link { \
      fill: none; \
      stroke: #ccc; \
      stroke-width: 1.5px; \
    }";

  function chart() {
    var namespace = "pivot_" + uid++;

    var tree = d3.layout.tree()
      .size([height, width]);

    var diagonal = d3.svg.diagonal()
      .target(function(d) { return { x: d.target.x, y: d.source.y + 10 }; })
      .projection(function(d) { return [d.y, d.x]; });

    var root = d3.select(this)
        .classed("pivot", true);

    var defs = root.append('defs');

    defs.append('style')
        .attr('type','text/css')
        .text(css);

    var records = cfrp.dimension(function(d) {
          var col_vals = cols.map(function(f) { return f(d); }),
              row_vals = rows.map(function(f) { return f(d); });
          return row_vals.concat(col_vals);
        }),
        values = records.group().reduceSum(function(d) { return d.price * d.sold; });

    update();

    cfrp.on("change." + namespace, update);
    cfrp.on("dispose." + namespace, dispose);

    function records2tree(data) {
      var depth = d3.max(data, function(d) { return d.key.length; }),
          nester = d3.nest();

      d3.range(0,depth).forEach(function(i) {
        nester.key(function(d) { return d.key[i]; });
      });

      data = nester.rollup(function(d) { return d[0].value; })
                   .entries(data);
      data = { root: true, children: data.map(function(d) { return recurse(d); } )};

      return data;

      function recurse(data) {
        if (Array.isArray(data.values)) { 
          return {
            name: data.key,
            children: data.values.map(function(d) { return recurse(d); })
          };
        } else { 
          return {
            name: data.key,
            value: data.values
          };
        }
      }
    }

    function update() {
      var data = records2tree( records.group().all() ),
          nodes = tree.nodes(data);

      var links = tree.links(nodes);
      // only include the bracketing links
      links = links.filter(function(d) {
        var first_child = d.source.children[0] == d.target,
            last_child = d.source.children[d.source.children.length-1] == d.target,
            only_child = d.source.children.length == 1,
            from_root = d.source.root;
        return !from_root && !only_child && (first_child || last_child);
      });

      var link = root.selectAll("pathlink")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", function(d) { 
          return "M " + d.source.y + " " + d.source.x + " L " + (d.source.y + 10) + " " + d.target.x;
        });
 
      var node = root.selectAll("g.node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .classed("root", function(d) { return d.root; })
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
 
 /*
      // Add the dot at every node
      node.append("circle")
        .attr("r", 1.5);
 */        
 
      // place the name atribute left or right depending if children
      node.append("text")
        .attr("dx", -8)
        .attr("dy", 3)
        .attr("text-anchor", "end")
        .text(function(d) { return d.name + (d.value ? " : " + d.value : ""); })
    }

    function dispose() {
      console.log("detaching dimension for pivot");
      cfrp.on("." + namespace, null);
      records.groupAll();
      records.dispose();
    }

    console.log("done setting up " + namespace);

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

  chart.rows = function(value) {
    if (!arguments.length) return rows;
    rows = value;
    return chart;
  }

  chart.cols = function(value) {
    if (!arguments.length) return cols;
    cols = value;
    return chart;
  }

  return chart;
};

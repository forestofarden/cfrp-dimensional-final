// component visualization

mdat.visualization.author_title = function() {
  var width = 400,
      height = 400,
      title = "Author 1",
      uid = 0;

  var cfrp = undefined;

  var commasFormatter = d3.format(",.0f");    

  var css = "\
    .author_title text { \
      font: 10px sans-serif; \
      stroke: none; \
      fill : white; \
    } \
    .author_title .node { \
      opacity: 0.02; \
    } \
    .author_title .node.author { \
      opacity: 1; \
    } \
    .author_title .node.author circle { \
      fill: orange; \
      stroke: none; \
    } \
    .author_title .node.author.selected circle { \
      fill: red; \
    }";

  function chart() {
    var namespace = "author_title_" + uid++;

    var sel_author = null;

    var bubble = d3.layout.pack()
      .sort(null)
      .size([width, height])
      .padding(1.5)
      .value(function(d) { return d.value; });

    var root = d3.select(this)
      .classed("author_title", true);

    var defs = root.append('defs');

    defs.append('style')
        .attr('type','text/css')
        .text(css);

    defs.append("clipPath")
        .attr("id", namespace + "_clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    var author = cfrp.dimension(function(d) {
      // TODO.  NB this only captures the first play's author in a multiple billing
      var playbill = cfrp.playbill_idx[d.date],
          author = playbill ? playbill[0].author : null;
      return author || "n/a";
    });
    var receiptsByAuthor = author.group().reduceSum(function(d) { return d.price * d.sold; });

    update();

    cfrp.on("change." + namespace, update);
    cfrp.on("dispose." + namespace, dispose);

    var recursive = false;
    function update() {
      var data = receiptsByAuthor.top(Infinity);

      var nodes = bubble.nodes({
        key: "_root", 
        children: data.filter(function(d) { return d.value > 0.1; })
      });

      var g = root.selectAll(".node")
        .data(nodes, function(d) { return d.key; });

      g.exit().remove();

      var enter = g.enter().append("g")
        .attr("class", function(d) { return d.children ? "node" : "node author"; })
        .on("click", function(d) { 
          console.log('click ' + d.key);
          if (d.key == "_root" || sel_author === d.key) { 
            sel_author = null; 
            author.filterAll();
          } else { 
            sel_author = d.key; 
            author.filterExact(sel_author); 
          }
          recursive = true;
          cfrp.change();
          recursive = false;
        });
      enter.append("circle")
        .append("title");
      enter.append("text")
        .attr("text-anchor", "middle");

      g.classed("selected", function(d) { return sel_author === d.key; })
       .transition()
       .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      g.select("circle")
        .transition()
        .attr("r", function(d) { return d.r; });
      g.select("title")
        .text(function(d) { return d.key + " : L. " + commasFormatter(d.value); });
      g.select("text")
        .text(function(d) { 
          return (d.key && d.r > 20) ? (d.key.split(" ", 1)[0]) : ""; });        
    }

    function dispose() {
      console.log("detaching dimension for author & title");
      cfrp.on("." + namespace, null);
      author.groupAll();
      author.dispose();
      cfrp.change();
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

  return chart;
};

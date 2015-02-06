//
// browse data relating to a specific day's performances and sales
//

mdat.visualization.registers = function() {

  var width = 500,
      height = 500,
      title = "Registers",
      cfrp = undefined,
      uid = 0;

  var dateFormat = d3.time.format("%Y-%m-%d");

  function image_url(image_file) {
    var re = /M119_02_R(\d+)_(\d+)([rv])?.jpg/;
    if (image_file) {
      image_file = image_file.replace(re, "http://hyperstudio.mit.edu/cfrp/flip_books/R$1/M1119_02_R$1/M1119_02_R$1_$2.jpg");
    }
    return image_file;
  }

  function chart() {
    var namespace = "registers_" + uid++;

    var root = d3.select(this)
        .classed("registers", true);

    var background = root.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    var dateElm = root.append("text")
        .attr("class", "date")
        .attr("x", 100);

    function move(i) {
      cfrp.sel_date = d3.time.day.offset(cfrp.sel_date, i);
      update();
    }

    // Allow the arrow keys to change the displayed page.
    window.focus();
    d3.select(window).on("keydown", function() {
      switch (d3.event.keyCode) {
        case 37: move(-1); break;
        case 39: move(1); break;
      }
    });

    update();

    cfrp.on("change." + namespace, update);

    function update() {

      var date = cfrp.sel_date,
          info = cfrp.playbill_idx[date] || [];

      root.select(".date")
          .text(dateFormat(date));

      var performance = root.selectAll(".performance")
        .data(info);

      performance.exit().remove();

      performance.enter().append("g")
         .attr("class", "performance")
         .attr("transform", function(d, i) { return "translate(" + (300 * i) + ",0)"; })
         .html(function(d) { return '<a xlink:href="' + image_url(d.image_file) + '" xlink:show="new">' +
         '<g><circle cx="15" cy="15" r="5"/><rect x="5" y="5" width="20" height="20" fill="none" stroke="black"/><g></a>'; });

      function sel_attrs(d) {
        var entries = d3.entries(d);
        entries = entries.filter(function(d) { return d.value && !(d.key === 'date'); });
        return entries;
      }

      var attrs = performance.selectAll(".attr")
        .data(function(d) { return sel_attrs(d); });

      attrs.exit().remove();

      var attrEnt = attrs.enter().append("g")
        .attr("class", "attr");

      attrEnt.append("text")
        .attr("class", "label");

      attrEnt.append("text")
        .attr("class", "value");

      attrs.select(".label")
           .attr("y", function(d, i) { return i * 15 + 20; })
           .attr("x", 90)
           .attr("text-anchor", "end")
           .attr("font-style", "italic")
           .text(function(d) { return d.key; });

      attrs.select(".value")
           .attr("y", function(d, i) { return i * 15 + 20; })
           .attr("x", 100)
           .attr("font-style", "bold")
           .text(function(d) { return d.value; });
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

  return chart;
 };
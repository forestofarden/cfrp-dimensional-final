//
// browse data relating to a specific day's performances and sales
//

mdat.visualization.registers = function() {

  var width = 500,
      height = 200,
      title = "Registers",
      cfrp = undefined,
      uid = 0;

  var css = " \
    text { \
      font: 10px sans-serif; \
    }";

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

    root.append('defs')
      .append('style')
      .attr('type','text/css')
      .text(css);

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
         .attr("transform", function(d, i) { return "translate(" + (370 * i) + ",0)"; })
         .html(function(d) { return '<a xlink:href="' + image_url(d.image_file) + '" xlink:show="new">' +
//         '<g><circle cx="15" cy="15" r="5"/><rect x="5" y="5" width="20" height="20" fill="none" stroke="black"/><g></a>'; 
           '<g transform="scale(0.07)"><circle cx="255.811" cy="285.309" r="75.217"/>' +
  '<path d="M477,137H352.718L349,108c0-16.568-13.432-30-30-30H191c-16.568,0-30,13.432-30,30l-3.718,29H34' +
   ' c-11.046,0-20,8.454-20,19.5v258c0,11.046,8.954,20.5,20,20.5h443c11.046,0,20-9.454,20-20.5v-258C497,145.454,488.046,137,477,137' +
   ' z M255.595,408.562c-67.928,0-122.994-55.066-122.994-122.993c0-67.928,55.066-122.994,122.994-122.994' +
   ' c67.928,0,122.994,55.066,122.994,122.994C378.589,353.495,323.523,408.562,255.595,408.562z M474,190H369v-31h105V190z"/></g>'; });

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
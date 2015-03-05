//
// browse data relating to a specific day's performances and sales
//

mdat.visualization.register = function() {

  // N.B. source images are 1655 × 2255

  var width = 375,
      height = 512,
      loupeRadius = width * 0.475,
      loupeMagnification = 1.6,
      title = "Register",
      cfrp = undefined,
      uid = 0;

  var css = " \
    text { \
      font: 10px sans-serif; \
    } \
    .register .background { \
      fill: lightgrey;  \
    } \
    .register .loupe:not(.active) { \
      visibility: hidden; \
    }";

  var format = d3.time.format("%a %e %b %Y");

  function image_url(image_file) {
    var re = /M119_02_R(\d+)_(\d+)([rv])?.jpg/;
    if (image_file) {
      image_file = image_file.replace(re, "http://hyperstudio.mit.edu/cfrp/flip_books/R$1/M1119_02_R$1/M1119_02_R$1_$2.jpg");
    }
    return image_file;
  }

  function chart() {
    var namespace = "register_" + uid++;

    var root = d3.select(this)
          .classed("register", true);

    root.append('defs')
      .append('style')
      .attr('type','text/css')
      .text(css);

    var loupeClip = root.append("clipPath")
        .attr("id", namespace + "_clip")
      .append("circle")
        .attr("r", loupeRadius);

    var date = cfrp.dimension(function(d) { return d.date; });

    update();

    cfrp.on("change." + namespace, update);

    function update() {

      var sel_registers = date.bottom(1);

      // TODO.  SVG <image> 'onload' events seem quite unreliable, so for now we use the low-tech approach:
      //        render a loading icon which SVG's painter model then covers up with the image

      var page = root.selectAll(".page")
           .data(sel_registers, function(d) { return d.date; });

      page.exit().remove();

      var g = page.enter().append("g")
          .attr("class", "page");

      g.append("text")
          .text(function(d) { return format(d.date); });

      var image = g.append("image")
          .attr("class", "main")
          .attr("width", width)
          .attr("height", height)
          .on("mousemove", loupeMove);

      var loupe = g.append("g")
          .attr("clip-path", "url(#" + namespace + "_clip)")
       .append("image")
          .attr("class", "loupe")
          .attr("width", width * loupeMagnification)
          .attr("height", height * loupeMagnification)
       .on("mouseout", function() { console.log("exiting"); d3.select(this).classed("active", false); })
       .on("mousemove", loupeMove);

      page.selectAll("image").attr("xlink:href", function(d) {
        var playbill   = cfrp.playbill_idx[d.date],
            image_file = playbill[0].image_file;
        return image_url(image_file);
      });

      function loupeMove() {
        var pos = d3.mouse(image[0][0]),
            loupePos = [ pos[0] * (1 - loupeMagnification), pos[1] * (1 - loupeMagnification) ];
        loupeClip.attr("cx", pos[0])
                 .attr("cy", pos[1]);
        g.select(".loupe")
                 .classed("active", true)
                 .attr("transform", "translate(" + loupePos.join(',') + ")");
      }
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
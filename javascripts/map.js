// Put map code here

// Map zooming code from http://bl.ocks.org/mbostock/9656675

var width = 960,
    height = 500,
    active = d3.select(null);

var projection = d3.geo.albersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);

var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select(".map").append("svg")
    .attr("width", width)
    .attr("height", height)
    .on("click", stopped, true);

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

var g = svg.append("g");

svg
    .call(zoom) // delete this line to disable free zooming
    .call(zoom.event);

var data = d3.range(100).map(function() {
  var latitude = Math.random() + 33;
  var longitude = (-1 * Math.random()) - 84;
  var name = Math.random().toString(36).substring(7);
  return [
    latitude,
    longitude,
    name
  ];
});

// map gets drawn here
d3.json("data/us.json", function(error, us) {
  g.selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
      .attr("d", path)
      .attr("class", "feature")
      .on("click", clicked);

  g.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "mesh")
      .attr("d", path);

  // read in data from CSV here
  // d3.csv("data/dummy_data.csv", function(error, data) {

  // });

    g.selectAll("circle")
      .data(data)
    .enter().append("circle")
      .attr("cx", function(d) {
        return projection([d[1], d[0]])[0];
      })
      .attr("cy", function(d) {
        return projection([d[1], d[0]])[1];
      })
      .attr("r", 1)
      .attr("d", data[0])
      .style("fill", "red")
      .on("mouseover", brewMouseover)
      .on("mouseout", brewMouseout)
      .on("mousemove", brewMousemove);

});

// Helper functions for map
function clicked(d) {
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  svg.transition()
      .duration(750)
      .call(zoom.translate(translate).scale(scale).event);
}

function reset() {
  active.classed("active", false);
  active = d3.select(null);

  svg.transition()
      .duration(750)
      .call(zoom.translate([0, 0]).scale(1).event);
}

function zoomed() {
  g.style("stroke-width", 1.5 / d3.event.scale + "px");
  g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

var div = d3.select(".map").append("div")
    .attr("class", "brewDiv")
    .style("opacity", 0)

function brewMouseover() {
  div
    .transition()
    .duration(500)
    .style("opacity", 1);
}

function brewMousemove(d) {
  div
    .style("left", (d3.event.pageX) + "px")
    .style("top", (d3.event.pageY) + "px")
    .text(d[2])
}
function brewMouseout() {
  div
    .transition()
    .duration(500)
    .style("opacity", 0)
}
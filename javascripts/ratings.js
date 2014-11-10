// Rating chart code

var binsize = 5;
var minbin = 0;
var maxbin = 100;
var numbins = (maxbin - minbin) / binsize;
var binmargin = .2;

var margin = {top: 10, right: 10, bottom: 100, left: 40},
    margin2 = {top: 430, right: 10, bottom: 20, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    height2 = 500 - margin2.top - margin2.bottom;

var x = d3.scale.linear().range([0, width]),
    x2 = d3.scale.linear().range([0, width]),
    y = d3.scale.linear().range([height, 0])
    y2 = d3.scale.linear().range([height2, 0]);

var xAxis = d3.svg.axis().scale(x).orient("bottom"),
    xAxis2 = d3.svg.axis().scale(x2).orient("bottom");

var brush = d3.svg.brush()
    .x(x2)
    .on("brush", brushed);

var svg = d3.select(".ratings").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", width)
    .attr("height", height);

var focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

d3.csv("https://dl.dropboxusercontent.com/u/40727734/sp500.csv", function(error, data) {

  var values = data.map(function(d) { return d.rating; });

  x.domain([0, 100]);
  x2.domain(x.domain());

  var hist = d3.layout.histogram()
    .bins(numbins)
    (values);

  y.domain([0, d3.max(hist, function(d) { return d.y; })]);
  y2.domain([0, d3.max(hist, function(d) { return d.y; })]);

  var bar = focus.selectAll(".bar")
    .data(hist)
  .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d, i) { 
      return "translate(" + x(i * binsize + minbin) + "," + y(d.y) + ")"; 
    });

  bar.append("rect")
      .attr("x", 1)
      .attr("width", x(binsize - 2 * binmargin))
      .attr("height", function(d) { return height - y(d.y); });

  focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  var bar2 = context.selectAll(".bar")
    .data(hist)
  .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d, i) { 
      return "translate(" + x2(i * binsize + minbin) + "," + y2(d.y) + ")"; 
    });

  bar2.append("rect")
      .attr("x", 1)
      .attr("width", x2(binsize - 2 * binmargin))
      .attr("height", function(d) { return height2 - y2(d.y); });

  context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis);

  context.append("g")
      .attr("class", "x brush")
      .call(brush)
    .selectAll("rect")
      .attr("y", -6)
      .attr("height", height2 + 7);
});

function brushed() {
  x.domain(brush.empty() ? x2.domain() : brush.extent());
  focus.selectAll(".bar")
        .attr("transform", function(d, i) { 
          return "translate(" + x(i * binsize + minbin) + "," + y(d.y) + ")"; 
        });
  // TODO: change width of bars on focus
  // Can't seem to get this right, but since we'll be adapting it to the map
  // there's not much of a point.
  focus.select(".x.axis").call(xAxis);
}

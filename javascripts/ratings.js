// Rating chart code

var binsize = 2;
var minbin = 66;
var maxbin = 100;
var numbins = (maxbin - minbin) / binsize;
var binmargin = 2;

var margin = {top: 30, right: 10, bottom: 20, left: 40},
    ratingWidth = 960 - margin.left - margin.right,
    ratingHeight = 150 - margin.top - margin.bottom;

var x = d3.scale.linear().range([0, ratingWidth]),
    y = d3.scale.linear().range([ratingHeight, 0]);

var xAxis = d3.svg.axis().scale(x).orient("bottom");

var brush = d3.svg.brush()
    .x(x)
    .on("brush", brushed);

var svg = d3.select(".ratings").append("svg")
    .attr("width", ratingWidth + margin.left + margin.right)
    .attr("ratingHeight", ratingHeight + margin.top + margin.bottom);

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("width", ratingWidth)
    .attr("height", ratingHeight);

var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.csv("data/ratings.csv", function(error, data) {

  var values = data.filter(function(d) { 
    if (d.breweryRating) {
      return d.breweryRating;
    }
  }).map(function(d) { return +d.breweryRating; });

  x.domain([minbin, maxbin]);

  var hist = d3.layout.histogram()
    .range(x.domain())
    .bins(numbins)
    (values);

  y.domain([0, d3.max(hist, function(d) { return d.y; })]);

  var barWidth = (x.range()[1] - x.range()[0]) / hist.length - binmargin;

  var bar = context.selectAll(".bar")
    .data(hist)
  .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d, i) { 
      return "translate(" + x(i * binsize + minbin) + "," + y(d.y) + ")"; 
    });

  bar.append("rect")
      .attr("x", 1)
      .attr("width", barWidth)
      .attr("height", function(d) { return ratingHeight - y(d.y); });

  bar.append("text")
      .attr("dy", ".75em")
      .attr("y", -10)
      .attr("x", barWidth / 2)
      .attr("text-anchor", "middle")
      .text(function(d) { return d.y; });

  context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + ratingHeight + ")")
      .call(xAxis);

  context.append("g")
      .attr("class", "x brush")
      .call(brush)
    .selectAll("rect")
      .attr("y", -6)
      .attr("height", ratingHeight + 7);
});

function brushed() {
  d3.selectAll("circle.brewery").attr("visibility", function(d) {
    var brewery = breweryRatingDict[d.id];
    var rating = +brewery.breweryRating;
    this.classList.remove("hiddenByRating");
    if (brush.empty()) {
      if (this.classList.contains("hiddenByYear")) {
        return this.getAttribute("visibility");
      }
      else {
        return "visible";
      }
    }
    else {
      if (this.classList.contains("hiddenByYear") && this.getAttribute("visibility") == "hidden") {
        return this.getAttribute("visibility");
      }
      else if (rating >= brush.extent()[0] && rating <= brush.extent()[1]) {
        return "visible";
      }
      else {
        this.classList.add("hiddenByRating");
        return "hidden";
      }
    }
  });
}

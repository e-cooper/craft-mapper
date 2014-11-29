// Put map code here

// Map zooming code from http://bl.ocks.org/mbostock/9656675

// define any global vars
var width = 960,
    height = 500,
    active = d3.select(null),
    brewViewWidth = 300,
    brewViewHeight = 500,
    beerDict = {},
    breweryRatingDict = {};

var projection = d3.geo.albersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);

var zoom = d3.behavior.zoom()
    .translate([0, 0])
    .scale(1)
    .scaleExtent([1, 20])
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

var div = d3.select(".map").append("div")
  .attr("class", "brewDiv")
  .style("opacity", 0)

var breweryDiv = d3.select(".brewery-view").append("div")
  .attr("class", "breweryDiv")
  .style("opacity", 0)

// map gets drawn here
function drawMap() {
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
    d3.csv("data/data.csv", function(error, data) {

      g.selectAll("circle")
        .data(data)
      .enter().append("circle")
        .attr("cx", function(d) {
          longitude = parseFloat(d.longitude);
          latitude = parseFloat(d.latitude);
          if (!isNaN(longitude) && !isNaN(latitude)) {
              return projection([d.longitude, d.latitude])[0];
          }
        })
        .attr("cy", function(d) {
          longitude = parseFloat(d.longitude);
          latitude = parseFloat(d.latitude);
          if (!isNaN(longitude) && !isNaN(latitude)) {
              return projection([d.longitude, d.latitude])[1];
          }
        })
        .attr("r", 1)
        .attr("d", data)
        .style("fill", "red")
        .attr("opacity", .5)
        .attr("class", "dataPoint")
        .on("mouseover", brewMouseover)
        .on("mouseout", brewMouseout)
        .on("click", brewClick)
        .on("mousemove", brewMousemove);

    });

  });
}

// Load in the beer data using papaparse
function loadBeerData() {
  var beer = Papa.parse("data/beer.csv", {
    header: true,
    download: true,
    complete: function(results) {
      beerCallback(results.data)
    }
  });
}

// add the beers for each brewery to the beerDict dictionary
// for access later
function beerCallback(data) {
  for(var i = 0; i < data.length; i++) {
    var exists = beerDict[data[i].breweryID]
    var key = data[i].breweryID
    if (exists == null) {
      beerDict[key] = new Array()
    }
    beerDict[key].push(data[i])
  }
}

// Load in the brewery rating data
function loadBreweryRatingData() {
  var brewRating = Papa.parse("data/ratings.csv", {
    header: true,
    download: true,
    complete: function(results) {
      breweryRatingCallback(results.data)
    }
  });
}

function breweryRatingCallback(data) {
  for(var i = 0; i < data.length; i++) {
    breweryRatingDict[data[i].breweryID] = data[i]
  }
}

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

function zoomed() {
  g.style("stroke-width", 1.5 / d3.event.scale + "px");
  g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  var radius = 1 / d3.event.scale
  // scale the radius of the points but prevent from being too small/big
  radius = radius < .4 ? .4 : radius
  radius = radius <= 1 ? radius : 1
  g.selectAll(".dataPoint")
    .attr("r", radius)
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

function reset() {
  active.classed("active", false);
  active = d3.select(null);

  breweryDiv
    .style("opacity", 0)

  svg.transition()
      .duration(750)
      .call(zoom.translate([0, 0]).scale(1).event);
}

function brewMouseover() {
  div
    .transition()
    .duration(500)
    .style("opacity", 1)

  // breweryDiv
  //   .style("opacity", 1)
}

function brewMousemove(d) {
  showBrewDoD(d)
}

function brewMouseout() {
  div
    .transition()
    .duration(500)
    .style("opacity", 0)
}

function brewClick(d) {
  breweryDiv
    .style("opacity", 1)
  showBrewData(d)
}

function showBrewDoD(d) {
  div
  .style("left", (d3.event.pageX) + "px")
  .style("top", (d3.event.pageY) + "px")
  .text(d.name)
}

function showBrewData(d) {
  var breweryRating = breweryRatingDict[d.id]
  var overallRating = breweryRating.breweryRating

  breweryDiv
    .text("")
    .append("p")
      .attr("class", "breweryName")
      .text(d.name)

  if(overallRating != "") {
    breweryDiv
      .append("div")
        .attr("class", "breweryStats")
        .append("div")
          .attr("class", "breweryRating")
          .append("p")
            .text("Rating")
          .append("p")
            .attr("class", "bRNumber")
            .text(overallRating)

    d3.select(".breweryStats")
      .append("div")
        .attr("class", "breweryBeerRating")
        .append("p")
          .text("Beer")
        .append("p")
          .attr("class", "bRNumber")
          .text(breweryRating.beerRating)
  }


  breweryDiv
    .append("p")
      .attr("class", "breweryInfo")
      .text(breweryRating.beerRating)
    .append("p")
      .attr("class", "breweryInfo")
      .text(d.yearOpened)
    .append("p")
      .attr("class", "breweryInfo")
      .text(d.website)
    .append("p")
      .attr("class", "breweryInfo")
      .text(d.description)

    var beers = beerDict[d.id]
    beers.forEach(function(entry) {
      breweryDiv.append("p")
        .text(entry.beerName + "[" + entry.baRating + "]")
    });
}

//timeline filter
$(function() {
  $( "#slider-range" ).slider({
    range: true,
    min: 1786,
    max: 2014,
    values: [ 1786, 2014 ],
    slide: function( event, ui ) {
      $( "#year" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] )
      d3.selectAll("circle").attr("visibility", function(d) {
        this.classList.remove("hiddenByYear");
        if (d.yearOpened || ui.values[1] != 2014) {
          var yearInBounds = d.yearOpened >= ui.values[0] && d.yearOpened <= ui.values[1];
          if (this.classList.contains("hiddenByRating") && this.getAttribute("visibility") == "hidden") {
            return this.getAttribute("visibility");
          }
          else if (yearInBounds) {
            return "visible";
          }
          else {
            this.classList.add("hiddenByYear");
            return "hidden";
          }
        }
      });
    }
  });
  $( "#year" ).val( $( "#slider-range" ).slider( "values", 0 ) +
    " - " + $( "#slider-range" ).slider( "values", 1 ) );
});

// put neccessary functions to setup project here

loadBeerData()
loadBreweryRatingData()
drawMap()
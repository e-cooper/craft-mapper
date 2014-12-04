// Put map code here

// Map zooming code from http://bl.ocks.org/mbostock/9656675

// define any global vars
var width = 800,
    height = 500,
    active = d3.select(null),
    activeClick = d3.select(null),
    brewViewWidth = 300,
    brewViewHeight = 500,
    beerDict = {},
    breweryRatingDict = {},
    breweriesDict = {};
    beerStyles = [],
    beerRatingsDict = {},
    beerRatingsHistogram = {},
    beerInformationDict = {}
    sideDiv = null;

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
        .attr("r", 3)
        .attr("d", data)
        .style("fill", "blue")
        .attr("opacity", .5)
        .attr("class", "dataPoint brewery")
        .attr("id", function(d) {
          return 'name' + d.id
        })
        .on("mouseover", brewMouseover)
        .on("mouseout", brewMouseout)
        .on("click", brewClick)
        .on("mousemove", brewMousemove);
    });

    //read in capital data from CSV here
     d3.csv("data/cities.csv", function(error, data) {
        g.selectAll("text")
          .data(data)
          .enter()
          .append("svg:text")
          .text(function(d){
            return d.capital;
          })
          .attr('x', function(d){
            longitude = parseFloat(d.longitude);
          latitude = parseFloat(d.latitude);
          if (!isNaN(longitude) && !isNaN(latitude)) {
              return projection([d.longitude, d.latitude])[0];
          }
          })
          .attr('y', function(d){
            longitude = parseFloat(d.longitude);
          latitude = parseFloat(d.latitude);
          if (!isNaN(longitude) && !isNaN(latitude)) {
              return projection([d.longitude, d.latitude])[1];
          }
          })
          .attr("text-anchor","middle")
          .attr("font-size","2pt")
          .style("fill","#a6a6a6")
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
  // loop for getting the beer information
  for(var i = 0; i < data.length; i++) {
    // logic for regular beer information
    var exists = beerDict[data[i].breweryID]
    var key = data[i].breweryID
    if (exists == null) {
      beerDict[key] = new Array()
    }
    beerDict[key].push(data[i])

    // logic for style information
    if (data[i].Style != "") {
      beerStyles.push(data[i].Style)
    }

    // logic for beer rating
    var rating = data[i].baRating
    rating = parseInt(rating)

    if (!isNaN(rating)) {
      var ratingExists = beerRatingsDict[rating]
      if (ratingExists == null) {
        beerRatingsDict[rating] = new Array()
      }
      beerRatingsDict[rating].push(data[i])
    }
  }
  beerStyles = _.uniq(beerStyles)
  setupBeerRatingsHistogram()
}

function setupBeerRatingsHistogram() {
  var ratingsKeys = Object.keys(beerRatingsDict)
  for(var i = 0; i < ratingsKeys.length; i++) {
    var key = ratingsKeys[i]
    var size = beerRatingsDict[key].length
    beerRatingsHistogram[key] = size
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
    breweriesDict[data[i].name] = data[i].breweryID
  }
  setupAutocomplete()
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
  var radius = 2 / d3.event.scale
  // scale the radius of the points but prevent from being too small/big
  radius = radius < .2 ? .2 : radius
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

  activeClick.style("fill", "blue");
  activeClick = d3.select(null);

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
  if (activeClick.node() === this) {
    return reset();
  }
  activeClick.style("fill", "blue")
  activeClick = d3.select(this).style("fill", "red");

  breweryDiv
    .style("opacity", 1)
  showBrewData(d)
  handleTransform(d)
}

function searchClick(node, data) {
  if (activeClick.node() === node) {
    return reset();
  }
  activeClick.style("fill", "blue")
  activeClick = d3.select(node).style("fill", "red");

  breweryDiv
    .style("opacity", 1)
  showBrewData(data)
  handleTransform(data)
}

function handleTransform(d) {

  active.classed("active", false);
  active = d3.select(null);

  longitude = parseFloat(d.longitude);
  latitude = parseFloat(d.latitude);
  var cy, cx;
  if (!isNaN(longitude) && !isNaN(latitude)) {
    cx = projection([d.longitude, d.latitude])[0];
  }

  if (!isNaN(longitude) && !isNaN(latitude)) {
    cy = projection([d.longitude, d.latitude])[1];
  }

  scale = .04 / Math.max(1 / width, 1 / height),
  translate = [width / 2 - scale * cx, height / 2 - scale * cy];

  // TODO make this dynamic based off of distance?
  svg.transition()
    .duration(5000)
    .call(zoom.translate(translate).scale(scale).event);
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

  breweryDiv
    .append("div")
      .attr("class", "breweryStats")

  if(overallRating != "") {
    d3.select(".breweryStats")
      .append("div")
        .attr("class", "breweryRating")
        .append("p")
          .text("OVERALL")
        .append("p")
          .attr("class", "bRNumber")
          .text(overallRating)

    d3.select(".breweryStats")
      .append("div")
        .attr("class", "breweryBeerRating")
        .append("p")
          .text("BEER")
        .append("p")
          .attr("class", "bRNumber")
          .text(breweryRating.beerRating)
  }

  d3.select(".breweryStats")
    .append("div")
      .attr("class", "yearTitle")
      .append("p")
        .text("EST.")
      .append("p")
        .attr("class", "bRNumber")
        .text(d.yearOpened)

    var beers = beerDict[d.id]
    var beerList = processBeers(beers)
    var length = beerList.length > 5 ? 5 : beerList.length

    breweryDiv.append("div")
      .attr("class", "totalBeerChart")
      .text("Beer Distribution")

    createBeerHistogram(beerList)

    breweryDiv.append("div")
      .attr("class", "beerRatingTitle")
      .text("Top Beers")

    for (var i = 0; i < length; i++) {
      var entry = beerList[i]
      breweryDiv.append("div")
        .attr("class", "beerRatingView beerRatingDiv-" + i )

      var height = entry.name.length > 28 ? 70 : 50;

      d3.select(".beerRatingDiv-" + i)
        .append("div")
          .attr("class", "left")
          .style("height", height + "px")
        .append("p")
          .attr("class", "topBeer")
          .text(entry.name)
        .append("p")
          .text(entry.style)

      d3.select(".beerRatingDiv-" + i)
        .append("div")
          .attr("class", "right")
        .append("p")
          .attr("class", "topBeer")
          .text(entry.rating)
        .append("p")
          .text(entry.beerRating)

      d3.select(".beerRatingDiv-" + i)
        .append("div")
          .attr("class", "clear")
    }
}

function createBeerHistogram(beerList) {
  var cWidth = 300,
    cHeight = 75,
    barPadding = 1,
    factor = 4;

  var dataset = createBeerHistogramData(beerList)
  var max = _.max(dataset, function(beer) { return beer.number; })
  max = max.number

  // Adjust scale if max height is going to be too high
  if (max * factor > (cHeight - 15)) {
    factor = (cHeight - 15) / max
  }

  var svg = d3.select('.totalBeerChart')
      .append("svg")
      .attr("width", cWidth)
      .attr("height", cHeight)

  // http://alignedleft.com/tutorials/d3/making-a-bar-chart
  svg.selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("x", function(d, i) {
      return i * (cWidth / dataset.length);
    })
    .attr("y", function(d) {
      return cHeight - (d.number * factor)
    })
    .attr("width", cWidth / dataset.length - barPadding)
    .attr("height", function(d){
      return d.number * factor;
    })
    .on("mouseover", sideMouseover)
    .on("mousemove", sideMousemove)
    .on("mouseout", sideMouseout);

  var h = cHeight / dataset.length - barPadding;

  svg.selectAll("text")
    .data(dataset)
    .enter()
    .append("text")
    .text(function(d) {
      return d.number
    })
    .attr("x", function(d, i) {
      return i * (cWidth / dataset.length) + 14
    })
    .attr("y", function(d) {
      return cHeight - (d.number * factor) - 2
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "12px");

  sideDiv = d3.select(".totalBeerChart")
    .append("div")
    .attr("class", "sideDiv")
    .style("opacity", 0)
}

function sideMouseover() {
  sideDiv
    .transition()
    .duration(500)
    .style("opacity", 1)
}

function sideMousemove(d) {
  showSideDoD(d)
}

function sideMouseout() {
  sideDiv
    .transition()
    .duration(500)
    .style("opacity", 0)
}

function showSideDoD(d) {
  sideDiv
    .style("left", (d3.event.pageX) + "px")
    .style("top", (d3.event.pageY) + "px")
    .text(d.level)
}

// return an array with the number of points at each rating
function createBeerHistogramData(beerList) {
  var data = {"world-class": 0, "outstanding": 0,
    "very good": 0, "good": 0, "okay": 0,
    "poor": 0, "awful": 0}
  for (var i = 0; i < beerList.length; i++) {
    var entry = beerList[i]
    if(entry.beerRating != "") {
      data[entry.beerRating] += 1
    }
  }

  var order = {"world-class": 7, "outstanding": 6,
    "very good": 5, "good": 4, "okay": 3,
    "poor": 2, "awful": 1}

  var bigList = []
  var keys = Object.keys(data)
  for (var i = 0; i < keys.length; i++) {
    var level = keys[i]
    var num = data[level]
    var ordering = order[level]
    bigList.push({"level": level, "number": num, "order": ordering})
  }

  return _.sortBy(bigList, "order")
}

function processBeers(beer) {
  var firstList = []
  for (var i = 0; i < beer.length; i++) {
    var num = parseInt(beer[i].baRating)
    if (!isNaN(num)) {
      firstList.push({"name": beer[i].beerName, "rating": num,
        "beerRating": beer[i].beerRating, "style": beer[i].Style})
    }
  }
  return _.sortBy(firstList, "rating").reverse()
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
      d3.selectAll("circle.brewery").attr("visibility", function(d) {
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

//animate timeline
function animateTimeline() {
  var min = 1786;
  var max = 2014;
  var counter = min;
  var intervalId = setInterval(function(){
    (function(max) {
  	  if(counter <= max) {
    		d3.selectAll("circle.brewery").attr("visibility", function(d) {
    		  if (d.yearOpened <= counter) {
    			 return "visible";
    		  } 
          else {
    			 return "hidden";
    		  }
  		  });
    		var displacement = ((counter - min) / 228)*100;
    		document.getElementById("animation-progress").style.width = displacement + "%";
    		document.getElementById("animateYear").value = counter;
    		counter += 1;
	    } 
      else {
		    clearInterval(intervalId);
		    document.getElementById("animateYear").value = "Animate Map";
	    }
	  })(max);
  }, 100);
}

// Search functionality
var test;
function selectBrewery(id) {
  var node = d3.select('#name'+id)
  test = node
  if (node != null) {
    searchClick(node.node(), node.data()[0])
  }
}

function setupAutocomplete() {
  $('#searchFilter').autocomplete({
    source: Object.keys(breweriesDict)
  });
}

$('#searchFilter').keyup(function(event) {
  if(event.keyCode == 13) {
    var pressed = $(this).val()
    var id = breweriesDict[pressed]
    if (id != null) {
      selectBrewery(id)
    }
  }
});

// put neccessary functions to setup project here

loadBeerData()
loadBreweryRatingData()
drawMap()
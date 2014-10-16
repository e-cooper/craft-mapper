craft-mapper
============

Info Visualization of Craft Breweries in the U.S.


GETTING THE DATA
How to get data from BreweryDB into a csv:
	curl command- curl -o ./Desktop/breweryInfo.json http://api.brewerydb.com/v2/breweries?key=5040cbeeac3176aa6cefa6ee079d1ff7
	that command should get every brewery's info once we get the premium account(may need to add locations endpoint as well to this) 
	
	will output to .json file and then use this website to convert to csv
	http://www.convertcsv.com/json-to-csv.htm
	
	should work. I put an example(the .json file and .csv file) of doing a GET on one brewery info. the curl command i used was: 
	curl -o ./Desktop/breweryInfo.json http://api.brewerydb.com/v2/brewery/KRB0Bo/locations?key=5040cbeeac3176aa6cefa6ee079d1ff7
	
	We can delete all the columns we don't need and rename the headers too. 
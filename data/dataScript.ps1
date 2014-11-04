$pageNum = 1
$fileNum = 1

while ($fileNum -lt 12) {
	while ($pageNum -lt 10*$fileNum +1 -and $pageNum -gt 10*($fileNum-1)) {
		.\curl.exe >> C:/Users/Becca/Desktop/breweryInfo$fileNum.json "http://api.brewerydb.com/v2/breweries/?key=5040cbeeac3176aa6cefa6ee079d1ff7&withLocations=Y&p=$pageNum" 
		$pageNum = $pageNum + 1
	}


	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '{"currentPage":[0-9]{1,3},"numberOfPages":114,"totalResults":5689,"data":\[', "," }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json


	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '"locations":\[{', "" }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json

	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '"country":{', "" }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json

	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '}}\]}', "}" }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json

	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '\],"status":"success"}', "" }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json

	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '"numberCode":840,', "" }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json

	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '"isoCode":"[A-Za-z ]+","name":"[A-Za-z ]+",', "" }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json

	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '}}', "}" }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json
	
	
	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '"name":"Main Brewery",', "" }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json
	
	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '"name":"Main Brewpub",', "" }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json
	
	(Get-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json) | 
	Foreach-Object {$_ -replace '"name":"Micro Brewery",', "" }| 
	Set-Content C:/Users/Becca/Desktop/breweryInfo$fileNum.json
	
	$fileNum = $fileNum + 1
}


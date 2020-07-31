if (document.URL.includes("localhost:8000")) {
    var finalDataUrl = "http://localhost:8000/cs498Dv/final_data.json";
    var jsUrl = "http://localhost:8000/cs498Dv/final_data.json";
} else {
    var finalDataUrl = "https://raw.githubusercontent.com/kmad1729/cs498Dv/master/final_data.json";
    var jsUrl = "https://raw.githubusercontent.com/kmad1729/cs498Dv/master/final_data.json";
}   
var myGlobalVar;
var linesList = []
var massagedLineData = []
var dataToUseInGraph = {};
var currLine = {}

var allCountryData = getAllCountryData();

function getAllCountryData() {
    result = [];
    for(c in allCountryDataMap) {
        currObj = {countryName : c, colorToUse : allCountryDataMap[c].colorToUse}
        result.push(currObj)
    }
    return result;
}

var selectedCountries = [];
var massagedLineData = []
var daysInLockDownData = [];

var margin = {top: 20, right: 90, bottom: 50, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 
var svgContainer = d3.select("svg").attr("font-family", "sans-serif")

d3.json(finalDataUrl, function (error, inp_data) {
    var parseDate = d3.timeParse("%m/%d/%y"),
        formatDate = d3.timeFormat("%Y-%m-%d"),
        bisectDate = d3.bisector(d => d.date).left
        format = d3.format("+,d")
        ;

    massagedLineData = inp_data["date_to_country_mapping"]
    massagedLineData.forEach(function(singleDayData) {
        singleDayData.date = parseDate(singleDayData.date)
    });

    function checkIfLockDownBoundary(countryName, lockDownDateStr, currDate) {
        lockDownDate = inp_data["country_list"][countryName][lockDownDateStr]
        if (lockDownDate == null) return false;
        lockDownDate = parseDate(lockDownDate);
        if(lockDownDate.getTime() == currDate.getTime()) {
            return true
        }
        return false;
    }

    // TODO Paint days in lockdown vs population
    allCountryData.forEach(function(countryObj) {
        countryName = countryObj.countryName
        colorToUse = countryObj.colorToUse
        countryPop = inp_data["country_list"][countryName]["population"]
        var currStartCaseCont = -1, currEndCaseCount = -1;
        massagedLineData.forEach(function(singleDayData) {
            if(checkIfLockDownBoundary(countryName, "lockdown_start_date", singleDayData.date)) {
                
                currStartCaseCont = singleDayData[countryName]
                countryObj.lockDownStartDate = singleDayData.date
            }
            
            if(checkIfLockDownBoundary(countryName, "lockdown_end_date", singleDayData.date)) {
                currEndCaseCount = singleDayData[countryName]
                countryObj.lockDownEndDate = singleDayData.date
            }

        });

        
        if (currStartCaseCont == -1 || currEndCaseCount == -1) {
            console.log("country " + countryName + " doesn't have both start and end date")
        } else {
            countryObj.countryPop = Math.round(countryPop /1e6)
            countryObj.daysInLockDown = Math.round((countryObj.lockDownEndDate.getTime() - countryObj.lockDownStartDate.getTime()) / (1000 * 3600 * 24)); 
            daysInLockDownData.push(countryObj)
        }
        
    })

    
    x = d3.scaleLinear()
        .domain(d3.extent(daysInLockDownData, function(d) { return d.countryPop; })).nice()
        .range([0, width])

    y = d3.scaleLinear()
        .range([height, 0])
        .domain(d3.extent(daysInLockDownData, function(d) { return d.daysInLockDown; })).nice();

    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

      // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y));
    
    gdots = svg.selectAll("daysInLockDownData")
        .data(daysInLockDownData)
      .enter().append('g')
    gdots.append("circle")
        .style("fill", function(d) { return d.colorToUse })  
        .attr("r", 5)
        .attr("cx", function(d) { return x(d.countryPop); })
        .attr("cy", function(d) { return y(d.daysInLockDown); })
        ;

    gdots.append("text").text(function(d){
        return d.countryName;
    })
    .attr("fill", function (d) {
        return (d.colorToUse);
    })
    .attr("x", function (d) {
        return x(d.countryPop) + 10;
    })
    .attr("y", function (d) {
        return y(d.daysInLockDown);
    })
    .attr("font-size", 10)
    .on("mouseover", function(d, i) {
        tooltip.style("display", null);
    })
    .on("mouseout", function(d, i) {
        tooltip.style("display", "none");
    })
    .on("mousemove", function(d, i) {
        mouseCoords = d3.mouse(d3.event.currentTarget)
        xPos = mouseCoords[0] -5
        yPos = mouseCoords[1] -5
        tooltip.attr("transform", "translate(" + xPos + "," + yPos + ")")
        tooltip.select("text")
            .text("Days:" + d.daysInLockDown + " pop:" + d.countryPop + "m")
            .attr("fill", d.colorToUse)
    })
    ;

    svg.append("text")             
    .attr("transform",
            "translate(" + (width/2) + " ," + 
                            (height + margin.top + 10) + ")")
    .style("text-anchor", "middle")
    .text("Country population (in millions)")
    .attr("font-size", 14)
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("font-size", 14)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Number of days in lockdown");  
        
        tooltip = d3.selectAll("svg").append("g")
        .attr("class", "tooltip")
        .style("display", "none")

        tooltip.append("rect")
                .attr("width", 200)
                .attr("height", 20)
                .attr("fill", "white")
                .style("opacity", 0.5)

        tooltip.append("text")
                .attr("x", 30)
                .attr("dy", "1.2em")
                .style("text-anchor", "start")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")

  
});



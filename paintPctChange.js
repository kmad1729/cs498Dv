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
var margin = {top: 50, right: 50, bottom: 30, left: 50};
var width = 600 - margin.left - margin.right;
var height = 400 - margin.top - margin.bottom;

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
var pctChangeData = [];

d3.json(finalDataUrl, function (error, inp_data) {

    /*
        TODO
        1) calculate start date end date and cases count for each country
        2) Create
    */
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

    function isDateInLockDown(countryName, dateToCheck) {
        lockDownStartDate = inp_data["country_list"][countryName]["lockdown_start_date"]
        lockDownEndDate = inp_data["country_list"][countryName]["lockdown_end_date"]
        if (lockDownStartDate == null || lockDownEndDate == null) {
            return false;
        }
        lockDownStartDate = parseDate(lockDownStartDate);
        lockDownEndDate = parseDate(lockDownEndDate);
        result = (dateToCheck.getTime() >= lockDownStartDate.getTime() && 
            dateToCheck.getTime() <= lockDownEndDate.getTime())
        return result
    }
    // creating lines for all countries
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
            pctChange = Math.round((currEndCaseCount-currStartCaseCont)/currStartCaseCont * 100)
            countryObj.currStartCaseCont = currStartCaseCont
            countryObj.currEndCaseCount = currEndCaseCount
            countryObj.countryPop = countryPop
            perCapitaPctChange = ((pctChange/countryPop) * 10e6)
            countryObj.perCapitaPctChange = perCapitaPctChange
            pctChangeData.push(countryObj)
        }
    });

    pctChangeData.sort((a,b) => {
        return a.lockDownStartDate - b.lockDownStartDate
    })


    maxDiff = Math.max(...pctChangeData.map(o => Math.abs(o.perCapitaPctChange)))
    x = d3.scaleLinear()
        //.domain(d3.extent(pctChangeData.map(o => o.perCapitaPctChange)))
        .domain([-maxDiff, maxDiff])
        .rangeRound([margin.left, width - margin.right])

    y = d3.scaleBand()
        .domain(pctChangeData.map(o => o.countryName))
        .rangeRound([margin.top, height - margin.bottom])
        .padding(0.1)
    
    xAxis = g => g
        .attr("transform", `translate(0,${margin.top})`)
        .call(d3.axisTop(x))
    
    yAxis = g => g
        .attr("transform", `translate(${x(0)}, 0)`)
        .call(d3.axisLeft(y).tickFormat((d, i) => 
            {
                return d
            }).tickSize(0)
            )
            .call(g => g.selectAll(".tick text").filter((d, i) => {
                return (pctChangeData[i].perCapitaPctChange < 0)
            })
            .attr("text-anchor", "start")
            .attr("x", 6))


    svgContainer = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 

    svgContainer.append("g")
        .selectAll("rect")
        .data(pctChangeData)
        .enter()
        .append("rect")
        .attr("id", d => "countryRectangle-" + d.countryName)
        .attr("class", (d) => {
            if (d.perCapitaPctChange < 0) {
                return "bar negative"
            } else {
                return "bar positive"
            }
        })
        .attr("height", y.bandwidth())
        .attr("y", (d, i) => y(d.countryName))
        .attr("x", d => x(Math.min(d.perCapitaPctChange, 0)))
        .attr("width", d => Math.abs(x(d.perCapitaPctChange) - x(0)))
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
            tooltip.select("text").text("LockDown start: " + formatDate(d.lockDownStartDate) 
                + " end: "  + formatDate(d.lockDownEndDate) )
        })
    
    svgContainer.append("g")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
        .selectAll("text")
        .data(pctChangeData)
        .enter()
        .append("text")
            .attr("text-anchor", d => d.perCapitaPctChange < 0? "end" : "start")
            .attr("x", d => {
                return x(d.perCapitaPctChange) + Math.sign(d.perCapitaPctChange - 0) * 4
            })
            .attr("y", (d, i) => y(d.countryName) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => format(d.perCapitaPctChange) + "%")
    
    svgContainer.append("g")
            .call(xAxis)
    svgContainer.append("g")
            .call(yAxis)

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
    
    d3.select("svg").append("text")
            .text("% change in daily cases pre & post lockdown per capita")
            .style("text-anchor", "middle")
            .attr("font-size", 12)
            .attr("transform",
            "translate(" + (width/2) + " ," + 
                           20+ ")")
  
});



if (document.URL.includes("localhost:8000")) {
    var finalDataUrl = "http://localhost:8000/cs498Dv/final_data.json";
    var jsUrl = "http://localhost:8000/cs498Dv/final_data.json";
    var allCountryDataMapUrl = "http://localhost:8000/cs498Dv/all_countryDataColors.json";
} else {
    var finalDataUrl = "https://raw.githubusercontent.com/kmad1729/cs498Dv/master/final_data.json";
    var jsUrl = "https://raw.githubusercontent.com/kmad1729/cs498Dv/master/final_data.json";
    var allCountryDataMapUrl = "https://raw.githubusercontent.com/kmad1729/cs498Dv/master/all_countryDataColors.json";
}   
var myGlobalVar;
var linesList = []
var massagedLineData = []
var dataToUseInGraph = {};
var currLine = {}
var margin = {top: 50, right: 50, bottom: 80, left: 80};
var width = 1500 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;
var svg = d3.select("body").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 
var svgContainer = d3.select("svg")
var overlay = svgContainer.append("rect")
    .attr("class", "overlay")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width)
    .attr("height", height);

var x = d3.scaleTime()
        .range([0, width]);
var y = d3.scaleLinear().range([height, 0]);
var z = d3.scaleOrdinal(d3.schemeCategory10);
           

console.log(allCountryDataMap)
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

d3.json(finalDataUrl, function (error, inp_data) {
    var parseDate = d3.timeParse("%m/%d/%y"),
        formatDate = d3.timeFormat("%Y-%m-%d"),
        bisectDate = d3.bisector(d => d.date).left
        ;

    xExtent = [
        parseDate(inp_data["dateExtent"]["start_date"]),
        parseDate(inp_data["dateExtent"]["end_date"])
    ]
    x.domain(xExtent);

    yExtent = [
        inp_data["dailyCaseExtent"]["min_case_count"],
        inp_data["dailyCaseExtent"]["max_case_count"]
    ] 
    y.domain(yExtent);

    // Add the X Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    
    // Add the Y Axis
    svg.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Case Count");
    
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

        var ldstartContainer = svg.append("g")	
                    .attr("class", "cs498Annotation")				
                    .attr("id", "cs498Annotation-ldstart-" + countryName)
                    .style("opacity", 0);

        var ldendContainer = svg.append("g")	
                    .attr("class", "cs498Annotation")				
                    .attr("id", "cs498Annotation-ldend-" + countryName)
                    .style("opacity", 0);
        currLine = d3.line()
            .x(function(d, i) {
                x_coordinate = x(d.date)
                y_coordinate = y(d[countryName])

                if (checkIfLockDownBoundary(countryName, "lockdown_start_date",d.date)) {

                    var currldStartCont = d3.select("#cs498Annotation-ldstart-"  + countryName)
                            .style("opacity", 1)
                            .attr("transform", "translate(" + (x(d.date)) + "," + (0) + ")")
                    currldStartCont.append("circle")
                        .attr("r", 4.5)
                        .attr("cy", y_coordinate)
                        .style("fill", colorToUse)

                    // todo draw a vertical line
                    var startVertLine = currldStartCont.append("line")
                        .attr("transform", "translate(" + (0) + "," + height + ")")
                        .attr("y1", -height + 0)
                        .attr("y2",0)
                        .style("stroke", colorToUse)
                        .attr("stroke-width", 2)
                        .style("shape-rendering", "crispEdges")
                        .style("opacity", 0.5)

                    var startHorLine = currldStartCont.append("line")
                        .attr("transform", "translate(" + (-x(d.date)) + "," + (0) + ")")
                        .attr("x1", x.range()[0])
                        .attr("y1", y_coordinate)
                        .attr("x2",x.range()[1])
                        .attr("y2",y_coordinate)
                        .style("stroke", colorToUse)
                        .attr("stroke-width", 2)
                        .style("shape-rendering", "crispEdges")
                        .style("opacity", 0.5)

                    currldStartCont.append("text")
                            .attr("transform", "translate(" + (0) + "," + height + ")")
                            .attr("transform", "rotate(" + (-45)+ ")")
                            .text("Start " + countryName + " " + formatDate(d.date) + " #" + d[countryName])
                            .style("fill", colorToUse)
                            .attr("text-anchor", "end")
                            .attr("font-size", 12)
                            
                }
                if (checkIfLockDownBoundary(countryName, "lockdown_end_date",d.date)) {
                    var currldEndCont = d3.select("#cs498Annotation-ldend-"  + countryName)
                            .style("opacity", 1)
                            .attr("transform", "translate(" + (x(d.date)) + "," + (0) + ")")

                    currldEndCont.append("circle")
                            .attr("r",5)
                            .attr("cy", y_coordinate)
                            .style("fill", colorToUse)

                    // todo draw a vertical line
                    var endVertLine = currldEndCont.append("line")
                        .attr("transform", "translate(" + (0) + "," + height + ")")
                        .attr("y1", -height + 0)
                        .attr("y2",0)
                        .style("stroke", colorToUse)
                        .attr("stroke-width", 2)
                        .style("shape-rendering", "crispEdges")
                        .style("opacity", 0.5)

                    var endHorLine = currldEndCont.append("line")
                        .attr("transform", "translate(" + (-x(d.date)) + "," + (0) + ")")
                        .attr("x1", x.range()[0])
                        .attr("y1", y_coordinate)
                        .attr("x2",x.range()[1])
                        .attr("y2",y_coordinate)
                        .style("stroke", colorToUse)
                        .attr("stroke-width", 2)
                        .style("shape-rendering", "crispEdges")
                        .style("opacity", 0.5)

                    currldEndCont.append("text")
                            .attr("transform", "translate(" + (0) + "," + height + ")")
                            .attr("transform", "rotate(" + (-45)+ ")")
                            .text("End " + countryName + " " + formatDate(d.date) + " #" + d[countryName])
                            .style("fill", colorToUse)
                            .attr("text-anchor", "end")
                            .attr("font-size", 12)
                }
                return x_coordinate;
            })
            .y(function(d) {
                return y(d[countryName]);
            })
            ;

        svg.append("path")
            .data([massagedLineData])
            .attr("class", "line")
            .attr("id", "covidpath-" + countryName)
            .style("stroke", colorToUse)
            .attr("d", currLine)
        ;

    });

    // add checkboxes
    d3.select("body").selectAll("input")
        .data(allCountryData)
        .enter()
        .append("div")
            .attr("class", "countryCB")
        .append("input")
            .attr("type", "checkbox")
            .attr("checked", true)                        
            .attr("class", "countryCB-checkbox")                        
            .attr("id", function(d, i) { return  "countryCB-" + d.countryName })
        .call(updateAllSelectedCountries)
    ;
    
    d3.selectAll(".countryCB")
        .append("label")
            .attr("for", function(d, i) {
                return "countryCB-" + d.countryName
            })
            .text(function(d) {
                return d.countryName;
            })
            .style("color", function(d) { return d.colorToUse;})
    
    d3.selectAll(".countryCB-checkbox").on("change", updateAllSelectedCountries)

    /* Commenting out the legend. Need a better way
    svg.append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll("text")
        .data(allCountryData)
        .enter()
        .append("text")
        .attr("id", function(d, i) {
            countryName = d.countryName
            return "text-id" + countryName + "-" + i;
        })
        .attr("x", function(d) {
            return 50;
        })
        .attr("y", function(d, i) {
            return 50 + (20*i)
        })
        .html(function(d, i) {
            countryName = d.countryName
            return countryName;
        })
        .style("opacity", 1)
        .style("fill", function(d, i) {
            colorToUse = d.colorToUse
            return colorToUse;
    });
    */

    animatePath(selectedCountries);
    
    var focus = svgContainer.append("g")
        .attr("class", "focus")
        .style("display", "none")

    // hover over functionality
    svgContainer.selectAll(".overlay")
        .on("mouseover", function() {
            focus.style("display", null)
        })
        .on("mouseout", function() {
            focus.style("display", "none")
        })
        .on("mousemove", function() {
            mousemove()
        })

    focus.append("line").attr("class", "lineHover")
        .style("stroke", "#999")
        .attr("stroke-width", 1)
        .style("shape-rendering", "crispEdges")
        .style("opacity", 0.5)
        .attr("y1", -height + 50)
        .attr("y2",50)

    function mousemove() {
        mouseCoords = d3.mouse(d3.event.currentTarget)
        var x0 = x.invert(mouseCoords[0]-50),
            i = bisectDate(massagedLineData, x0, 1),
            d0 = massagedLineData[i-1],
            d1 = massagedLineData[i],
            d = x0 - d0.date > d1.date -x0 ? d1 : d0 //figuring out which date the mouse is closer to.
        ;

        focus.select(".lineHover")
            .attr("transform", "translate(" + (x(d.date)  + 50) + "," + height + ")");


        focus.append("text").attr("class", "lineHoverDate")
            .attr("text-anchor", "middle")
            .attr("font-size", 12);
            
        focus.select(".lineHoverDate")
                .attr("transform", "translate(" + (x(d.date)  + 50) + "," + (height + margin.bottom + 50) + ")")
                .text(formatDate(d.date));
                
        tooltip(d)
    }

    function tooltip(dataObj) {
        // get all the selected countries and create a mapping of {name: "Cname", cases: "casecount"}
        resultDataToToolTip = []
        selectedCountries.forEach(function(cName) {
            currObj = {name: cName, cases: dataObj[cName]}
            resultDataToToolTip.push(currObj)
        });

        resultDataToToolTip.sort(function(a,b) {
            return b.cases - a.cases
        })
        resultDataToToolTip = resultDataToToolTip.slice(0, 10)
        focus.selectAll(".lineHoverText").remove()
        var labels = focus.selectAll(".lineHoverText")
            .data(resultDataToToolTip)
        labels.enter().append("text")
            .attr("class", "lineHoverText")
            .style("fill", d => allCountryDataMap[d.name].colorToUse)
            .attr("text-anchor", "start")
            .attr("font-size", 12)
            .attr("dy", function(d, i) {return 1 + i*2 + "em"})
            .merge(labels)
        
        focus.selectAll(".lineHoverText")
            .attr("transform", "translate(" + (x(dataObj.date)) + "," + height / 2.5 + ")")
            .text(function(d, i) {
                return d.name + " " + d.cases;
            });

    }

    svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x",0 - (height / 2))
    .attr("font-size", 14)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .attr("font-family", "sans-serif")
    .text("Per day case count ->");      
    
    svgContainer.append("text")
            .attr("transform","translate(" + (width/2) + " ," + (height + margin.bottom)+ ")")
            .text("increasing order of days (2020) ->")
            .style("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", 14)

});

d3.select('#start').on("click", function() {
    hideAllLines()
    updateAllSelectedCountries()
    animatePath(selectedCountries)}
);
d3.select('#reset').on("click", hideAllLines);



function animatePath(checkboxTrueCountries) {
    //animation
    allCountryData.forEach(function(countryObj) {
        countryName = countryObj.countryName
        pathObj = d3.select("#covidpath-" + countryName)
        var totalLength = pathObj.node().getTotalLength()
        pathObj.attr("stroke-dasharray", totalLength) 
        .attr("stroke-dashoffset", totalLength)
        .style("opacity", function (d, i) {
            if(checkboxTrueCountries.includes(countryName)) {
                return 1
            } else {
                return 0.1
            }
        })
        .transition()
        .duration(800)
        .attr("stroke-dashoffset", 0)

    })
}

function hideAllLines() {
    d3.selectAll('.line').style("opacity", 0)
}

function updateAllSelectedCountries() {
    result = []
    allCountryData.forEach(function (countryObj) {
        var currPathElem = d3.select("#covidpath-" + countryObj.countryName)
        var currLdStartElem = d3.select("#cs498Annotation-ldstart-" + countryObj.countryName)
        var currLdEndElem = d3.select("#cs498Annotation-ldend-" + countryObj.countryName)
        if (isCountryChecked(countryObj.countryName)) {
            currPathElem.style("opacity", 1)
            currLdStartElem.style("opacity", 1)
            currLdEndElem.style("opacity", 1)
            result.push(countryObj.countryName)
        } else {
            // change opacity of unselected country
            currPathElem.style("opacity", 0.1)
            currLdStartElem.style("opacity", 0.1)
            currLdEndElem.style("opacity", 0.1)
        }
    })
    selectedCountries = result
}

function isCountryChecked(contryName) {
    var currCbElem = d3.select("#countryCB-" + contryName)
    return currCbElem.node().checked;
}
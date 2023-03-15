var data = [];
let user;

//when the page loads
window.onload = function () {
    // reference: https://stackoverflow.com/questions/24594878/show-hide-fieldset-based-on-radio-button-using-javascript
    $("#private_buttons").css('display', 'none');
    document.getElementById("option").value = "all";
}

let Authorization = sessionStorage.getItem('Authorization');

// let user = document.getElementById('name').value;
let pass = document.getElementById('pass').value;

//function to operate the tab(display panel)
function openTap(evt, displayTap) {
    // Declare all variables
    var i, tabcontent, tablinks;
    if (displayTap == "calendar-container") {
        displayCalendar(displayMonth, displayYear)
    }

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(displayTap).style.display = "flex"; //to amend whether it should be block
    evt.currentTarget.className += " active";
}

//handler to capture user credentials for login purpose
document.getElementById('loginButton').onclick = function (e) {
    user = document.getElementById('name').value;
    let pass = document.getElementById('pass').value;
    e.preventDefault();

    if (!user) {
        alert('Username cannot be empty');
    } else if (!pass) {
        alert('Password cannot be empty');
    } else {

        fetch('/login', { //check if the credentials match with the deatils in server
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: user, pass: pass })
        })
            .then(res => res.json())
            .then(jsn => {

                if (jsn.msg == "password is not correct!") {
                    alert("password is not correct!");
                } else if (jsn.msg == "User does not exsit.") {
                    alert("User does not exsit.");
                } else {
                    $('#public').css('display', 'none');
                    $('#Register').css('display', 'none');
                    $('#login').css('display', 'none');
                    $("#private_buttons").css('display', 'block');
                    showinfo(jsn);
                    getRecord(jsn);
                }
            })
            .then(jsn => {
                document.getElementById("transfer").href = "./addRecord.html"
                document.getElementById("transfer").innerText = "Submit a new Record";
            })
            .catch(error => {
                alert(error);
            })
    }
    function showinfo(a) {
        document.getElementById("Username").innerHTML = a.Username;
        document.getElementById("gender").innerHTML = a.gender;
        document.getElementById("city").innerHTML = a.city;
        document.getElementById("dateBirth").innerHTML = a.birthDate;
    }
}

//Record
//Get data and showRecord
async function getRecord(jsn) {

    await fetch(`/Records/${user}`)
        .then(res => res.json())
        .then(jsn => {
            data = jsn;

            showRecord(data);
            typeRange(data);
            DisplayPS(data);
            DisplayLR(data);
            plot();
            Display25(data);

            // displayCalendar(data);

        })
        .catch(error => {
            console.error(error);
        })

}

//Show the data in table
function showRecord(jsn) {
    let table = document.getElementById("history-table-body");
    let dataHTML = "";

    for (let row of jsn) {
        //transfer time to duration
        let startTime = row.personalRecords.start.split(':');
        let endTime = row.personalRecords.end.split(':');
        let duration = parseInt(endTime[0]) * 60 + parseInt(endTime[1]) - parseInt(startTime[0]) * 60 - parseInt(startTime[1]);
        let durationShow = Math.floor(duration / 60) + "H " + duration % 60 + "M";
        let averageSpeed = Math.round(row.personalRecords.Distance / duration * 60 * 100) / 100 + "KM/H";


        if (user == row.Username){
            if (!duration){
                dataHTML +=`<tr><td>${row.personalRecords.Date}</td><td>${row.personalRecords.Type}</td><td>${row.personalRecords.Distance} KM</td>
            <td></td><td></td>
            <td>
            <a title = "Delete"><img src = "./img/delete.png" class = "img" onclick = "delRecord(${jsn.indexOf(row)})"></a> 
           
            </td>
            </tr>`

            }else{
                dataHTML +=`<tr><td>${row.personalRecords.Date}</td><td>${row.personalRecords.Type}</td><td>${row.personalRecords.Distance} KM</td>
            <td>${durationShow}</td><td>${averageSpeed}</td>
            <td>
            <a title = "Delete"><img src = "./img/delete.png" class = "img" onclick = "delRecord(${jsn.indexOf(row)})"></a> 
           
            </td>
            </tr>`
            }
            
            // <a title = "Edit"><img src = "./img/edit.png" class = "img" onclick = "editRecord(${jsn.indexOf(row)})"></a>
        }
    }

    table.innerHTML = dataHTML;
    let result = document.getElementById("resultCount");
    result.innerHTML = `<p>Result:${jsn.length}</p>`
}

//Give the Type Range to dropdown list
function typeRange(data) {
    let typeRange = [];
    let typeRangeSelect = document.getElementById("selectType");
    let range = `<option>All</option>`;
    for (let i = 0; i < data.length; i++) {
        let typeValue = data[i].personalRecords.Type;
        if (!typeRange.includes(typeValue)) {
            typeRange.push(typeValue);
        }
    }
    for (let j = 0; j < typeRange.length; j++) {
        range += `<option>${typeRange[j]}</option>`;
    }
    typeRangeSelect.innerHTML = range;
}

//Update Table based on filters
function updateTable() {
    let selectType = document.getElementById("selectType").value;
    let showArr = []
    for (let i of data) {

        if (selectType == 'All') {
            showArr.push(i);;
        } else if (selectType == i.personalRecords.Type) {
            showArr.push(i);
        }
    }
    showRecord(showArr)
}

//Delete record
function delRecord(i) {
    var result = confirm("Are you sure to delete?");
    if (result) {

        fetch(`/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ index: i })
        })
            .then(res => res.json())
            .then(jsn => {
                getRecord();
            }
            )
    }

}



//Features: Google MAp API
//Expected data format:

function initMap() {

    //initial point of the map
    let mapOptions = {
        center: { lat: 51.5072, lng: 0.1276 },
        zoom: 6
    }
    //create the map
    let map = new google.maps.Map(document.getElementById('map'), mapOptions);

    //call for API service
    var directionsService = new google.maps.DirectionsService;

    //initiate the request
    function requestDirections(start, mid, end) {
        //waypoint handlering
        const waypts = [];
        for (let i = 0; i < mid.length; i++) {
            waypts.push({
                location: mid[i],
                stopover: true,
            });
        }
        //create the request details
        directionsService.route({
            origin: start,
            destination: end,
            waypoints: waypts,
            optimizeWaypoints: true,
            travelMode: google.maps.DirectionsTravelMode.BICYCLING
        }, function (result) {
            renderDirections(result);
            if (result.status == 'ZERO_RESULTS') {
                alert(" No such cycling route. ")
            }
        });
    }

    //draw the request response on map
    function renderDirections(result) {
        var directionsRenderer = new google.maps.DirectionsRenderer;
        directionsRenderer.setMap(map);
        directionsRenderer.setDirections(result);
    }

    //display the route
    function drawRoutes() {
        for (let i = 0; i < recommendationArray.length; i++) {
            requestDirections(recommendationArray[i].start, recommendationArray[i].mid, recommendationArray[i].end);
        }
    }

    //default to draw the routes
    drawRoutes()

    //record user's input
    function updataRecommendation() {
        //make waypoint input into array
        let mid = [];

        if ($(".waypoint-recommendation").length > 0) {
            let classes = $(".waypoint-recommendation")
            for (var i = 0; i < classes.length; i++) {
                mid.push(classes[i].value);
            }
        }
        mid = mid.filter(n => n)
        console.log(mid)
        recommendationArray.push(
            {
                "start": document.getElementById("from-recommendation").value,
                "mid": mid,
                'end': document.getElementById("to-recommendation").value
            })

    }
    $('#recommendation-form').submit(function (e) {
        e.preventDefault();
        console.log('recommendation submit')
        updataRecommendation()
        drawRoutes()

    });

    // create autocomplete objects for all input
    var options = {
        type: ['(cities)']
    }

    var input1 = document.getElementById("from-recommendation");
    var autocomplete1 = new google.maps.places.Autocomplete(input1, options)

    var input2 = document.getElementById("to-recommendation");
    var autocomplete2 = new google.maps.places.Autocomplete(input2, options)

    var waypoint0 = $(".waypoint-recommendation")[0];
    var waypointAutocomplete0 = new google.maps.places.Autocomplete(waypoint0, options)

}

document.getElementById('moreWaypoint').onclick = function () {
    let recommendationForm = document.getElementById('recommendation-form')
    // document.getElementById('moreWaypoint').remove()
    let div = document.createElement("div");
    div.setAttribute('class', "form-group")
    div.innerHTML = `
	<label><i class="fa-solid fa-location-arrow"></i>Waypoint (if any)</label>
	<div>
		<input type="text"  placeholder="Please enter your waypoint" class="form-control long-input waypoint-recommendation">
	</div>`

    recommendationForm.append(div)

}

// Features: Statistics section 
function duradd(d) {
    for (i in d) {
        startTime = d[i].personalRecords.start.split(':');
        endTime = d[i].personalRecords.end.split(':');
        d[i].personalRecords.duration = parseInt(endTime[0]) * 60 + parseInt(endTime[1]) - parseInt(startTime[0]) * 60 - parseInt(startTime[1]);
    }
    return d;
}

function dateComparison(a, b) {
    const date1 = new Date(a)
    const date2 = new Date(b)

    return date1 - date2;
}

// max distance:
// returns object conatining info
function MAX(d) { //d is data
    dist = [];
    for (i in d) {
        dist[i] = Number(d[i].personalRecords.Distance);
    }
    max_dist = Math.max.apply(Math, dist);
    g = [];

    for (i in d) {
        if (d[i].personalRecords.Distance == max_dist) {
            g.push(d[i].personalRecords);
        }
    }
    return g;
}

// function returns information about maxpoints, which can be any dataset
// you pass in a data set with all distances equal and it returns information on the most recent cycle
function information(maxpoints) {
    if (maxpoints.length >= 1) {
        dates = [];
        const datesuse = [];
        for (r in maxpoints) {
            dates[r] = maxpoints[r].Date;
            datesuse[r] = g[r].Date;
        } // creates array of dates 
        dates.sort(dateComparison);
        const recentdate = dates[dates.length - 1]
        index_date = datesuse.indexOf(recentdate); // index of most recent date
        a = maxpoints[index_date]; // record with most recent date and longest distance 

        // creating an object that conatins information about that cycle       
        let durationShow = Math.floor(a.duration / 60) + "hr(s) " + a.duration % 60 + "min(s)";
        let averageSpeed = Math.round(a.Distance / a.duration * 60 * 100) / 100 + "km/h";
        info1 = Object();
        info1.distance = a.Distance;
        info1.Date = a.Date;
        info1.duration = durationShow;
        info1.start = a.start;
        info1.racetype = a.Type;
        info1.meanspead = averageSpeed;
        return info1;
    }
}

// function to filter data, dataset only containg distance=25
function isdis25(d) {
    d_25km = [];
    for (i in d) {
        if (Number(d[i].personalRecords.Distance) == 25) {
            d[i].personalRecords.Distance = Number(d[i].personalRecords.Distance)
            // changing distance to a number for plotting later on
            // I can reuse this function to filter data by distance = 25km for plotting
            d_25km.push(d[i])
        }
    }
    return duradd(d_25km);
}


// function to find record of 25km cycle with lowest duration and output its info 
function time25(d_25km) {

    dur = [];
    for (i in d_25km) {
        dur[i] = d_25km[i].personalRecords.duration;
    } // creates array of duration times 


    min_dur = Math.min.apply(Math, dur); // minium time(s)
    g = [];

    for (i in d_25km) {
        if (d_25km[i].personalRecords.duration == min_dur) {
            g.push(d_25km[i]);
        }
    } // creates g an array of records with min times
    // now find the record in g with the most recent date

    dates = [];
    const datesuse = [];
    for (r in g) {
        dates[r] = g[r].Date;
        datesuse[r] = g[r].Date;
    } // creates array of dates in g

    dates.sort(dateComparison);
    const recentdate = dates[dates.length - 1]
    index_date = datesuse.indexOf(recentdate);

    a = g[index_date]; // record with most recent date and longest distance 
    let durationShow = Math.floor(a.personalRecords.duration / 60) + "hr(s) " + a.personalRecords.duration % 60 + "min(s)";
    let averageSpeed = Math.round(a.personalRecords.Distance / a.personalRecords.duration * 60 * 100) / 100 + "km/h";

    info1 = Object(); // creating an object that conatins information about that cycle 
    info1.distance = a.personalRecords.Distance;
    info1.Date = a.personalRecords.Date;
    info1.duration = durationShow;
    info1.start = a.personalRecords.start;
    info1.racetype = a.personalRecords.Type;
    info1.meanspead = averageSpeed;
    return info1;
}

// Latest ride
function late(d) {
    d = duradd(d);
    dates = [];
    const datesuse = [];
    for (i in d) {
        dates[i] = d[i].Date;
        datesuse[i] = d[i].Date;
    } // creates array of dates 
    dates.sort(dateComparison);
    const recentdate = dates[dates.length - 1] // last date, most recent date
    index_date = datesuse.indexOf(recentdate);
    a = d[index_date];
    let durationShow = Math.floor(a.personalRecords.duration / 60) + "hr(s) " + a.personalRecords.duration % 60 + "min(s)";
    let averageSpeed = Math.round(a.personalRecords.Distance / a.personalRecords.duration * 60 * 100) / 100 + "km/h";

    info1 = Object(); // creating an object that conatins information about that cycle 
    info1.distance = a.personalRecords.Distance;
    info1.Date = a.personalRecords.Date;
    info1.duration = durationShow;
    info1.start = a.personalRecords.start;
    info1.racetype = a.personalRecords.Type;
    info1.meanspead = averageSpeed;
    return info1
}


//Displaying Information Personal Best Section
function DisplayPS(data) {

    personal_best_sec = information(MAX(duradd(data)))
    // date        id =  achieved-date-best
    document.getElementById("achieveddatebest").innerHTML = personal_best_sec.Date;

    // distance id = distance-best
    document.getElementById("distance-best").innerHTML = personal_best_sec.distance + "km";

    // duration id = achieved-time-best
    document.getElementById("achieved-time-best").innerHTML = personal_best_sec.duration;

    // mean speed id = mean
    document.getElementById("mean").innerHTML = personal_best_sec.meanspead;

    // start time id = start-time-best
    document.getElementById("start-time-best").innerHTML = personal_best_sec.start;

    // race type id = type-of-race
    document.getElementById("type-of-race").innerHTML = personal_best_sec.racetype;
}
// DisplayPS(data)
// use function DisplayPS(RecordData) to display it in P3 client

//Displaying information Latest Ride
function DisplayLR(data) {
    latetest_sec = late(data);

    // date        id =  date-last
    document.getElementById("date-last").innerHTML = latetest_sec.Date;

    // distance id = distance-last
    document.getElementById("distance-last").innerHTML = latetest_sec.distance + "km";

    // duration id = time-last
    document.getElementById("time-last").innerHTML = latetest_sec.duration;

    // mean speed id = mean-last
    document.getElementById("mean-last").innerHTML = latetest_sec.meanspead;

    // start time id = start-time-last
    document.getElementById("start-time-last").innerHTML = latetest_sec.start;

    // race type id = type-of-race-last
    document.getElementById("type-of-race-last").innerHTML = latetest_sec.racetype;
}
// DisplayLR(data)
// use function DisplayLR(RecordData) to display it in P3 client

//Displaying information 25KM Section
function Display25(data) {
    km25_personal_best = time25(isdis25(data));

    //Achieved date id="25km-date"
    document.getElementById("25km-date").innerHTML = km25_personal_best.Date;

    //Total Duration of the Ride id="25km-dur"
    document.getElementById("25km-dur").innerHTML = km25_personal_best.duration;

    // mean speed id = 25km-mean
    document.getElementById("25km-mean").innerHTML = km25_personal_best.meanspead;

    // start time id = start-25km
    document.getElementById("start-25km").innerHTML = km25_personal_best.start;

    // race type id = type-of-race
    document.getElementById("25km-typerace").innerHTML = km25_personal_best.racetype;
}
// Display25(data)
// use function Display25(RecordData) to display it in P3 client 


//Calender
// function showCalendar(){
let today = new Date();
let displayMonth = today.getMonth();
let displayYear = today.getFullYear();
let selectedYear = document.getElementById("year");
let selectedMonth = document.getElementById("month");

//construct the year options
let calendarYearOption = document.getElementById('year')
for (let i = 2015; i < 2036; i++) {
    let option = document.createElement("option")
    option.setAttribute("value", i);
    option.innerText = i;
    calendarYearOption.appendChild(option)
}

let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

//show current month by default
let = calendarHeader = document.getElementById("calendarHeader");
displayCalendar(displayMonth, displayYear);

function next() {
    //when current displaying month is dec, change to next year
    if (displayMonth === 11) {
        displayYear += 1;
    }

    //shift to next month
    displayMonth = (displayMonth + 1) % 12;
    displayCalendar(displayMonth, displayYear);
}

function previous() {
    //when current displaying month is Jan, change to previous year
    if (displayMonth === 0) {
        displayYear -= 1;
    }

    //when current displaying month is Jan, change to dec
    if (displayMonth === 0) {
        displayMonth = 11;
    } else {
        displayMonth -= 1; // shift to previous month
    }
    displayCalendar(displayMonth, displayYear);
}

function jump() {
    displayYear = parseInt(selectedYear.value);
    displayMonth = parseInt(selectedMonth.value);
    displayCalendar(displayMonth, displayYear);
}

function displayCalendar(month, year) {

    let firstDay = (new Date(year, month)).getDay();
    //store the correct number of days in month
    let daysInMonth = 32 - new Date(year, month, 32).getDate();

    let displayCalendarBody = document.getElementById("calendar-body"); // body of the calendar

    //update display
    displayCalendarBody.innerHTML = "";
    calendarHeader.innerHTML = months[month] + " " + year;
    selectedYear.value = year;
    selectedMonth.value = month;

    // creating the calendar
    let date = 1;
    for (let i = 0; i < 6; i++) {

        // creates a table row
        let row = document.createElement("tr");

        //creating eachday's boxes
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                let box = document.createElement("td");
                let boxNumber = document.createTextNode("");
                box.appendChild(boxNumber);
                row.appendChild(box);
            }
            else if (date > daysInMonth) {
                break;
            }
            else {
                let box = document.createElement("td");
                let actualMonth = month + 1
                var formattedMonth = ("0" + actualMonth).slice(-2);
                var formatteddate = ("0" + date).slice(-2);
                box.setAttribute("id", `${year}-${formattedMonth}-${formatteddate}`)

                let boxNumber = document.createTextNode(date);

                if (date === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    box.classList.add("bg-primary"); //hightlight today
                }

                row.appendChild(box);
                box.appendChild(boxNumber);

                date++;
            }
        }
        displayCalendarBody.appendChild(row); // appending each row into calendar body.
    }
    showInCalendar(data)
}


function showInCalendar(data) {
    for (let i = 0; i < data.length; i++) {
        IDOfappedningCalendaBox = data[i].personalRecords.Date

        try {
            let calendarBox = document.getElementById(IDOfappedningCalendaBox)
            let record = document.createElement('p')
            record.style.border = "medium groove #ddff00";

            record.innerText = `${data[i].personalRecords.Type}
            ${data[i].personalRecords.Distance} km
            ${data[i].personalRecords.start} - ${data[i].personalRecords.end}
                `
            calendarBox.appendChild(record)
        } catch {
            console.log(`${IDOfappedningCalendaBox} is not existed`)
        }
    }
}



//Graph
function disttoNum(d) {
    for (i in d) {
        d[i].personalRecords.Distance = Number(d[i].personalRecords.Distance);
    }
    return d;
}

let margin = 50;
let width = 700;
let height = 450;

var scatterplot_SVG = d3.select("#plot")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const colours = {
    'all': 'black',
    'road race': '#cc6600',
    'mountain biking': '#00cc66',
    'bmx racing': '#3366ff',
    'ultra-distance': '#cc33ff',
    'daily commutes': 'black',
};

function plot() {
    d3.selectAll('.inner-plot').remove();
    const newData = disttoNum(duradd(data));
    console.log(newData);
    let filteredData = newData;

    let value = document.getElementById("option").value;

    // if (value && value !== 'all'){
    if (value && value !== 'all') {
        filteredData = filteredData.filter(d => d.personalRecords.Type.toLowerCase() === value.toLowerCase());
    }
        let extent_x = d3.extent(disttoNum(duradd(filteredData)), (d) => d.personalRecords.duration);

        let x_scale = d3.scaleLinear()
            .range([margin, width - margin])
            .domain([0, extent_x[1]]);

        let x_axis = d3.axisBottom(x_scale);

        let extent_y = d3.extent(disttoNum(duradd(filteredData)), (d) => parseFloat(d.personalRecords.Distance));

        let y_scale = d3.scaleLinear()
            .range([height - margin, margin])
            .domain([0, extent_y[1]]);

        let y_axis = d3.axisLeft(y_scale);

        scatterplot_SVG.selectAll("circle")
            .data(disttoNum(duradd(filteredData)))
            .enter()
            .append("circle")
            .attr('class', 'inner-plot') // for removal of previous render
            .attr('cx', d => x_scale(d.personalRecords.duration))
            .attr('cy', d => y_scale(d.personalRecords.Distance))
            .attr('r', 5)
            .attr('fill', value && colours[value.toLowerCase()] || 'black');

        d3.select("svg")
            .append("g")
            .attr("id", "x_axis")
            .attr('class', 'inner-plot')// for removal of previous render
            .attr("transform", `translate(0, ${height - margin})`)
            .call(x_axis);

        d3.select("svg")
            .append("g")
            .attr("id", "y_axis")
            .attr('class', 'inner-plot')// for removal of previous render
            .attr("transform", `translate(${margin},0)`)
            .call(y_axis);

        d3.select("#x_axis")
            .append("text")
            .text("Duration (mins)")
            .style("fill", "black")
            .style("font-size", "10px")
            .attr("x", (width - margin) / 2)
            .attr("y", margin - 20);

        d3.select("#y_axis")
            .append("text")
            .text("Distance (km)")
            .style("fill", "black")
            .style("font-size", "10px")
            .attr("transform", `rotate(-90, 0, ${margin - 10}) translate(${-margin}, 0)`);


    };

    document.getElementById('option').addEventListener('change', e => {
        const { value } = e.target;
        plot(value);
    });

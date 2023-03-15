window.onload = () => {
    document.getElementById("confirm").onclick = addRecord;
}

//Post the detials of the record form to server side
async function addRecord() {
    let username = document.getElementById("Username").value;
    let Records = new Object();
    Records.Username = document.getElementById("Username").value;
    Records.RecordDate = document.getElementById("RecordDate").value;
    Records.RecordType = document.getElementById("RecordType").value;
    Records.distance = document.getElementById("distance").value;
    Records.start = document.getElementById("start").value;
    Records.end = document.getElementById("end").value;

    await fetch(`/Record/${username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Records)
    })
        .then(res => res.json())
        .then(jsn => {
            getRecords();

        })
}

//Reterive the detials of the record form from server side
const getRecords = function () {
    let username = document.getElementById("Username").value;
    let List = document.getElementById("RecordsList");
    List.innerHTML = "";

    fetch(`/Records/${username}`)
        .then(res => res.json())
        .then(jsn => {
            for (let Record of jsn) {
                let div = document.createElement("div");

                if (username == Record.Username) {
                    div.innerHTML = Record.personalRecords.Date + "<span>" + Record.personalRecords.Type + "<span>" + Record.personalRecords.Distance + "<span>" + Record.personalRecords.start;
                }
                List.append(div);
            }
        })
}

//Features: Distance Calculator
// initiate Google map API
function initMap() {
    //create a Directions service object to use the route method and get a result for our request
    var directionsService = new google.maps.DirectionsService();

    //create a DirectionsRenderer object with we will use to display the route

    var directionsDisplay = new google.maps.DirectionsRenderer()

    //set map options
    var mylatlng = { lat: 51.4551, lng: 0.9787 };
    var distanceMapOptions = {
        center: mylatlng,
        zoom: 7,
        mapTypeID: google.maps.MapTypeId.ROADMAP
    }

    //create map
    var map2 = new google.maps.Map(document.getElementById("distance-map"), distanceMapOptions)

    //bind the directionsRenderer to the map
    directionsDisplay.setMap(map2);

    //initiate request to external API to calculate the distance
    function calcRoute() {
        //make waypoint input into array
        let mid = [];

        if ($(".waypoint-distance").length > 0) {
            let classes = $(".waypoint-distance")
            for (var i = 0; i < classes.length; i++) {
                mid.push(classes[i].value);
            }
        }
        mid = mid.filter(n => n)
        //waypoint handlering
        const waypts = [];
        for (let i = 0; i < mid.length; i++) {

            waypts.push({
                location: mid[i],
                stopover: true,
            });
        }
        //create request
        var request = {
            origin: document.getElementById("from").value,
            destination: document.getElementById("to").value,
            waypoints: waypts,
            optimizeWaypoints: true,
            travelMode: google.maps.TravelMode.BICYCLING,
            unitSystem: google.maps.UnitSystem.METRIC
        }

        //pass the request to the route method
        directionsService.route(request, (result, status) => {
            const output = document.getElementById('distance-result');

            if (status == google.maps.DirectionsStatus.OK) { //when "OK" and "with route", get distance and time 
                output.innerHTML = `<div>
                <h3>Cycling distance searching Result</h3>
                    <table>
                        <tr>
                            <th>Origin</th>
                            <td>${document.getElementById("from").value}</td>
                        </tr>
                        <tr>
                            <th>Destination</th>
                            <td>${document.getElementById("to").value}</td>
                        </tr>
                        <tr>
                            <th>Passing through</th>
                            <td>${mid}</td>
                        </tr>
                        <tr>
                            <th>Estimated Distance</th>
                            <td>${result.routes[0].legs[0].distance.text}les</td>
                        </tr>
                        <tr>
                            <th>Estimated Duration</th>
                            <td>${result.routes[0].legs[0].duration.text}<span> (for average person, you may provide your duration)</span></td>
                        </tr>

                    </table>
                </div>`
                document.getElementById("distance").value = result.routes[0].legs[0].distance.text.slice(0, -2).trim()
                //display route
                directionsDisplay.setDirections(result);
            }

            else {
                //delete route from map
                directionsDisplay.setDirections({ routes: [] })

                //center map
                map2.setCenter(mylatlng);

                //show error message
                output.innerHTML = result.status
                alert(result.status)
            }
        })
    }

    // create autocomplete objects for all input
    var options = {
        type: ['(cities)']
    }

    var input1 = document.getElementById("from");
    var autocomplete1 = new google.maps.places.Autocomplete(input1, options)

    var input2 = document.getElementById("to");
    var autocomplete2 = new google.maps.places.Autocomplete(input2, options)

    var waypoint0 = $(".waypoint-distance")[0];
    var waypointAutocomplete0 = new google.maps.places.Autocomplete(waypoint0, options)

    // print results on submit the form
    $('#distance-form').submit(function (e) {
        e.preventDefault();
        calcRoute();
    });

}// end of initMap()

//detect user's request to add waypoint
document.getElementById('distance-moreWaypoint').onclick = function () {
    let distanceForm = document.getElementById('distance-form')
    let div = document.createElement("div");
    div.setAttribute('class', "form-group")
    div.innerHTML = `
        <label><i class="fa-solid fa-location-arrow"></i>Waypoint (if any)</label>
        <div>
            <input type="text"  placeholder="Please enter your waypoint" class="form-control long-input waypoint-distance">
        </div>`

    distanceForm.append(div)

}

// Features: weather API
function checkWeather() {
    document.getElementById('weather-container').style.display = "block"
    //initiate request to external API to find weather forecast
    fetch('https://api.openweathermap.org/data/2.5/onecall?lat=51.51&lon=-0.12&exclude=hourly,minutely&appid=700171ba1750331f7af9de8b65bf3c16')
        .then(response => response.json())
        .then(data => {

            document.querySelectorAll(".weatherResultRow").forEach(el => el.remove());
            let weatherResultTable = document.getElementById('weather-result-table')

            //using moment js to generate coming 7 days (return in array)
            let days = [];
            let daysRequired = 7

            for (let i = 1; i <= daysRequired; i++) {
                days.push(moment().add(i, 'days').format('dddd, Do MMMM YYYY'))
            }

            for (let i = 0; i < 7; i++) {
                let row = document.createElement("tr")
                row.setAttribute("class", "weatherResultRow")
                row.innerHTML = `<tr>
                        <td>${days[i]}</td>
                        <td>${data.daily[i].weather[0].description}</td>
                        <td>${data.daily[i].temp.max}F - ${data.daily[i].temp.min}F</td>
                        <td>${data.daily[i].feels_like.day}F - ${data.daily[i].feels_like.morn}F</td>
                        <td>${data.daily[i].rain * 100}%</td>
                        <td>${data.daily[i].humidity}%</td>
                        <td>${data.daily[i].wind_speed}km/h</td>
                    </tr>`

                weatherResultTable.appendChild(row)
            }

        })
        .catch(err => alert("Could not find such city name! (Or the quota of using this API for this minute is up, please try again later)"));
}

//end of weather API///

//rest the add record form
function reset() {
    document.getElementById("AddRecord").reset();
}
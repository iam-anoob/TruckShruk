var autocomplete1, autocomplete2, lat1, lat2, lng1, lng2, place1, place2;
function activatePlacesSearch() {

  var options = {
    types: ['(cities)'],
    componentRestrictions: {country: "in"}
  };

  var input1 = document.getElementById('pickupCity');
  var autocomplete1 = new google.maps.places.Autocomplete(input1, options);
  google.maps.event.addListener(autocomplete1, 'place_changed', function () {
        place1 = autocomplete1.getPlace();
      });

  var input2 = document.getElementById('dropCity');
  var autocomplete2 = new google.maps.places.Autocomplete(input2, options);
  google.maps.event.addListener(autocomplete2, 'place_changed', function () {
        place2 = autocomplete2.getPlace();

  var origin = place1.name;
  var destination = place2.name;

  var service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [origin],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(Date.now() + 0),
        trafficModel: 'optimistic'},
      unitSystem: google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    }, callback);

    function callback(response, status) {
  if (status == 'OK') {

      var results = response.rows[0].elements;

        var element = results[0];
        var distance = element.distance.text;

        var duration = element.duration.text;
        $.post("http://localhost:1234/booking",{distance:distance, duration:duration});
  }
  }

});
}

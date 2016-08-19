var authtoken;

var entries = [];
var weightchartdata = [];
var bodyfatchartdata = [];
var musclechartdata = [];
var waterchartdata = [];

$("#email").val(localStorage.getItem("email"));
$("#password").val(localStorage.getItem("password"));

$("#signinform").submit(function(event) {
  event.preventDefault();
  signin();
});

$("#signoutbutton").click(function() {
  entries = [];
  weightchartdata = [];
  bodyfatchartdata = [];
  musclechartdata = [];
  waterchartdata = [];

  $("#signinform").show();

  // hide the controls
  $("#toolbar").hide();
  $("#tablecontainer").hide();
  $("#weightchart").hide();
  $("#bodyfatchart").hide();
  $("#musclechart").hide();
  $("#waterchart").hide();
});

$("#getNewEntriesButton").click(function() {
  getNewEntries();
});

function signin() {
  var email = $("#email").val();
  var password = $("#password").val();
  localStorage.setItem("email", email);
  localStorage.setItem("password", password);
  password = sha256(password);
  var formData = {
    email: email,
    password: password
  };

  $.ajax({
      url: "https://api.weightgurus.com/v2/user/login",
      type: "POST",
      headers: {
        Accept: "application/json"
      },
      data: formData
    })
    .done(function(data) {
      authtoken = data.auth_token;
      $("#signinform").hide();
      getNewEntries();
    });
}

function compareEntriesByTimestampDesc(a, b) {
  var at = 0;
  var bt = 0;

  if (a != null && a.timestamp != null)
    at = a.timestamp;

  if (b != null && b.timestamp != null)
    bt = b.timestamp;

  return bt - at;
}

function removeEntry(array, item) {
  // find the entry in the array
  var entry = array.find(function(element, index, array) {
    return element[0] = item.timestamp;
  }, item);

  // remove the entry from the array
  if (entry != null) {
    var entryIndex = array.indexOf(entry);
    array.splice(entryIndex, 1);
  }
}

function getNewEntries() {
  $("#table > tbody").empty();

  var start = 1000000000000;

  // if (entries.length > 0)
  //   start = entries[0].timestamp + 1000;

  var formData = {
    auth_token: authtoken,
    start: start
  };

  $.ajax({
      url: "https://api.weightgurus.com/v2/entry/list",
      type: "POST",
      headers: {
        Accept: "application/json"
      },
      data: formData
    })
    .done(function(data) {
      entries = data;
      weightchartdata = [];
      bodyfatchartdata = [];
      musclechartdata = [];
      waterchartdata = [];

      // sort the entries newest to oldes
      entries.sort(compareEntriesByTimestampDesc);

      entries.forEach(function(item, index) {
        if (item.op != "create")
          return;

        var timestamp = item.timestamp;
        var date = new Date(timestamp);

        var bodyfat = null;
        if (item.body_fat != null)
          bodyfat = item.body_fat.toLocaleString({
            style: "percent"
          });

        var musclemass = null;
        if (item.muscle_mass != null)
          musclemass = item.muscle_mass.toLocaleString({
            style: "percent"
          });

        var water = null;
        if (item.water != null)
          water = item.water.toLocaleString({
            style: "percent"
          });

        // add the entry to the chart
        if (item.weight != null)
          weightchartdata.push([
            timestamp,
            item.weight
          ]);

        if (item.body_fat != null)
          bodyfatchartdata.push([
            timestamp, +(Math.round(item.body_fat + "e+2") + "e-2")
          ]);

        if (item.muscle_mass != null)
          musclechartdata.push([
            timestamp,
            item.muscle_mass
          ]);

        if (item.water != null)
          waterchartdata.push([
            timestamp,
            item.water
          ]);

        // add the entry to the table
        $("#table > tbody:last-child")
          .append($('<tr id="' + item.timestamp + '">')
            .append($('<td>')
              .text(date.toLocaleDateString())
            )
            .append($('<td>')
              .text(item.weight)
            )
            .append($('<td>')
              .text(bodyfat + '%')
            )
            .append($('<td>')
              .text(water + '%')
            )
            .append($('<td>')
              .text(musclemass + '%')
            )
            .append($('<td>')
              .text(item.type)
            )
          );
      });

      // remove any entries that are marked for deletion
      entries.forEach(function(item, index) {
        if (item.op != "delete")
          return;

        // remove the entry from the table
        // $("#" + item.timestamp).addClass("danger");
        $("#" + item.timestamp).remove();

        removeEntry(weightchartdata, item);
        removeEntry(bodyfatchartdata, item);
        removeEntry(musclechartdata, item);
        removeEntry(waterchartdata, item);
      });

      // show the controls
      $("#toolbar").show();
      $("#tablecontainer").show();
      $("#weightchart").show();
      $("#bodyfatchart").show();
      $("#musclechart").show();
      $("#waterchart").show();

      // load the charts
      $('#weightchart').highcharts({
        title: {
          text: 'Weight'
        },
        xAxis: {
          type: 'datetime'
        },
        yAxis: {
          title: {
            text: 'Pounds'
          }
        },
        legend: {
          enabled: false
        },
        series: [{
          type: 'line',
          name: 'Weight',
          data: weightchartdata
        }]
      });

      $('#bodyfatchart').highcharts({
        title: {
          text: 'Body Fat'
        },
        xAxis: {
          type: 'datetime'
        },
        yAxis: {
          title: {
            text: '%'
          }
        },
        legend: {
          enabled: false
        },
        series: [{
          type: 'line',
          name: 'Body Fat',
          data: bodyfatchartdata
        }]
      });

      $('#musclechart').highcharts({
        title: {
          text: 'Muscle Mass'
        },
        xAxis: {
          type: 'datetime'
        },
        yAxis: {
          title: {
            text: '%'
          }
        },
        legend: {
          enabled: false
        },
        series: [{
          type: 'line',
          name: 'Muscle Mass',
          data: musclechartdata
        }]
      });

      $('#waterchart').highcharts({
        title: {
          text: 'Water'
        },
        xAxis: {
          type: 'datetime'
        },
        yAxis: {
          title: {
            text: '%'
          }
        },
        legend: {
          enabled: false
        },
        series: [{
          type: 'line',
          name: 'Water',
          data: waterchartdata
        }]
      });

    });
}

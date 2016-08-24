var shiftWindow = function() {
  scrollBy(0, -50)
};
if (location.hash) shiftWindow();
window.addEventListener("hashchange", shiftWindow);

var authtoken;

var entries = [];
var weightchartdata = [];
var bodyfatchartdata = [];
var musclechartdata = [];
var waterchartdata = [];

var weight;
var bodyfat;

var userdata;

$("#email").val(localStorage.getItem("email"));
$("#password").val(localStorage.getItem("password"));

function calculateBmi() {
    var height = userdata.height;
    $("#height").html(height.toString() + " inches");
    var bmi = 703 * (weight / (height * height));
    bmi = +(Math.round(bmi + "e+2") + "e-2");

    var bmicategory = getBmiCategory(bmi);

    $("#bmi").html(bmi.toString() + " kg/m&#x00B2;");
    $("#bmi").addClass(bmicategory.class);

    $("#bmicategory").html(" - " + bmicategory.name + " (" + bmicategory.from + " - " + bmicategory.to + ")");
    $("#bmicategory").addClass(bmicategory.class);

    var bodyfatcategory = getBodyFatCategory(userdata.gender, bodyfat);

    $("#body_fat").html(bodyfat.toString() + "%");
    $("#body_fat").addClass(bodyfatcategory.class);

    $("#bodyfatcategory").html(" - " + bodyfatcategory.name + " (" + bodyfatcategory.from + " - " + bodyfatcategory.to + ")");
    $("#bodyfatcategory").addClass(bodyfatcategory.class);
}

$("#signinform").submit(function(event) {
  event.preventDefault();
  signin();
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
      userdata = data;
      authtoken = data.auth_token;
      $("#signinform").hide();
      getEntries();
    });
}

function compareEntriesByTimestampAsc(a, b) {
  var at = 0;
  var bt = 0;

  if (a != null && a.timestamp != null)
    at = a.timestamp;

  if (b != null && b.timestamp != null)
    bt = b.timestamp;

  return at - bt;
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

function getChange(oldest, newest) {
  var change = 0;
  if (newest > oldest) {
    change = newest - oldest;
  } else if (oldest > newest) {
    change = oldest - newest;
  }
  change = +(Math.round(change + "e+2") + "e-2");
  return change;
}

function getChangeClass(oldest, newest) {
  var changeclass = "";
  if (newest > oldest) {
    changeclass = "glyphicon glyphicon-chevron-up";
  } else if (oldest > newest) {
    changeclass = "glyphicon glyphicon-chevron-down";
  }

  return changeclass;
}

function getChangeColorClass(oldest, newest) {
  var changeclass = "";
  if (newest > oldest) {
    changeclass = "text-danger";
  } else if (oldest > newest) {
    changeclass = "text-success";
  }

  return changeclass;
}

function getEntries() {
  var start = 1000000000000;

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
      loadEntries(data);
      calculateBmi();
    });
}

function removeEntries(data, entries) {
  data.forEach(function(item, index) {
    if (item.op == "delete") {
      // find the entry in the array
      var entry = entries.find(function(element, index, array) {
        return element[0] = item.timestamp;
      }, item);

      // remove the entry from the array
      if (entry != null) {
        var entryIndex = entries.indexOf(entry);
        entries.splice(entryIndex, 1);
      }
    }

    if (item.op == "delete" || item.body_fat == null || item.muscle_mass == null || item.water == null) {
      var index = entries.indexOf(item);
      entries.splice(index, 1);
    }
  });
}

function loadEntries(data) {
  entries = data.slice();

  // sort the entries from oldest to newest (required by highcharts)
  entries.sort(compareEntriesByTimestampAsc);

  // remove any entries that are marked for deletion
  removeEntries(data, entries);

  entries.forEach(function(item, index) {
    if (item.op != "create")
      return;

    var timestamp = item.timestamp;
    var date = new Date(timestamp);

    item.body_fat = +(Math.round(item.body_fat + "e+2") + "e-2");
    item.muscle_mass = +(Math.round(item.muscle_mass + "e+2") + "e-2");
    item.water = +(Math.round(item.water + "e+2") + "e-2");

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

    // add the entry to the charts
    if (item.weight != null)
      weightchartdata.push([
        timestamp,
        item.weight
      ]);

    if (item.body_fat != null)
      bodyfatchartdata.push([
        timestamp, item.body_fat
      ]);

    if (item.muscle_mass != null)
      musclechartdata.push([
        timestamp, item.muscle_mass
      ]);

    if (item.water != null)
      waterchartdata.push([
        timestamp, item.water
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
      );
  });

  var newestEntry = entries[entries.length - 1];
  var oldestEntry = entries[0];

  weight = newestEntry.weight;
  bodyfat = newestEntry.body_fat;

  $("#startdate").text(new Date(oldestEntry.timestamp).toLocaleDateString());
  $("#enddate").text(new Date(newestEntry.timestamp).toLocaleDateString());

  var spanclass = getChangeClass(oldestEntry.weight, newestEntry.weight);
  var change = getChange(oldestEntry.weight, newestEntry.weight);
  $("#startweight").text(oldestEntry.weight + " lbs");
  $("#endweight").text(newestEntry.weight + " lbs");
  $("#weightchange").addClass(spanclass);
  $("#weightchange").addClass(getChangeColorClass(oldestEntry.weight, newestEntry.weight));
  $("#weightchange").text(change + " lbs");

  spanclass = getChangeClass(oldestEntry.body_fat, newestEntry.body_fat);
  change = getChange(oldestEntry.body_fat, newestEntry.body_fat);
  $("#startbodyfat").text(oldestEntry.body_fat + "%");
  $("#endbodyfat").text(newestEntry.body_fat + "%");
  $("#bodyfatchange").addClass(spanclass);
  $("#bodyfatchange").addClass(getChangeColorClass(oldestEntry.body_fat, newestEntry.body_fat));
  $("#bodyfatchange").text(change + "%");

  spanclass = getChangeClass(oldestEntry.muscle_mass, newestEntry.muscle_mass, true);
  change = getChange(oldestEntry.muscle_mass, newestEntry.muscle_mass);
  $("#startmusclemass").text(oldestEntry.muscle_mass + "%");
  $("#endmusclemass").text(newestEntry.muscle_mass + "%");
  $("#musclemasschange").addClass(spanclass);
  $("#musclemasschange").addClass(getChangeColorClass(newestEntry.muscle_mass, oldestEntry.muscle_mass));
  $("#musclemasschange").text(change + "%");

  spanclass = getChangeClass(oldestEntry.water, newestEntry.water, true);
  change = getChange(oldestEntry.water, newestEntry.water);
  $("#startwater").text(oldestEntry.water + "%");
  $("#endwater").text(newestEntry.water + "%");
  $("#waterchange").addClass(spanclass);
  $("#waterchange").addClass(getChangeColorClass(newestEntry.water, oldestEntry.water));
  $("#waterchange").text(change + "%");

  // show the controls
  $("#datacontainer").show();
  $("#navbar-links").show();
  $("#navbar-right").show();

  $("#table").tablesorter({
    sortList: [
      [0, 1]
    ]
  });

  // load the charts
  $('#weight').highcharts({
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

  $('#bodyfat').highcharts({
    title: {
      text: 'Fat'
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
      name: 'Fat',
      data: bodyfatchartdata
    }]
  });

  $('#musclemass').highcharts({
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
      name: 'Muscle',
      data: musclechartdata
    }]
  });

  $('#water').highcharts({
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
}

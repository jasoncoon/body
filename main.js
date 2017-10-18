var shiftWindow = function () {
  scrollBy(0, -50)
};
if (location.hash) shiftWindow();
window.addEventListener("hashchange", shiftWindow);

var authtoken;

var data = [];
var weightchartdata = [];
var bodyfatchartdata = [];
var bmichartdata = [];
var musclechartdata = [];
var waterchartdata = [];

var weight;
var bodyfat;

var userdata;

var showDeleted = false;

$("#email").val(localStorage.getItem("email"));
$("#password").val(localStorage.getItem("password"));
$("#showDeleted").prop("checked", localStorage.getItem("showDeleted") == "true");

function calculateBmi() {
  var height = userdata.height;
  $("#height").html(height.toString() + " inches");
}

$("#signinform").submit(function (event) {
  event.preventDefault();
  signin();
});

function signin() {
  var email = $("#email").val();
  var password = $("#password").val();
  showDeleted = $("#showDeleted").prop("checked");
  localStorage.setItem("email", email);
  localStorage.setItem("password", password);
  localStorage.setItem("showDeleted", showDeleted);
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
    .done(function (data) {
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
  .done(function (data) {
    loadEntries(data);
    calculateBmi();
  });
}

function markDeletedEntries(data) {
  data.forEach(function (item, index) {
    if (item.op == "delete") {
      // find the entry in the array
      var entry = data.find(function (element, index, array) {
        return element.timestamp == item.timestamp;
      }, item);

      // remove the entry from the array
      if (entry != null) {
        entry.deleted = true;
      }
    }

    if (item.op == "delete" || item.body_fat == null || item.muscle_mass == null || item.water == null) {
      item.deleted = true;
    }
  });
}

function loadEntries(data) {
  // sort the data from oldest to newest (required by highcharts)
  data.sort(compareEntriesByTimestampAsc);

  // flag any data that are marked for deletion
  markDeletedEntries(data);

  var newestEntry;
  var oldestEntry;

  var height = userdata.height;

  data.forEach(function (item, index) {
    if (item.op != "create" || (item.deleted && !showDeleted))
      return;

    if (newestEntry == null || item.timestamp > newestEntry.timestamp)
      newestEntry = item;

    if (oldestEntry == null || item.timestamp < oldestEntry.timestamp)
      oldestEntry = item;

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
    if (item.weight != null) {
      item.bmi = getBMI(height, item.weight);

      weightchartdata.push([
        timestamp,
        item.weight
      ]);
    }

    if (item.body_fat != null)
      bodyfatchartdata.push([
        timestamp, item.body_fat
      ]);

    if (item.bmi != null)
      bmichartdata.push([
        timestamp, item.bmi
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
          .text(item.bmi)
        )
        .append($('<td>')
          .text(water + '%')
        )
        .append($('<td>')
          .text(musclemass + '%')
        )
      );
  });

  weight = newestEntry.weight;
  bodyfat = newestEntry.body_fat;

  $(".startdate").text("Start: " + new Date(oldestEntry.timestamp).toLocaleDateString());
  $(".enddate").text("Current: " + new Date(newestEntry.timestamp).toLocaleDateString());

  var elapsed = newestEntry.timestamp - oldestEntry.timestamp;
  var elapsedDays = elapsed / (1000 * 60 * 60 * 24);
  elapsedDays = +(Math.round(elapsedDays + "e+2") + "e-2");

  var spanclass = getChangeClass(oldestEntry.weight, newestEntry.weight);
  var change = getChange(oldestEntry.weight, newestEntry.weight);

  var lostWeightPerDay = change / elapsedDays;
  lostWeightPerDay = +(Math.round(lostWeightPerDay + "e+2") + "e-2");

  $(".startweight").text(oldestEntry.weight + " lbs");
  $(".endweight").text(newestEntry.weight + " lbs");
  $("#weight").text(newestEntry.weight + " lbs, lost " + change + " lbs in " + elapsedDays + " days, or " + lostWeightPerDay + " lbs per day.");
  $(".weightchange").addClass(spanclass);
  $(".weightchange").addClass(getChangeColorClass(oldestEntry.weight, newestEntry.weight));
  $(".weightchange").text(change + " lbs");

  var oldestBodyFatCategory = getBodyFatCategory(userdata.gender, oldestEntry.body_fat);
  var newestBodyFatCategory = getBodyFatCategory(userdata.gender, newestEntry.body_fat);

  spanclass = getChangeClass(oldestEntry.body_fat, newestEntry.body_fat);
  change = getChange(oldestEntry.body_fat, newestEntry.body_fat);
  $(".startbodyfat").text(oldestEntry.body_fat + "% - " + oldestBodyFatCategory.name + " (" + oldestBodyFatCategory.from + " - " + oldestBodyFatCategory.to + ")");
  $(".endbodyfat").text(newestEntry.body_fat + "% - " + newestBodyFatCategory.name + " (" + newestBodyFatCategory.from + " - " + newestBodyFatCategory.to + ")");
  $("#bodyfat").text(newestEntry.body_fat + "% - " + newestBodyFatCategory.name + " (" + newestBodyFatCategory.from + " - " + newestBodyFatCategory.to + ")");
  $(".startbodyfat").addClass(oldestBodyFatCategory.class);
  $(".endbodyfat").addClass(newestBodyFatCategory.class);
  $("#bodyfat").addClass(newestBodyFatCategory.class);
  $(".bodyfatchange").addClass(spanclass);
  $(".bodyfatchange").addClass(getChangeColorClass(oldestEntry.body_fat, newestEntry.body_fat));
  $(".bodyfatchange").text(change + "%");

  var oldestBmiCategory = getBmiCategory(oldestEntry.bmi);
  var newestBmiCategory = getBmiCategory(newestEntry.bmi);

  spanclass = getChangeClass(oldestEntry.bmi, newestEntry.bmi);
  change = getChange(oldestEntry.bmi, newestEntry.bmi);
  $(".startbmi").html(oldestEntry.bmi + " kg/m&#x00B2; - " + oldestBmiCategory.name + " (" + oldestBmiCategory.from + " - " + oldestBmiCategory.to + ")");
  $(".endbmi").html(newestEntry.bmi + " kg/m&#x00B2; - " + newestBmiCategory.name + " (" + newestBmiCategory.from + " - " + newestBmiCategory.to + ")");
  $("#bmi").html(newestEntry.bmi + " kg/m&#x00B2; - " + newestBmiCategory.name + " (" + newestBmiCategory.from + " - " + newestBmiCategory.to + ")");
  $(".startbmi").addClass(oldestBmiCategory.class);
  $(".endbmi").addClass(newestBmiCategory.class);
  $("#bmi").addClass(newestBmiCategory.class);
  $(".bmichange").addClass(spanclass);
  $(".bmichange").addClass(getChangeColorClass(oldestEntry.bmi, newestEntry.bmi));
  $(".bmichange").html(change + " kg/m&#x00B2;");

  spanclass = getChangeClass(oldestEntry.muscle_mass, newestEntry.muscle_mass, true);
  change = getChange(oldestEntry.muscle_mass, newestEntry.muscle_mass);
  $(".startmusclemass").text(oldestEntry.muscle_mass + "%");
  $(".endmusclemass").text(newestEntry.muscle_mass + "%");
  $(".musclemasschange").addClass(spanclass);
  $(".musclemasschange").addClass(getChangeColorClass(newestEntry.muscle_mass, oldestEntry.muscle_mass));
  $(".musclemasschange").text(change + "%");

  spanclass = getChangeClass(oldestEntry.water, newestEntry.water, true);
  change = getChange(oldestEntry.water, newestEntry.water);
  $(".startwater").text(oldestEntry.water + "%");
  $(".endwater").text(newestEntry.water + "%");
  $(".waterchange").addClass(spanclass);
  $(".waterchange").addClass(getChangeColorClass(newestEntry.water, oldestEntry.water));
  $(".waterchange").text(change + "%");

  var bodyFatCategoryIndex = getBodyFatCategoryIndex(userdata.gender, newestEntry.body_fat);
  if(bodyFatCategoryIndex > 0) {
    nextBodyFatCategory = getBodyFatCategoryByIndex(userdata.gender, bodyFatCategoryIndex - 1);

    var bodyFatDifference = newestEntry.body_fat - nextBodyFatCategory.to;
    bodyFatDifference = +(Math.round(bodyFatDifference + "e+2") + "e-2");

    var bodyFatWeight = (bodyFatDifference / 100) * newestEntry.weight;
    bodyFatWeight = +(Math.round(bodyFatWeight + "e+2") + "e-2");

    $("#goalbodyfat").html("Lose " + bodyFatDifference + "% body fat (" + bodyFatWeight + " lbs) to " + nextBodyFatCategory.to + "% - " + getCategoryElement(nextBodyFatCategory));
    var estimatedDays = bodyFatWeight / lostWeightPerDay;
    estimatedDays = +(Math.round(estimatedDays + "e+2") + "e-2");
    var estimatedDate = new Date(newestEntry.timestamp + estimatedDays * (1000 * 60 * 60 * 24)).toLocaleDateString();
    $("#goalbodyfat").append("<br />Estimated " + estimatedDays + " days (" + estimatedDate + ") at average rate")
  }

  var bmiCategoryIndex = getBmiCategoryIndex(newestEntry.bmi);
  if(bmiCategoryIndex > 0) {
    nextBmiCategory = bmiCategories[bmiCategoryIndex - 1];

    var bmiDifference = newestEntry.bmi - nextBmiCategory.to;
    bmiDifference = +(Math.round(bmiDifference + "e+2") + "e-2");

    var nextWeight = getWeight(userdata.height, nextBmiCategory.to);
    nextWeight = +(Math.round(nextWeight + "e+2") + "e-2");

    var weightDifference = newestEntry.weight - nextWeight;
    weightDifference = +(Math.round(weightDifference + "e+2") + "e-2");

    $("#goalbmi").html("Lose " + weightDifference + " lbs (" + bmiDifference + "kg/m&#x00B2;) to " + nextWeight + " lbs - " + getCategoryElement(nextBmiCategory));
    var estimatedDays = weightDifference / lostWeightPerDay;
    estimatedDays = +(Math.round(estimatedDays + "e+2") + "e-2");
    var estimatedDate = new Date(newestEntry.timestamp + estimatedDays * (1000 * 60 * 60 * 24)).toLocaleDateString();
    $("#goalbmi").append("<br />Estimated " + estimatedDays + " days (" + estimatedDate + ") at average rate")
  }

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
    trendlines: { 0: {} },
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
    trendlines: { 0: {} },
    series: [{
      type: 'line',
      name: 'Body Fat',
      data: bodyfatchartdata
    }]
  });

  $('#bmichart').highcharts({
    title: {
      text: 'BMI'
    },
    xAxis: {
      type: 'datetime'
    },
    yAxis: {
      title: {
        text: 'kg/m²'
      }
    },
    legend: {
      enabled: false
    },
    trendlines: { 0: {} },
    series: [{
      type: 'line',
      name: 'BMI',
      data: bmichartdata
    }]
  });

  $('#musclemasschart').highcharts({
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
    trendlines: { 0: {} },
    series: [{
      type: 'line',
      name: 'Muscle',
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
    trendlines: { 0: {} },
    series: [{
      type: 'line',
      name: 'Water',
      data: waterchartdata
    }]
  });
}

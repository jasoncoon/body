var bmiCategories = [
  { from: 0, to: 15, name: "Very severely underweight", class: "text-danger" },
  { from: 15, to: 16, name: "Severely underweight", class: "text-danger" },
  { from: 16, to: 18.5, name: "Underweight", class: "text-warning" },
  { from: 18.5, to: 25, name: "Normal (healthy weight)", class: "text-success" },
  { from: 25, to: 30, name: "Overweight", class: "text-warning" },
  { from: 30, to: 35, name: "Obese Class I (Moderately obese)", class: "text-danger" },
  { from: 35, to: 40, name: "Obese Class II (Severely obese)", class: "text-danger" },
  { from: 40, to: 99, name: "Obese Class III (Very severely obese)", class: "text-danger" }
];

function getBmiCategory(bmi) {
  for(i = 0; i < bmiCategories.length; i++) {
    if(bmi <= bmiCategories[i].to)
      return bmiCategories[i];
  }
}

var maleBodyFatCategories = [
  { from: 2, to: 5, name: "Essential fat", class: "text-danger" },
  { from: 6, to: 13, name: "Athletic", class: "text-success" },
  { from: 14, to: 17, name: "Fit", class: "text-success" },
  { from: 18, to: 24, name: "Average", class: "text-warning" },
  { from: 25, to: 100, name: "Obese", class: "text-danger" },
];

var femaleBodyFatCategories = [
  { from: 10, to: 13, name: "Essential fat", class: "text-danger" },
  { from: 14, to: 20, name: "Athletic", class: "text-success" },
  { from: 21, to: 24, name: "Fit", class: "text-success" },
  { from: 25, to: 31, name: "Average", class: "text-warning" },
  { from: 32, to: 100, name: "Obese", class: "text-danger" },
];

function getBodyFatCategory(gender, bodyfat) {
  var array = maleBodyFatCategories;
  if(gender != "Male")
    array = femaleBodyFatCategories;

  for(i = 0; i < array.length; i++) {
    if(bodyfat <= array[i].to)
      return array[i];
  }
}

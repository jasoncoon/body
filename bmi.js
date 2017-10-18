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

function getBMI(height, weight) {
  var bmi = 703 * (weight / (height * height));

  return +(Math.round(bmi + "e+2") + "e-2");
}

function getWeight(height, bmi) {
  var weight = (bmi / 703) * (height * height);
  return +(Math.round(weight + "e+2") + "e-2");
}

function getBmiCategory(bmi) {
  for(i = 0; i < bmiCategories.length; i++) {
    if(bmi < bmiCategories[i].to)
      return bmiCategories[i];
  }
}

function getBmiCategoryIndex(bmi) {
  for(i = 0; i < bmiCategories.length; i++) {
    if(bmi < bmiCategories[i].to)
      return i;
  }
}

function getCategoryDescription(category) {
  return category.name  + " (" + category.from + " - " + category.to + ")"
}

function getCategoryElement(category) {
  return "<span class='" + category.class + "'>" + getCategoryDescription(category) + "</span>";
}

var maleBodyFatCategories = [
  { from: 2, to: 6, name: "Essential fat", class: "text-danger" },
  { from: 6, to: 14, name: "Athletic", class: "text-success" },
  { from: 14, to: 18, name: "Fit", class: "text-success" },
  { from: 18, to: 25, name: "Average", class: "text-warning" },
  { from: 25, to: 100, name: "Obese", class: "text-danger" },
];

var femaleBodyFatCategories = [
  { from: 10, to: 14, name: "Essential fat", class: "text-danger" },
  { from: 14, to: 21, name: "Athletic", class: "text-success" },
  { from: 21, to: 25, name: "Fit", class: "text-success" },
  { from: 25, to: 32, name: "Average", class: "text-warning" },
  { from: 32, to: 100, name: "Obese", class: "text-danger" },
];

function getBodyFatCategory(gender, bodyfat) {
  var array = maleBodyFatCategories;
  if(gender != "Male")
    array = femaleBodyFatCategories;

  for(i = 0; i < array.length; i++) {
    if(bodyfat < array[i].to)
      return array[i];
  }
}

function getBodyFatCategoryIndex(gender, bodyfat) {
  var array = maleBodyFatCategories;
  if(gender != "Male")
    array = femaleBodyFatCategories;

  for(i = 0; i < array.length; i++) {
    if(bodyfat < array[i].to)
      return i;
  }
}

function getBodyFatCategoryByIndex(gender, index) {
  var array = maleBodyFatCategories;
  if(gender != "Male")
    array = femaleBodyFatCategories;

  return array[index];
}

let input = document.getElementById("input-el");
let btn = document.getElementById("input-btn");
let length = document.getElementById("length");
let volume =  document.getElementById("volume");
let mass = document.getElementById("mass");

btn.addEventListener("click", function(){
    inputValue = Number(input.value);
    convert(inputValue);
});

function convert(value){
    let meter = value * 0.3048;
    let feet = value * 3.28084;
    let liter = value * 3.78541;
    let gallon = value * 0.264172;
    let kilogram = value * 0.453592;
    let pound = value * 2.20462;
    length.textContent = `${value} feet = ${meter.toFixed(3)} meters | ${value} meters = ${feet.toFixed(3)} feet`;
    volume.textContent = `${value} gallons = ${liter.toFixed(3)} liters | ${value} liters = ${gallon.toFixed(3)} gallons`;
    mass.textContent = `${value} pounds = ${kilogram.toFixed(3)} kilograms | ${value} kilograms = ${pound.toFixed(3)} pounds`;
}


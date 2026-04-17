let runningTotal = 0;
let buffer = "0";
let previousOperator;
let shouldResetBuffer = false;

const screen = document.querySelector(".screen");

function buttonClick(value) {
    const input = value.trim();
    if (isNaN(input)) {
        handleSymbol(input);
    } else {
        handleNumber(input);
    }
    screen.textContent = buffer;
    screen.classList.add("screen-active");
}

screen.addEventListener("animationend", function() {
    screen.classList.remove("screen-active");
});

function handleSymbol(symbol) {
    switch (symbol) {
        case "c":
            buffer = "0";
            runningTotal = 0;
            previousOperator = null;
            shouldResetBuffer = false;
            break;
        case "←":
            buffer = buffer.slice(0, -1) || "0";
            break;
        case "±":
            buffer = (Number(buffer) * -1).toString();
            break;
        case ".":
            if (shouldResetBuffer) {
                buffer = "0.";
                shouldResetBuffer = false;
            } else if (!buffer.includes(".")) {
                buffer += ".";
            }
            break;
        case "÷":
        case "×":
        case "-":
        case "−":
        case "+":
            if (previousOperator !== null && !shouldResetBuffer) {
                const result = calculate(runningTotal, parseNumber(buffer), previousOperator);
                if (result === "Error") {
                    buffer = result;
                    runningTotal = 0;
                    previousOperator = null;
                    shouldResetBuffer = true;
                    break;
                }
                runningTotal = result;
            } else if (previousOperator === null) {
                runningTotal = parseNumber(buffer);
            }
            previousOperator = symbol;
            shouldResetBuffer = true;
            break;
        case "=":
            if (previousOperator !== null) {
                const result = calculate(runningTotal, parseNumber(buffer), previousOperator);
                buffer = result.toString();
                runningTotal = 0;
                previousOperator = null;
                shouldResetBuffer = true;
            }
            break;
    }
}

function handleNumber(number) {
    if (buffer === "0" || shouldResetBuffer) {
        buffer = number;
        shouldResetBuffer = false;
    } else {
        buffer += number;
    }
}

function parseNumber(value) {
    return isIntegerString(value) ? BigInt(value) : Number(value);
}

function isIntegerString(value) {
    return /^-?\d+$/.test(value);
}

function calculate(num1, num2, operator) {
    const integerMath = typeof num1 === "bigint" && typeof num2 === "bigint";
    switch (operator) {
        case "+":
            return integerMath ? num1 + num2 : Number(num1) + Number(num2);
        case "-":
        case "−":
            return integerMath ? num1 - num2 : Number(num1) - Number(num2);
        case "×":
            return integerMath ? num1 * num2 : Number(num1) * Number(num2);
        case "÷":
            if (Number(num2) === 0) {
                return "Error";
            }
            return Number(num1) / Number(num2);
    }
}

document.querySelector(".calc-buttons").addEventListener("click", function(event) {
    if (event.target.classList.contains("calc-button")) {
        buttonClick(event.target.textContent);
    }
});


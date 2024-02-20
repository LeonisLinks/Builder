const { program } = require('commander');
const ora = require('ora');
const yaml = require('js-yaml');
const fs = require('fs');

program
	.option('-i, --input', 'Input file')
	.option('-o, --output', 'Output folder')

let input = program.opts().input;
let output = program.opts().output;

if (!input) input = "config.yml"
if (!output) output = "output"

const spinners = [ora(`Loading ${input}`).start()];
let parsedData;

try {
	let data = fs.readFileSync(input, { encoding: 'utf8' });
	parsedData = yaml.load(data);

	if (!parsedData) return spinners[0].fail(`Error loading ${input}: No data found`);
	if (parsedData instanceof Error) return spinners[0].fail(`Error loading ${input}: ${parsedData.message}`);
	if (!parsedData.name || !parsedData.description || !parsedData.background) return spinners[0].fail(`Error loading ${input}: Invalid data`);

	spinners[0].succeed(`Loaded ${input}`);
} catch(e) {
	spinners[0].fail(`Error loading ${input}`);
}

// Parsing data
spinners.push(ora('Parsing data').start());

let bodyClass = "";

if (parsedData.effects.background === "night_time") {
	bodyClass = "nighttime";
} else if (parsedData.effects.background === "old_tv") {
	bodyClass = "oldtv";
} else if (parsedData.effects.back) === "blurred") {
	bodyClass = "blurred";
}
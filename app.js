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
	let data = fs.readFileSync(input, 'utf8');
} catch(e) {
	spinners[0].fail(`Error loading ${input}`);
}
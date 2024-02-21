const { program } = require('commander');
const ora = require('ora');
const yaml = require('js-yaml');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const getResourcePath = (fileName) => { return path.join(__dirname, 'resources', fileName); }

program
	.option('-i, --input', 'Input file')
	.option('-o, --output', 'Output folder')

let input = program.opts().input;
let output = program.opts().output;

if (!input) input = "config.yml"
if (!output) output = "output"

const spinners = [ora(`Cloning Leonis respository...`).start()];

if (fs.existsSync(output)) {
	spinners[0].fail(`Output folder already exists`);
	process.exit(1);
}
execSync("git clone https://github.com/LeonisLinks/Leonis.git", { stdio: "ignore" })
if (fs.existsSync("Leonis")) {
	spinners[0].succeed("Leonis repository cloned successfully");
	fs.renameSync("Leonis", output);
} else {
	spinners[0].fail("Error cloning Leonis repository");
	process.exit(1);
}

// Loading data
spinners.push(ora(`Loading ${input}`).start());

let parsedData;

try {
	let data = fs.readFileSync(input, { encoding: 'utf8' });
	parsedData = yaml.load(data);

	if (!parsedData) return spinners[1].fail(`Error loading ${input}: No data found`);
	if (parsedData instanceof Error) return spinners[1].fail(`Error loading ${input}: ${parsedData.message}`);
	if (!parsedData.name || !parsedData.description || !parsedData.background) return spinners[1].fail(`Error loading ${input}: Invalid data`);

	spinners[1].succeed(`${input} loaded`);
} catch(e) {
	spinners[1].fail(`Error loading ${input}`);
}

// Parsing data
spinners.push(ora('Parsing data').start());

let bodyClass = [];
let music;

// Effects mapping
let effects = {
	background: {
		"night_time": "nighttime",
		"old_tv": "oldtv",
		"blurred": "blurred"
	},
	name: {
		"rainbow": "name-rainbow",
		"flash": "name-flash"
	},
	description: {
		"typewriter": "description-typewrite"
	}
}

if (parsedData.effects) {
	if (parsedData.effects.background)
		if (effects.background[parsedData.effects.background]) {
			bodyClass.push(effects.background[parsedData.effects.background]);
		} else {
			spinners[2].warn(`Unknown background effect: ${parsedData.effects.background}`);
		}

	if (parsedData.effects.name)
		if (effects.name[parsedData.effects.name]) {
			bodyClass.push(effects.name[parsedData.effects.name]);
		} else {
			spinners[2].warn(`Unknown name effect: ${parsedData.effects.name}`);
		}

	if (parsedData.effects.description)
		if (effects.description[parsedData.effects.description]) {
			bodyClass.push(effects.description[parsedData.effects.description]);
		} else {
			spinners[2].warn(`Unknown description effect: ${parsedData.effects.description}`);
		}
}

// Music
if (parsedData.music) {
	if (fs.existsSync(getResourcePath(parsedData.music))) {
		bodyClass.push("music-include");
		music = `./resources/${parsedData.music}`;
	} else {
		spinners[2].warn(`Resource file not found: ${parsedData.music}`);
	}
}

// Links
let links = [];
if (parsedData.links) {
	for (let link of parsedData.links) {
		if (link.icon && link.url && link.color) {
			links.push(`<a href="${link.url}" target="_blank" class="mr-5 mb-5"><custom-icon name="${link.icon}" size="32" color="${link.color}"></custom-icon></a>`);
		}
	}
}

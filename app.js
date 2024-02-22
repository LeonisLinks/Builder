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
let layout = "center";
let informationEl = "";
let widgets = "";

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

if (parsedData.profile) {
	if (parsedData.profile.avatar) {
		if (fs.existsSync(getResourcePath(parsedData.profile.avatar))) {
			bodyClass.push("avatar-include");
			parsedData.profile.avatar = `./resources/${parsedData.profile.avatar}`;
			informationEl = `<img src="${parsedData.profile.avatar}" alt="${parsedData.name}" class="rounded-full mb-2" id="avatar">`
		}
	}
	if (parsedData.profile.layout) {
		layout = parsedData.profile.layout;
		if (layout === "center") {
			informationEl += ` <h1 id="name" class="text-5xl font-bold">${parsedData.name}</h1><p id="description" class="text-3xl mb-10">${parsedData.description}</p>`
		} else {
			informationEl += `<div id="texts" class="flex flex-col"><h1 class="text-5xl font-bold">${parsedData.name}</h1><p id="description" class="text-3xl mb-10">${parsedData.description}</p></div>`
		}
	}
	bodyClass.push(`nd-${layout}`);
	if (parsedData.profile.blur) {
		parsedData.profile.blur = parsedData.profile.blur / 100;
	}

	if (parsedData.profile.discord) {
		widgets += `<div id="discord" class="p-5 rounded-xl w-[50%] mr-2 ml-2 flex flex-row max-[1670px]:w-full max-[1670px]:mb-5">
        	<img src="https://cdn.discordapp.com/avatars/902671568856047636/df9b91c56efa46acd37844b6313c4090.png?size=1024" class="rounded-full max-[390px]:w-[32px] max-[390px]:h-[32px]" width="64px" height="64px" alt="orion_off">
        	<div id="informations" class="flex flex-col ml-5">
          	<span id="discord_name" class="text-2xl max-[390px]:text-sm max-[430px]:text-lg">orion_off</span>
          		<span id="discord_status" class="text-xl max-[390px]:text-xs max-[430px]:text-base">Elsässisch</span>
        	</div>
      	</div>`;
	}

	if (parsedData.profile.geolocation) {
		widgets += `<div id="geo" class="w-[50%] mr-2 ml-2 rounded-xl max-[1670px]:w-full">
        	<iframe src="map.html" class="w-full h-[105px] max-[390px]:h-[55px] rounded-xl"></iframe>
      	</div>`;
	}
}
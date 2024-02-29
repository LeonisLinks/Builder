const { program } = require('commander');
const ora = require('ora');
const yaml = require('js-yaml');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");
const esbuild = require("esbuild");

const getResourcePath = (fileName) => { return path.join(__dirname, 'resources', fileName); }

program
	.option('-i, --input', 'Input file')
	.option('-o, --output', 'Output folder')

let input = program.opts().input;
let output = program.opts().output;

if (!input) input = "config.yml"
if (!output) output = "output"

const spinners = [ora(`Cloning Leonis respository...`).start()];

if (fs.existsSync(output) || fs.existsSync("Leonis")) {
	spinners[0].fail(`Output folder already exists`);
	process.exit(1);
}
execSync("git clone https://github.com/LeonisLinks/Leonis.git -b template", { stdio: "ignore" })
let indexHTML;
let mapHTML;
let scriptTS;
if (fs.existsSync("Leonis")) {
	spinners[0].succeed("Leonis repository cloned successfully");
	indexHTML = fs.readFileSync("./Leonis/index.html").toString();
	mapHTML = fs.readFileSync("./Leonis/map.html").toString();
	styleCSS = fs.readFileSync("./Leonis/src/style.css").toString();
	scriptTS = fs.readFileSync("./Leonis/src/main.ts").toString();
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
	if (!fs.existsSync("./resources/" + parsedData.background)) return spinners[1].fail(`Error loading ${parsedData.background}: File doesn't exists.`)
	if (!parsedData.profile) parsedData.profile = {};

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
let links = parsedData.links.map(link => { return `<a href="${link.url}" target="_blank" class="mr-5 mb-5"><custom-icon name="${link.icon}" size="32" color="${link.color}"></custom-icon></a>` }).join("\n");

if (!parsedData.profile.layout) parsedData.profile.layout = "center";

let backend = "https://leonis.oriondev.fr"
if (parsedData.profile) {
	if (parsedData.profile.avatar) {
		if (fs.existsSync(getResourcePath(parsedData.profile.avatar))) {
			bodyClass.push("avatar-include");
			parsedData.profile.avatar = `./resources/${parsedData.profile.avatar}`;
			informationEl = `<img src="${parsedData.profile.avatar}" alt="${parsedData.name}" class="rounded-full mb-2 mr-5" id="avatar">`
		} else {
			spinners[2].warn(`Resource file not found: ${parsedData.profile.avatar}`);
			process.exit(1);
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
	styleCSS = styleCSS.replace("{TEXTLAYOUT}", layout);
	bodyClass.push(`nd-${layout}`);
	if (parsedData.profile.opacity) {
		parsedData.profile.opacity = parsedData.profile.opacity / 100;
	} else {
		parsedData.profile.opacity = 0.2;
	}
	styleCSS = styleCSS.replace("{OPACITY}", parsedData.profile.opacity);

	if (parsedData.profile.discord) {
		if (parsedData.backend) {
			backend = parsedData.backend;
			fetch(backend + "/").then(res => res.json()).then(data => {
				if (!data.leonis) {
					spinners[2].warn("Backend not found");
					process.exit(1);
				}
			}).catch(e => {
				spinners[2].warn("Backend not found");
				process.exit(1);
			})
		}

		scriptTS = scriptTS.replace("{API}", backend);
		scriptTS = scriptTS.replace("{DISCORDID}", parsedData.profile.discord);

		widgets += `<div id="discord" class="p-5 rounded-xl w-[50%] mr-2 ml-2 flex flex-row max-[1670px]:w-full max-[1670px]:mb-5">
        	<img src="" class="rounded-full max-[390px]:w-[32px] max-[390px]:h-[32px]" width="64px" height="64px" alt="">
        	<div id="informations" class="flex flex-col ml-5">
          	<span id="discord_name" class="text-2xl max-[390px]:text-sm max-[430px]:text-lg"></span>
          		<span id="discord_status" class="text-xl max-[390px]:text-xs max-[430px]:text-base"></span>
        	</div>
      	</div>`;
	}

	if (parsedData.profile.geolocation) {
		widgets += `<div id="geo" class="w-[50%] mr-2 ml-2 rounded-xl max-[1670px]:w-full">
        	<iframe src="map.html" class="w-full h-[105px] max-[390px]:h-[55px] rounded-xl"></iframe>
      	</div>`;
		mapHTML = mapHTML.replaceAll("{LAT}", parsedData.profile.geolocation.latitude)
		mapHTML = mapHTML.replaceAll("{LNG}", parsedData.profile.geolocation.longitude)
	}
}

indexHTML = indexHTML.replace("{WIDGETS}", widgets);
indexHTML = indexHTML.replace("{BODYCLASS}", bodyClass.join(" "));
if (parsedData.links) indexHTML = indexHTML.replace("{SOCIALS}", links);
indexHTML = indexHTML.replace("{INFORMATION}", informationEl);
styleCSS = styleCSS.replace("{BACKGROUND}", `../resources/${parsedData.background}`);
if (!parsedData.profile.blur) parsedData.profile.blur = "10px";
if (!parsedData.background_blur) parsedData.background_blur = "5px";
styleCSS = styleCSS.replace("{BACKGROUNDBLUR}", parsedData.background_blur);
styleCSS = styleCSS.replace("{BLUR}", parsedData.profile.blur);
if (music) indexHTML = indexHTML.replace("{MUSIC}", music);
spinners[2].succeed('Data parsed');

// Writing files
spinners.push(ora('Writing files').start());
try {
	fs.writeFileSync(`./Leonis/index.html`, indexHTML);
	fs.writeFileSync(`./Leonis/map.html`, mapHTML);
	fs.writeFileSync(`./Leonis/src/style.css`, styleCSS);
	fs.writeFileSync(`./Leonis/src/main.ts`, scriptTS);

	fs.cpSync("./resources", `./Leonis/resources`, { recursive: true });
	spinners[3].succeed('Files written');
} catch (e) {
	spinners[3].fail('Error writing files');
	process.exit(1);
}

// Building Tailwind
spinners.push(ora('Building TailwindCSS').start());
let baseConfig = require("./Leonis/tailwind.config.js");
let css = styleCSS;
const config = {
	presets: [baseConfig],
	content: [{ raw: indexHTML  }, { raw: mapHTML }]
}

postcss([tailwindcss(config)]).process(css, { from: undefined }).then(result => {
	fs.writeFileSync(`./Leonis/src/app.css`, result.toString());
	spinners[4].succeed('TailwindCSS built');

	// Building TS
	spinners.push(ora('Building TypeScript').start());
	esbuild.build({
		entryPoints: ["./Leonis/src/main.ts"],
		bundle: true,
		minify: true,
		outfile: "./Leonis/src/main.js",
		platform: "browser"
	}).then(() => {
		spinners[5].succeed('TypeScript built');

		// Rename output folder
		spinners.push(ora('Renaming output folder').start());
		try {
			fs.renameSync("Leonis", output);
			spinners[6].succeed('Output folder renamed');
		} catch (e) {
			spinners[6].fail('Error renaming output folder');
			process.exit(1);
		}
	}).catch(e => {
		spinners[5].fail('Error building TypeScript');
		process.exit(1);
	});
}).catch(e => {
	console.log(e);
	spinners[4].fail('Error building TailwindCSS');
	process.exit(1);
})
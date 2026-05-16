const fs = require("fs");
const getToken = require("./auto-token");

const sleep = ms =>
new Promise(resolve =>
setTimeout(resolve, ms)
);

const countries = [

"AU",
"HK",
"IN",
"ID",
"JP",
"KZ",
"MY",
"NZ",
"PK",
"PH",
"SG",
"KR",
"TW",
"TH",
"VN"

];

async function getLatestDates(
token
) {

let weekly;

while (true) {

weekly =
await fetch(

"https://charts-spotify-com-service.spotify.com/auth/v0/charts/album-global-weekly/latest",

{
headers: {
Authorization: token
}
}

);

if (

weekly.status === 429

) {

console.log(
"429 latestDate 😭"
);

await sleep(
8000
);

continue;

}

break;

}

const weeklyJson =
await weekly.json();

return {

weekly:

weeklyJson
?.displayChart
?.chartMetadata
?.dimensions
?.latestDate

||

weeklyJson
?.displayChart
?.date

};

}

async function scrape(
token
) {

console.log(
"SCRAPING ALBUM ASIA 😭🔥"
);

let results = [];

for (

const country
of countries

) {

for (

const type
of ["weekly"]

) {

try {

const url =

`https://charts-spotify-com-service.spotify.com/auth/v0/charts/album-${country.toLowerCase()}-${type}/latest`;

console.log(
`CHECKING ${country} ${type}`
);

let response =
await fetch(

url,

{
headers: {
Authorization: token,
Accept:
"application/json"
}
}

);

while (

response.status ===
429

) {

console.log(
`429 😭 ${country} ${type}`
);

await sleep(
8000
);

response =
await fetch(

url,

{
headers: {
Authorization: token,
Accept:
"application/json"
}
}

);

}

if (

response.status !==
200

) {

continue;

}

const data =
await response.json();

const tracks =
data.entries
||
data.chartEntryViewResponses
||
[];

for (

const track
of tracks

) {

const artists =

track.albumMetadata
?.artists
||
[];

const hasJimin =

artists.some(

artist =>

artist.name
?.toLowerCase()

=== "jimin"

);

if (

hasJimin

) {

const currentRank =

track.chartEntryData
?.currentRank;

const previousRank =

track.chartEntryData
?.previousRank;

const rankChange =

previousRank
? Math.abs(
currentRank -
previousRank
)
: 0;

let direction = "=";
let entryStatus = null;

// NEW ENTRY
if (

previousRank === null
||
previousRank === undefined

) {

entryStatus =
"NEW_ENTRY";

}

// RE-ENTRY
else if (

rankChange >= 100

) {

entryStatus =
"RE_ENTRY";

}

// NORMAL MOVEMENT
else {

if (

currentRank <
previousRank

) {

direction =
"up";

}

else if (

currentRank >
previousRank

) {

direction =
"down";

}

}

results.push({

country,
type,

rank:
currentRank,

previousRank:
previousRank,

peakRank:

track.chartEntryData
?.peakRank,

appearances:

track.chartEntryData
?.appearancesOnChart,

album:

track.albumMetadata
?.albumName,

artists:

artists.map(
a => a.name
),

image:

track.albumMetadata
?.displayImageUri,

rankChange,
direction,
entryStatus

});

console.log(

`FOUND 😭🔥 ${country} ${track.albumMetadata?.albumName}`

);

}

}

await sleep(
800
);

}

catch (err) {

console.log(
err.message
);

}

}

}

fs.writeFileSync(

"album-asia.json",

JSON.stringify(
results,
null,
2
)

);

console.log(
"UPDATED album-asia.json 😍"
);

}

async function start() {

const token =
await getToken();

let savedDates =
null;

if (

fs.existsSync(
"chart-album-asia.json"
)

) {

savedDates =
JSON.parse(

fs.readFileSync(
"chart-album-asia.json"
)

);

}

const latest =
await getLatestDates(
token
);

const firstRun =

!savedDates
||

!fs.existsSync(
"album-asia.json"
);

if (

firstRun

) {

console.log(
"FIRST RUN 😍"
);

await scrape(
token
);

fs.writeFileSync(

"chart-album-asia.json",

JSON.stringify(
latest,
null,
2
)

);

return;

}

const changed =

latest.weekly !==
savedDates.weekly;

if (

changed

) {

console.log(
"NEW CHART 😍"
);

await scrape(
token
);

fs.writeFileSync(

"chart-album-asia.json",

JSON.stringify(
latest,
null,
2
)

);

}

else {

console.log(
"SAME CHART 😴"
);

}

}

start();

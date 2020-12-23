const fs = require("fs");
const crypto = require("crypto");
const dfd = require("danfojs-node");
const puppeteer = require("puppeteer");
const { Console } = require("console");

const directory = "./wasm/";
const wrapper = fs.readFileSync("./wrapper.js", "utf8");

async function getWasm(sitename) {
    if (!fs.existsSync(directory + sitename)) {
        fs.mkdirSync(directory + sitename);
    }
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.exposeFunction("wasmFound", source => wasmFound(source, sitename));
    await page.evaluateOnNewDocument(wrapper);
    await page.goto("https://" + sitename).catch(err => { console.log("Error, trying to load HTTP version."); page.goto("http://" + sitename); })

    //Wait a bit, to make sure the Wasm has chance to load
    await new Promise(done => setTimeout(done, 1000));
    await browser.close();
}

function wasmFound(data, sitename) {
    //Use hash as filename for deduplication
    const filename = crypto.createHash("md5").update(data).digest("hex");
    fs.writeFileSync(directory + sitename + filename, Buffer.from(data, "base64"));
}


dfd.read_csv("cleaned_list.csv", chunk = 10).then(async df => {
    let values = df.values;
    for (let index = 0; index < values.length; index++) {
        let sitename = values[index][1];
        console.log("Processing site: " + sitename);
        await getWasm(sitename).then(console.log("Finished processing site: " + sitename)).catch(err => {
            console.log("Error processing site: " + sitename);
            console.log(err);
        });
    }
}).catch(err => {
    console.log(err);
})


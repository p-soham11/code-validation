/** @format */

const http = require("http");
const url = require("url");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 8000;

mongoose.connect(
    "mongodb+srv://sohampal1108:soham1108@wealthupcluster.kvgzzfo.mongodb.net/?retryWrites=true&w=majority"
);
const codeSchema = new mongoose.Schema({
    value: String,
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
const Code = mongoose.model("Code", codeSchema);

// Function to generate a random code
function generateCode() {
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return code;
}

// Function to check if the code has expired
function isCodeExpired(createdAt) {
    const expirationTime = 60 * 1000; // 60 seconds
    return Date.now() - new Date(createdAt).getTime() > expirationTime;
}

// Create a simple HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Route to generate a new code
    if (req.method === "GET" && parsedUrl.pathname === "/api/codes") {
        const newCode = new Code({ value: generateCode() });
        newCode
            .save()
            .then(() => {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ code: newCode.value }));
            })
            .catch((error) => {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Internal Server Error" }));
                console.error(error);
            });
    }

    // Route to check if the entered code is correct
    else if (req.method === "POST" && parsedUrl.pathname === "/api/codes/use") {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            const { code } = JSON.parse(body);
            const existingCode = await Code.findOne({
                value: code,
            });

            if (!existingCode) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Enter a valid code" }));
            } else if (existingCode.used == true) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Code already used" }));
            } else if (isCodeExpired(existingCode.createdAt)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "The code has expired" }));
            } else {
                existingCode.used = true;
                await existingCode.save();
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Code is correct" }));
            }
        });
    }

    // Handle other routes
    else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not Found" }));
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

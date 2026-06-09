const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const net = require('net');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Frontend
app.use(express.static(path.join(__dirname, 'public')));

const runCommand = (cmd) => {
	return new Promise((resolve) => {
		exec(cmd, (error, stdout, stderr) => {
			resolve({ error, stdout, stderr });
		});
	});
};

// Proxy data between frontend <---> container
wss.on('connection', async (ws) => {
	console.log('frontend connected to ws proxy');

	await runCommand('docker rm -f bld-browser-instance');
	await runCommand('docker run -d --name bld-browser-instance --shm-size=2gb -p 5900:5900 bld-chromium-head');

	let vncClient;

	// Frontend -> Backend -> Docker
	ws.on('message', (message) => {
		if (vncClient.writable) {
		vncClient.write(message);
		}
	});

	ws.on('close', async () => {
		await runCommand('docker rm -f bld-browser-instance');
		vncClient.end();
	});

	setTimeout(() => {
		vncClient = net.createConnection({ host: '127.0.0.1', port: 5900 }, () => {
			console.log('connected to docker vnc server');
		});

		// Docker -> Backend -> Frontend
		vncClient.on('data', (data) => {
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(data, { binary: true });
			}
		});

		vncClient.on('close', async () => {
			await runCommand('docker rm -f bld-browser-instance');
			ws.close();
		});

		vncClient.on('error', async (err) => {
			console.error(`vncClient: error: ${err}`);
			await runCommand('docker rm -f bld-browser-instance');
			ws.close();
		});
	}, 3000);


});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`server running at http://localhost:${PORT}`);
});

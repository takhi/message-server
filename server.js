const websocket = require('nodejs-websocket');

const PORT = 1001;
const SERVER = {messages: 'ALL', new_message: 'NEW', success: 'OK', fail: 'FAIL', pong: 'PONG'};
const CLIENT = {get_messages: 'GET', add_message: 'POST', join: 'JOIN', ping: 'PING'};

let connectionMap = new Map();
let messageBoard = [];
let messageKey = 0;

function broadcast(message) {
    connectionMap.forEach((connection) => {
        connection.sendText(JSON.stringify({response: SERVER.new_message, message: message}));
    });
}

const server = websocket.createServer((connection) => {
    console.log('new connection');
    let user;
    connection.on('text', (data) => {
        try {
            let client = JSON.parse(data);
            switch (client.request) {
                case CLIENT.get_messages:
                    connection.sendText(JSON.stringify({response: SERVER.messages, board: messageBoard}));
                    break;
                case CLIENT.add_message:
                    let message = client.message;
                    if (!connectionMap.has(message.user)) break;
                    message.key = messageKey++;
                    messageBoard.push(message);
                    broadcast(message);
                    break;
                case CLIENT.join:
                    let newUser = client.user;
                    if (connectionMap.has(newUser)) {
                        connection.sendText(JSON.stringify({response: SERVER.fail, request: CLIENT.join}));
                    } else {
                        console.log(newUser);
                        user = newUser;
                        connectionMap.set(user, connection);
                        connection.sendText(JSON.stringify({response: SERVER.success, request: CLIENT.join}));
                    }
                    break;
                case CLIENT.ping:
                    console.log('ponging');
                    connection.sendText(JSON.stringify({response: SERVER.success, pong: SERVER.pong}))
                    break;
            }
        } catch (error) {
            console.log(error.message);
        }
    })
    connection.on('close', () => {
        if (user) connectionMap.delete(user);
    });
    connection.on('error', (error) => console.log(`CONERROR: ${error.message}`));
}).listen(PORT);

server.on('error', (error) => console.log(`SERVERROR: ${error.message}`));

console.log(`Server up on ${PORT}`);
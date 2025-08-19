// server.js
// Backend for the Meme Coin Velocity Dashboard

// --- Dependencies ---
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { ethers } = require('ethers');
const fetch = require('node-fetch');
require('dotenv').config();

// --- Configuration ---
const PORT = process.env.PORT || 3000;
const COVALENT_API_KEY = process.env.COVALENT_API_KEY;
if (!COVALENT_API_KEY) {
    console.error("FATAL ERROR: COVALENT_API_KEY is not defined in your environment variables.");
    process.exit(1);
}

// ABIs for decoding events
const ERC20_ABI = ["event Transfer(address indexed from, address indexed to, uint256 value)"];
const erc20Iface = new ethers.Interface(ERC20_ABI);

// Topic Hashes for events
const TRANSFER_TOPIC = erc20Iface.getEvent("Transfer").topicHash;

// --- Server Setup ---
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static('.'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let goldRushSocket;
let tokenAddress = '';
let pairAddress = ''; // Uniswap V2 Pair address
let tokenDecimals = 18; // Default, will be fetched
let whaleWallets = new Set();
let subscriptionId = 0;

// --- WebSocket Logic (Frontend Communication) ---
wss.on('connection', (ws) => {
    console.log('Frontend client connected.');
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'SUBSCRIBE' && data.tokenAddress && data.pairAddress) {
                console.log(`Frontend subscribed to token: ${data.tokenAddress}`);
                tokenAddress = data.tokenAddress.toLowerCase();
                pairAddress = data.pairAddress.toLowerCase();
                
                // Reset state and start fresh
                whaleWallets.clear();
                
                fetchTokenDetails();
                fetchWhales();
                startGoldRushStream();
            }
        } catch (error) {
            console.error('Error processing message from frontend:', error);
        }
    });
    ws.on('close', () => {
        console.log('Frontend client disconnected.');
        stopGoldRushStream();
    });
});

// --- GoldRush WebSocket Streaming ---
function startGoldRushStream() {
    if (goldRushSocket && goldRushSocket.readyState === WebSocket.OPEN) {
        return; // Already connected
    }

    console.log('Connecting to GoldRush Streaming API...');
    
    // Use the correct WebSocket endpoint with graphql-transport-ws protocol
    goldRushSocket = new WebSocket('wss://gr-staging-v2.streaming.covalenthq.com/graphql', 'graphql-transport-ws');

    goldRushSocket.onopen = () => {
        console.log('Connected to GoldRush. Initializing connection...');
        
        // Send connection_init with API key
        goldRushSocket.send(JSON.stringify({
            type: 'connection_init',
            payload: {
                GOLDRUSH_API_KEY: COVALENT_API_KEY
            }
        }));
    };

    goldRushSocket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);
            
            switch (message.type) {
                case 'connection_ack':
                    console.log('Connection acknowledged. Starting wallet activity subscription...');
                    subscribeToWalletActivity();
                    break;
                    
                case 'next':
                    if (message.payload && message.payload.data && message.payload.data.walletTxs) {
                        message.payload.data.walletTxs.forEach(tx => {
                            processWalletTransaction(tx);
                        });
                    }
                    break;
                    
                case 'error':
                    console.error('GraphQL subscription error:', message.payload);
                    break;
                    
                case 'complete':
                    console.log('Subscription completed');
                    break;
            }
        } catch (error) {
            console.error('Error processing GoldRush message:', error);
        }
    };

    goldRushSocket.onerror = (error) => {
        console.error('GoldRush WebSocket Error:', error);
    };

    goldRushSocket.onclose = (event) => {
        console.log(`GoldRush connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        console.log('Reconnecting in 5s...');
        setTimeout(startGoldRushStream, 5000);
    };
}

function stopGoldRushStream() {
    if (goldRushSocket) {
        goldRushSocket.close();
        goldRushSocket = null;
        console.log('Stopped GoldRush stream');
    }
}

function subscribeToWalletActivity() {
    subscriptionId++;
    
    const subscription = {
        id: subscriptionId.toString(),
        type: 'subscribe',
        payload: {
            query: `
                subscription {
                    walletTxs(
                        chain_name: ETH_MAINNET,
                        wallet_addresses: ["${tokenAddress}"]
                    ) {
                        tx_hash
                        from_address
                        to_address
                        value
                        block_signed_at
                        successful
                        decoded_type
                        logs {
                            emitter_address
                            topics
                            data
                        }
                    }
                }
            `
        }
    };
    
    console.log('Sending wallet activity subscription:', JSON.stringify(subscription, null, 2));
    goldRushSocket.send(JSON.stringify(subscription));
}

// --- Event Processors ---
function processWalletTransaction(tx) {
    console.log('Processing wallet transaction:', tx);
    
    if (!tx.logs || !Array.isArray(tx.logs)) {
        return;
    }
    
    tx.logs.forEach(log => {
        if (log.topics && log.topics.length > 0) {
            const topic = log.topics[0];
            const emitterAddress = log.emitter_address.toLowerCase();
            
            // Process Transfer events from the token contract
            if (topic === TRANSFER_TOPIC && emitterAddress === tokenAddress) {
                processTransferFromLog(log, tx);
            }
        }
    });
}

function processTransferFromLog(log, tx) {
    try {
        const decodedLog = erc20Iface.parseLog({
            topics: log.topics,
            data: log.data
        });
        const { from, to, value } = decodedLog.args;
        const formattedValue = parseFloat(ethers.formatUnits(value, tokenDecimals));
        
        const payload = {
            txHash: tx.tx_hash,
            from: from,
            to: to,
            value: formattedValue,
            isWhale: whaleWallets.has(from.toLowerCase()) || whaleWallets.has(to.toLowerCase())
        };
        broadcast({ type: 'NEW_TRANSFER', payload });
        console.log('Processed transfer:', payload);

    } catch (e) { 
        console.log('Transfer decoding error:', e.message);
    }
}


// --- Foundational API Helpers ---
async function fetchTokenDetails() {
    try {
        console.log(`Fetching token details for: ${tokenAddress}`);
        
        // Use REST API for token metadata
        const url = `https://api.covalenthq.com/v1/eth-mainnet/address/${tokenAddress}/balances_v2/?key=${COVALENT_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Token details response:', JSON.stringify(data, null, 2));
        
        if (data.data && data.data.items && data.data.items.length > 0) {
            const tokenData = data.data.items.find(item => 
                item.contract_address && item.contract_address.toLowerCase() === tokenAddress
            );
            if (tokenData) {
                tokenDecimals = tokenData.contract_decimals || 18;
                console.log(`Fetched token details. Decimals: ${tokenDecimals}`);
                
                // Send token info to frontend
                const tokenInfo = {
                    address: tokenData.contract_address,
                    name: tokenData.contract_name,
                    symbol: tokenData.contract_ticker_symbol,
                    decimals: tokenData.contract_decimals,
                    logoUrl: tokenData.logo_url
                };
                broadcast({ type: 'TOKEN_INFO', payload: tokenInfo });
                
            } else {
                console.log('Token not found in balances, using default decimals: 18');
                tokenDecimals = 18;
                
                // Send basic token info
                broadcast({ 
                    type: 'TOKEN_INFO', 
                    payload: { 
                        address: tokenAddress, 
                        name: 'Unknown Token', 
                        symbol: 'UNKNOWN', 
                        decimals: 18, 
                        logoUrl: null 
                    } 
                });
            }
        } else {
            console.log('No token metadata found, using default decimals: 18');
            tokenDecimals = 18;
            
            // Send basic token info
            broadcast({ 
                type: 'TOKEN_INFO', 
                payload: { 
                    address: tokenAddress, 
                    name: 'Unknown Token', 
                    symbol: 'UNKNOWN', 
                    decimals: 18, 
                    logoUrl: null 
                } 
            });
        }
        
    } catch (error) {
        console.error("Error fetching token details:", error.message);
        tokenDecimals = 18; // Safe default
        
        // Send basic token info on error
        broadcast({ 
            type: 'TOKEN_INFO', 
            payload: { 
                address: tokenAddress, 
                name: 'Error Loading Token', 
                symbol: 'ERROR', 
                decimals: 18, 
                logoUrl: null 
            } 
        });
    }
}

async function fetchWhales(pageSize = 50) {
    try {
        console.log(`Fetching whale wallets for: ${tokenAddress}`);
        
        // Use REST API for token holders
        const url = `https://api.covalenthq.com/v1/eth-mainnet/tokens/${tokenAddress}/token_holders/?page-size=${pageSize}&key=${COVALENT_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            console.log(`Token holders request failed: ${response.status}, using empty whale set`);
            whaleWallets = new Set();
            return;
        }
        
        const data = await response.json();
        console.log('Whale holders response:', JSON.stringify(data, null, 2));
        
        if (data.data && data.data.items && Array.isArray(data.data.items)) {
            const holders = data.data.items.map(h => h.address.toLowerCase());
            whaleWallets = new Set(holders);
            console.log(`Fetched and stored ${whaleWallets.size} whale wallets.`);
        } else {
            console.log('No whale holder data received, using empty set');
            whaleWallets = new Set();
        }
        
    } catch (error) {
        console.error("Error fetching whales:", error.message);
        whaleWallets = new Set(); // Empty set as fallback
    }
    
    // Refresh whale list every 5 minutes
    setTimeout(fetchWhales, 300000);
}

// --- Utility ---
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// --- Start Server ---
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Meme Coin Velocity Dashboard is running on port ${PORT}`);
    console.log(`📊 Dashboard available at: ${process.env.NODE_ENV === 'production' ? 'https://your-deployed-url' : `http://localhost:${PORT}`}`);
});

The Meme Coin Velocity Dashboard is a real-time tool for monitoring high-volume ERC-20 tokens, providing an immediate, high-level view of on-chain activity through live transaction streaming and whale alerts. You can see a live demo of the project, which is built with a secure backend proxy to protect the Covalent API key and a clean, responsive user interface. 

The technology stack features a Node.js and Express backend hosted on Railway that uses ethers.js to process data from the Covalent Streaming API, which is then sent via WebSockets to a vanilla HTML, CSS, and JavaScript frontend hosted on Vercel. 

To get started locally, you can clone the repository, install the dependencies, and configure your Covalent API key in a .env file before starting the server and opening the index.html file. The dashboard works by listening for Transfer and Swap events to identify whale activity and calculate buy/sell pressure, with future development planned for multi-chain support and historical price charts. 

The project is licensed under the MIT License and is open to contributions.

<img width="3840" height="506" alt="Untitled diagram _ Mermaid Chart-2025-08-19-201203" src="https://github.com/user-attachments/assets/e89775f6-4736-4fac-b892-362e9218b067" />

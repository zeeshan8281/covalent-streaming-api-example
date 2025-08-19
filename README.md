# 🚀 Meme Coin Velocity Dashboard

A real-time dashboard for tracking high-volume meme coin transactions with whale alerts and live transaction streaming.

![Dashboard Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![Tech Stack](https://img.shields.io/badge/Tech-Node.js%20%7C%20Express%20%7C%20WebSocket-blue)

## 🌟 Features

- **Real-time Transaction Streaming** - Live blockchain data via Covalent/GoldRush API
- **Whale Alert System** - Automatically highlights large transactions
- **Token Information Display** - Shows token details, logos, and contract info
- **Beautiful Modern UI** - Dark theme with Tailwind CSS
- **Live WebSocket Connection** - Real-time updates without page refresh
- **Mobile Responsive** - Works perfectly on all devices

## 🎯 Live Demo

- **Frontend**: [https://memecoin-dashboard-dl3k886m5-zeeshan8281s-projects.vercel.app](https://memecoin-dashboard-dl3k886m5-zeeshan8281s-projects.vercel.app)
- **Backend API**: [https://meme-dashboard-production-d179.up.railway.app](https://meme-dashboard-production-d179.up.railway.app)

## 🛠️ Tech Stack

### Frontend
- HTML5 & CSS3
- Tailwind CSS for styling
- Vanilla JavaScript for WebSocket connections
- Deployed on **Vercel**

### Backend
- Node.js & Express.js
- WebSocket for real-time communication
- ethers.js for blockchain interactions
- Covalent/GoldRush Streaming API integration
- Deployed on **Railway**

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Covalent API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/meme-coin-dashboard.git
   cd meme-coin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   COVALENT_API_KEY=your_covalent_api_key_here
   PORT=3000
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
meme-coin-dashboard/
├── index.html          # Frontend dashboard
├── server.js           # Backend WebSocket server
├── package.json        # Dependencies and scripts
├── vercel.json         # Vercel deployment config
├── .env               # Environment variables (not committed)
├── .gitignore         # Git ignore rules
└── README.md          # Project documentation
```

## 🔧 Configuration

### Default Settings
- **Token**: SHIBA INU (SHIB)
- **Token Address**: `0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE`
- **Pair Address**: `0x8116a08973650a6992909581027856E792425952`

### Customization
You can track any ERC-20 token by updating the token and pair addresses in the dashboard interface.

## 🐳 Whale Detection

The dashboard automatically detects and highlights "whale" transactions based on:
- Transaction value thresholds
- Wallet address patterns
- Historical transaction volumes

## 📊 API Integration

This project uses the **Covalent GoldRush Streaming API** for real-time blockchain data:
- Real-time wallet transactions
- Token metadata and logos
- ERC-20 transfer events
- GraphQL over WebSocket

## 🚀 Deployment

### Frontend (Vercel)
```bash
npm install -g vercel
vercel login
vercel
```

### Backend (Railway)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

## 🛡️ Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `COVALENT_API_KEY` | Your Covalent API key | Yes |
| `PORT` | Server port (default: 3000) | No |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Covalent](https://www.covalenthq.com/) for the blockchain API
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Vercel](https://vercel.com/) for frontend hosting
- [Railway](https://railway.app/) for backend hosting

## 📈 Roadmap

- [ ] Multi-chain support (Polygon, BSC, etc.)
- [ ] Price charts integration
- [ ] Historical data analysis
- [ ] Social sentiment tracking
- [ ] Portfolio tracking features
- [ ] Mobile app version

## 📞 Support

If you have any questions or issues, please [open an issue](https://github.com/YOUR_USERNAME/meme-coin-dashboard/issues) on GitHub.

---

**Made with ❤️ for the crypto community** 🌙

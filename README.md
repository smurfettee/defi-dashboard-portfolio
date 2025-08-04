# DeFi Portfolio Dashboard

A comprehensive, professional-grade DeFi portfolio dashboard with advanced analytics, tax reporting, risk assessment, and DeFi protocol integration.

## 🚀 Features

### Core Portfolio Management
- **Real-time Portfolio Tracking**: Monitor your cryptocurrency holdings with live price updates
- **Multi-Token Support**: Track ERC-20 tokens, ETH, and custom tokens
- **Transaction History**: Complete transaction history with detailed analytics
- **Network Support**: Ethereum mainnet and testnet support

### Advanced Analytics
- **Performance Metrics**: 24h, 7d, 30d, 90d, and 1y performance tracking
- **Portfolio Allocation**: Visual breakdown of token allocations
- **Historical Charts**: Interactive price charts and portfolio value trends
- **Performance Comparison**: Compare against ETH, BTC, and market benchmarks

### DeFi Protocol Integration
- **Multi-Protocol Support**: Track positions across major DeFi protocols
  - Uniswap V2/V3 liquidity positions
  - Aave lending/borrowing positions
  - Compound positions
  - Curve, Balancer, SushiSwap, and more
- **Impermanent Loss Calculation**: Real-time IL tracking for LP positions
- **Reward Tracking**: Monitor unclaimed rewards across all protocols
- **APY Analytics**: Track yield farming returns and protocol performance
- **Position Management**: Detailed view of all DeFi positions with risk metrics

### Professional Tax Reporting
- **Realized/Unrealized Gains**: Comprehensive gain/loss tracking
- **Cost Basis Methods**: FIFO, LIFO, and Specific Identification support
- **Tax Year Reports**: Generate tax reports for any year
- **Export Functionality**: CSV export for tax software integration
- **Holding Period Analysis**: Long-term vs short-term capital gains tracking
- **Gas Fee Inclusion**: Optional gas fee inclusion in cost basis calculations
- **Airdrop & Staking Tracking**: Comprehensive income tracking

### Risk Assessment & Portfolio Optimization
- **Volatility Analysis**: Portfolio volatility calculation using historical data
- **Value at Risk (VaR)**: 95% confidence level risk assessment
- **Correlation Matrix**: Token correlation analysis for diversification
- **Diversification Scoring**: Herfindahl-Hirschman Index (HHI) based scoring
- **Sector Allocation**: Portfolio breakdown by token categories
- **Concentration Risk**: Analysis of portfolio concentration
- **Sharpe Ratio**: Risk-adjusted return metrics
- **Beta Calculation**: Market correlation analysis
- **Portfolio Optimization**: AI-powered rebalancing recommendations
- **Risk Tolerance Profiles**: Conservative, moderate, and aggressive strategies

### Advanced Analytics Features
- **DCA Analysis**: Dollar Cost Averaging pattern detection
- **What-If Scenarios**: Portfolio impact analysis for different scenarios
- **Benchmark Comparison**: Performance vs ETH, BTC, S&P 500, DeFi Pulse
- **Technical Indicators**: RSI, MACD, Moving Averages
- **Price Predictions**: ML-powered price forecasting
- **Market Cycle Analysis**: Bull/Bear market phase detection

### Professional UI/UX
- **Dark/Light Theme**: Full theme support with system preference detection
- **Responsive Design**: Mobile-first responsive design
- **Real-time Updates**: Live data updates without page refresh
- **Interactive Charts**: Advanced charting with Recharts
- **Export Capabilities**: CSV, PDF export for reports
- **Professional Layout**: Clean, modern interface optimized for productivity

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Blockchain**: Viem for Ethereum interaction
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography
- **State Management**: React Context API
- **Data Sources**: CoinGecko API, Ethereum RPC

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/defi-dashboard-portfolio.git
cd defi-dashboard-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
REACT_APP_COINGECKO_API_KEY=your_api_key_here
REACT_APP_ETHEREUM_RPC_URL=your_rpc_url_here
```

### Network Configuration
Supported networks are configured in `src/utils/constants.ts`:
- Ethereum Mainnet
- Sepolia Testnet

## 📊 Features in Detail

### DeFi Protocol Integration

The dashboard integrates with major DeFi protocols to provide comprehensive position tracking:

#### Supported Protocols
- **Uniswap V2/V3**: LP position tracking with impermanent loss calculation
- **Aave**: Lending and borrowing position monitoring
- **Compound**: Supply and borrow position tracking
- **Curve**: Stablecoin LP position analysis
- **Balancer**: Weighted pool position tracking
- **SushiSwap**: DEX position monitoring
- **Yearn Finance**: Vault position tracking
- **Convex Finance**: Boosted rewards tracking
- **Lido**: Staking position monitoring
- **Rocket Pool**: Staking position tracking

#### Key Features
- Real-time position value updates
- Impermanent loss calculation and alerts
- Unclaimed rewards tracking
- APY comparison across protocols
- Risk assessment for each position

### Tax Reporting System

Professional-grade tax reporting with comprehensive features:

#### Cost Basis Methods
- **FIFO (First In, First Out)**: Traditional cost basis method
- **LIFO (Last In, First Out)**: Alternative cost basis approach
- **Specific Identification**: Precise lot tracking

#### Tax Features
- Realized vs unrealized gains tracking
- Long-term vs short-term capital gains analysis
- Gas fee inclusion in cost basis
- Airdrop and staking reward tracking
- CSV export for tax software integration
- Multi-year tax report generation

### Risk Assessment Engine

Advanced risk analysis using professional financial metrics:

#### Risk Metrics
- **Volatility**: Annualized portfolio volatility calculation
- **VaR (Value at Risk)**: 95% confidence level risk assessment
- **Maximum Drawdown**: Historical worst-case scenario analysis
- **Sharpe Ratio**: Risk-adjusted return measurement
- **Beta**: Market correlation analysis
- **Diversification Score**: Portfolio concentration analysis

#### Portfolio Optimization
- AI-powered rebalancing recommendations
- Risk tolerance-based optimization
- Transaction cost analysis
- Expected return and risk projections

### Advanced Analytics

Comprehensive analytics for professional portfolio management:

#### Performance Analysis
- Multi-timeframe performance tracking
- Benchmark comparison (ETH, BTC, S&P 500)
- DCA pattern detection
- What-if scenario analysis

#### Technical Analysis
- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Moving Averages (14-day, 50-day)
- Price prediction models

## 🔒 Security & Privacy

- **Read-Only Access**: Dashboard only reads wallet data, no write permissions
- **Local Processing**: All calculations performed locally
- **No Data Storage**: No personal data stored on servers
- **Secure APIs**: Encrypted API communications
- **Privacy Focused**: No tracking or analytics collection

## 🚀 Getting Started

1. **Connect Wallet**: Install MetaMask and connect your wallet
2. **Select Network**: Choose between mainnet and testnet
3. **View Portfolio**: Your portfolio will load automatically
4. **Explore Features**: Navigate through different tabs to access advanced features

### Quick Start Guide

1. **Overview Tab**: Basic portfolio information and token holdings
2. **Analytics Tab**: Performance charts and historical data
3. **Transactions Tab**: Complete transaction history
4. **DeFi Tab**: DeFi protocol positions and rewards
5. **Tax Tab**: Tax reporting and gain/loss tracking
6. **Risk Tab**: Risk assessment and portfolio optimization

## 📈 Professional Use Cases

### For Individual Investors
- Portfolio tracking and performance monitoring
- Tax preparation and reporting
- Risk management and diversification
- DeFi yield optimization

### For Financial Advisors
- Client portfolio analysis
- Risk assessment and reporting
- Tax planning and optimization
- Performance benchmarking

### For DeFi Users
- Multi-protocol position tracking
- Yield farming optimization
- Impermanent loss monitoring
- Reward claiming management

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [CoinGecko](https://coingecko.com) for price data
- [Viem](https://viem.sh) for Ethereum interaction
- [Recharts](https://recharts.org) for charting
- [Tailwind CSS](https://tailwindcss.com) for styling

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/defi-dashboard-portfolio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/defi-dashboard-portfolio/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/defi-dashboard-portfolio/wiki)

## 🔮 Roadmap

### Upcoming Features
- [ ] Mobile app development
- [ ] Advanced portfolio backtesting
- [ ] Social trading features
- [ ] Advanced DeFi protocol integration
- [ ] Multi-chain support (Polygon, BSC, etc.)
- [ ] Institutional-grade reporting
- [ ] API for third-party integrations

### Planned Enhancements
- [ ] Machine learning price predictions
- [ ] Advanced portfolio optimization algorithms
- [ ] Real-time notifications
- [ ] Portfolio sharing and social features
- [ ] Advanced tax optimization strategies

---

**Built with ❤️ for the DeFi community**
// GET ETHERS FROM WINDOW
const { ethers } = window;

// ─── CONTRACT DETAILS ─────────────────────────────────────
const CONTRACT_ADDRESS = "0x8663D7f0397390fcdC64f396D56b9A58d6307b96";

const CONTRACT_ABI = [
    "function sendTip(string memory message) public payable",
    "function withdraw() public",
    "function getAllTips() public view returns (tuple(address tipper, uint256 amount, string message, uint256 timestamp)[])",
    "function getBalance() public view returns (uint256)",
    "function getTotalTips() public view returns (uint256)",
    "function owner() public view returns (address)",
    "function totalTips() public view returns (uint256)",
    "event NewTip(address indexed tipper, uint256 amount, string message, uint256 timestamp)",
    "event Withdrawal(address owner, uint256 amount)"
];

// ─── GET HTML ELEMENTS ────────────────────────────────────
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const sendTipBtn = document.getElementById('sendTipBtn');
const withdrawBtn = document.getElementById('withdrawBtn');
const copyBtn = document.getElementById('copyBtn');
const userAddress = document.getElementById('userAddress');
const userBalance = document.getElementById('userBalance');
const contractBalance = document.getElementById('contractBalance');
const totalTipsEl = document.getElementById('totalTips');
const totalEthTipped = document.getElementById('totalEthTipped');
const tipMessage = document.getElementById('tipMessage');
const tipAmount = document.getElementById('tipAmount');
const tipStatus = document.getElementById('tipStatus');
const withdrawStatus = document.getElementById('withdrawStatus');
const tipsList = document.getElementById('tipsList');
const feedCount = document.getElementById('feedCount');
const networkName = document.getElementById('networkName');
const networkDot = document.getElementById('networkDot');
const ownerCard = document.getElementById('ownerCard');
const loginStatus = document.getElementById('loginStatus');

// SCREENS
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');

// ─── VARIABLES ────────────────────────────────────────────
let provider;
let signer;
let contract;
let currentAddress;

// ─── HELPERS ──────────────────────────────────────────────
function shortenAddress(addr) {
    return addr.substring(0, 6) + '…' + addr.substring(addr.length - 4);
}

// ─── CONNECT WALLET ───────────────────────────────────────
connectBtn.addEventListener('click', async () => {

    if (typeof window.ethereum === 'undefined') {
        loginStatus.textContent = '❌ MetaMask not found. Please install it first.';
        return;
    }

    try {
        loginStatus.textContent = '';
        connectBtn.disabled = true;

        // Force MetaMask to show the account-approval popup every time,
        // even if this site was already connected before. Without this,
        // MetaMask silently reuses a past permission grant and "Disconnect"
        // in our UI won't actually feel like a disconnect.
        try {
            await window.ethereum.request({
                method: 'wallet_requestPermissions',
                params: [{ eth_accounts: {} }]
            });
        } catch (permError) {
            // Some wallets don't support this method — fall back quietly,
            // eth_requestAccounts below will still work.
            console.warn('wallet_requestPermissions failed/unsupported:', permError);
        }

        await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();

        // Connect to TipJar smart contract
        contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
        );

        currentAddress = await signer.getAddress();

        await detectNetwork();
        await loadWalletInfo();
        await loadContractInfo();
        await loadAllTips();

        // Swap screens
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');

        // Listen for new tips in real time!
        contract.on("NewTip", async () => {
            await loadContractInfo();
            await loadAllTips();
        });

    } catch (error) {
        loginStatus.textContent = '❌ Connection failed: ' + error.message;
    } finally {
        connectBtn.disabled = false;
    }
});

// ─── DETECT NETWORK ───────────────────────────────────────
async function detectNetwork() {
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    if (chainId === 11155111) {
        networkName.textContent = 'Sepolia';
        networkDot.className = 'dot ok';
    } else if (chainId === 1) {
        networkName.textContent = 'Mainnet — switch!';
        networkDot.className = 'dot warn';
    } else {
        networkName.textContent = 'Unknown network';
        networkDot.className = 'dot warn';
    }
}

// ─── LOAD WALLET INFO ─────────────────────────────────────
async function loadWalletInfo() {
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.utils.formatEther(balance);
    userAddress.textContent = shortenAddress(address);
    userAddress.title = address;
    userBalance.textContent = parseFloat(balanceInEth).toFixed(4) + ' ETH';
}

// ─── LOAD CONTRACT INFO ───────────────────────────────────
async function loadContractInfo() {

    // Get contract balance
    const balance = await contract.getBalance();
    const balanceInEth = ethers.utils.formatEther(balance);
    contractBalance.textContent =
    parseFloat(balanceInEth).toFixed(4);

    // Get total tips count
    const total = await contract.getTotalTips();
    totalTipsEl.textContent = total.toString();

    // CALCULATE TOTAL ETH EVER TIPPED
    // This adds up ALL tip amounts from ALL tips
    // Even withdrawn ones — shows total ever sent!
    const allTips = await contract.getAllTips();
    let totalEth = ethers.BigNumber.from(0);
    allTips.forEach(tip => {
        totalEth = totalEth.add(tip.amount);
    });
    totalEthTipped.textContent =
    parseFloat(ethers.utils.formatEther(totalEth)).toFixed(4);

    // Check if current user is owner
    const ownerAddress = await contract.owner();
    if (currentAddress.toLowerCase() ===
        ownerAddress.toLowerCase()) {
        ownerCard.classList.remove('hidden');
    } else {
        ownerCard.classList.add('hidden');
    }
}

// ─── LOAD ALL TIPS ────────────────────────────────────────
async function loadAllTips() {

    try {
        const allTips = await contract.getAllTips();

        feedCount.textContent = allTips.length
            ? allTips.length + (allTips.length === 1 ? ' entry' : ' entries')
            : '';

        if (allTips.length === 0) {
            tipsList.innerHTML =
            '<p class="no-tips">No tips yet — be the first 🎉</p>';
            return;
        }

        // Show newest tips first
        tipsList.innerHTML = [...allTips].reverse().map(tip => `
            <div class="tip-row">
                <div class="tip-amount">${parseFloat(
                    ethers.utils.formatEther(tip.amount)
                ).toFixed(4)} ETH</div>
                <div class="tip-body">
                    <p class="tip-message">"${tip.message}"</p>
                    <p class="tip-from">${shortenAddress(tip.tipper)}</p>
                </div>
                <div class="tip-time">${new Date(
                    tip.timestamp * 1000
                ).toLocaleString()}</div>
            </div>
        `).join('');

    } catch (error) {
        tipsList.innerHTML =
        '<p class="no-tips">❌ Could not load tips: ' +
        error.message + '</p>';
    }
}

// ─── SEND TIP ─────────────────────────────────────────────
sendTipBtn.addEventListener('click', async () => {

    const message = tipMessage.value;
    const amount = tipAmount.value;

    if (!message || !amount) {
        tipStatus.textContent =
        '❌ Please fill in message and amount!';
        tipStatus.className = 'form-status error';
        return;
    }

    try {
        tipStatus.textContent =
        '⏳ Sending tip to blockchain...';
        tipStatus.className = 'form-status';

        // Call sendTip on smart contract
        const tx = await contract.sendTip(message, {
            value: ethers.utils.parseEther(amount)
        });

        tipStatus.textContent =
        '⏳ Waiting for validators to confirm...';

        await tx.wait();

        tipStatus.textContent =
        '✅ Tip sent and stored on blockchain forever! 🎉';
        tipStatus.className = 'form-status success';

        await loadWalletInfo();
        await loadContractInfo();
        await loadAllTips();

        tipMessage.value = '';
        tipAmount.value = '';

    } catch (error) {
        tipStatus.textContent = '❌ Failed: ' + error.message;
        tipStatus.className = 'form-status error';
    }
});

// ─── WITHDRAW ─────────────────────────────────────────────
withdrawBtn.addEventListener('click', async () => {

    try {
        withdrawStatus.textContent = '⏳ Withdrawing...';
        withdrawStatus.className = 'form-status';

        const tx = await contract.withdraw();
        await tx.wait();

        withdrawStatus.textContent =
        '✅ All tips withdrawn successfully! 💰';
        withdrawStatus.className = 'form-status success';

        await loadWalletInfo();
        await loadContractInfo();

    } catch (error) {
        withdrawStatus.textContent =
        '❌ Failed: ' + error.message;
        withdrawStatus.className = 'form-status error';
    }
});

// ─── COPY ADDRESS ─────────────────────────────────────────
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(currentAddress || '');
    const original = copyBtn.innerHTML;
    copyBtn.innerHTML = '✅';
    setTimeout(() => {
        copyBtn.innerHTML = original;
    }, 1500);
});

// ─── DISCONNECT ───────────────────────────────────────────
disconnectBtn.addEventListener('click', async () => {

    if (contract) contract.removeAllListeners();

    // Try to revoke the permission grant too (supported on newer MetaMask).
    // If it's not supported, wallet_requestPermissions on next Connect
    // still forces a fresh approval popup, so this is a nice-to-have.
    try {
        await window.ethereum?.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
        });
    } catch (revokeError) {
        // Not supported by this wallet — that's fine.
        console.warn('wallet_revokePermissions failed/unsupported:', revokeError);
    }

    provider = null;
    signer = null;
    contract = null;
    currentAddress = null;

    userAddress.textContent = '0x0000…0000';
    userBalance.textContent = '—';
    contractBalance.textContent = '—';
    totalTipsEl.textContent = '—';
    totalEthTipped.textContent = '—';
    feedCount.textContent = '';
    tipsList.innerHTML = '<p class="no-tips">No tips yet 🎉</p>';
    networkName.textContent = '—';
    networkDot.className = 'dot';
    tipStatus.textContent = '';
    withdrawStatus.textContent = '';
    loginStatus.textContent = '';
    ownerCard.classList.add('hidden');

    appScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});

// ─── AUTO DETECT CHANGES ──────────────────────────────────
window.ethereum?.on('accountsChanged', async (accounts) => {
    if (accounts.length === 0) {
        disconnectBtn.click();
    } else {
        provider =
        new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
        );
        currentAddress = await signer.getAddress();
        await loadWalletInfo();
        await loadContractInfo();
        await detectNetwork();
    }
});

window.ethereum?.on('chainChanged', async () => {
    provider =
    new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
    );
    await detectNetwork();
    await loadWalletInfo();
    await loadContractInfo();
});
const { ethers } = window;

const CONTRACT_ADDRESS = "0xe4E0df02970cA623b126b79B88470D326a794eED";
const CONTRACT_ABI = [
  "function registerWaiter(address waiterAddress, string calldata name) external",
  "function removeWaiter(address waiterAddress) external",
  "function sendTip(address waiterAddress, string calldata message) external payable",
  "function withdraw() external",
  "function getWaiter(address waiterAddress) external view returns (string name, bool exists, uint256 balance, uint256 tipsReceived, uint256 tipsWithdrawn)",
  "function getWaiters() external view returns (address[] addresses, string[] names, bool[] active, uint256[] balances)",
  "function getTipsForWaiter(address waiterAddress) external view returns (tuple(address tipper, address waiter, uint256 amount, string message, uint256 timestamp)[])",
  "function getAllTips() external view returns (tuple(address tipper, address waiter, uint256 amount, string message, uint256 timestamp)[])",
  "function getContractBalance() external view returns (uint256)",
  "function getOwner() external view returns (address)",
  "function totalTipsReceived() external view returns (uint256)",
  "function totalWithdrawn() external view returns (uint256)",
  "function waiterCount() external view returns (uint256)",
  "event WaiterRegistered(address indexed waiter, string name)",
  "event WaiterRemoved(address indexed waiter)",
  "event TipSent(address indexed tipper, address indexed waiter, uint256 amount, string message, uint256 timestamp)",
  "event Withdrawal(address indexed waiter, uint256 amount, uint256 timestamp)"
];

const landingScreen = document.getElementById('landingScreen');
const appScreen = document.getElementById('appScreen');
const connectCustomerBtn = document.getElementById('connectCustomerBtn');
const connectWaiterBtn = document.getElementById('connectWaiterBtn');
const connectManagerBtn = document.getElementById('connectManagerBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const copyBtn = document.getElementById('copyBtn');
const userAddress = document.getElementById('userAddress');
const networkName = document.getElementById('networkName');
const networkDot = document.getElementById('networkDot');
const loginStatus = document.getElementById('loginStatus');

const customerView = document.getElementById('customerView');
const waiterView = document.getElementById('waiterView');
const managerView = document.getElementById('managerView');
const waiterList = document.getElementById('waiterList');
const customerTipAmount = document.getElementById('customerTipAmount');
const customerTipMessage = document.getElementById('customerTipMessage');
const customerStatus = document.getElementById('customerStatus');
const sendTipBtn = document.getElementById('sendTipBtn');
const waiterName = document.getElementById('waiterName');
const waiterBalance = document.getElementById('waiterBalance');
const waiterTipsList = document.getElementById('waiterTipsList');
const withdrawBtn = document.getElementById('withdrawBtn');
const withdrawStatus = document.getElementById('withdrawStatus');
const managerTotalTips = document.getElementById('managerTotalTips');
const managerTotalWithdrawn = document.getElementById('managerTotalWithdrawn');
const managerContractBalance = document.getElementById('managerContractBalance');
const managerWaiterAddress = document.getElementById('managerWaiterAddress');
const managerWaiterName = document.getElementById('managerWaiterName');
const registerWaiterBtn = document.getElementById('registerWaiterBtn');
const managerStatus = document.getElementById('managerStatus');
const managerWaiterList = document.getElementById('managerWaiterList');

let provider;
let signer;
let contract;
let currentAddress;
let currentRole = null;
let selectedWaiterAddress = null;

function shortenAddress(address) {
  if (!address) return '—';
  return address.slice(0, 6) + '…' + address.slice(-4);
}

function formatEth(value) {
  if (!value) return '0.0000';
  return parseFloat(ethers.utils.formatEther(value)).toFixed(4);
}

function setMessage(element, message, type = '') {
  element.textContent = message;
  element.className = type ? `form-status ${type}` : 'form-status';
}

function getFriendlyErrorMessage(error, fallback = 'Something went wrong.') {
  const message = error?.message || '';
  const lowerMessage = message.toLowerCase();

  if (error?.code === 4001 || error?.code === 'ACTION_REJECTED' || lowerMessage.includes('user rejected') || lowerMessage.includes('action_rejected')) {
    return 'Transaction cancelled by you.';
  }

  if (lowerMessage.includes('nothing to withdraw')) {
    return 'Insufficient balance to withdraw.';
  }

  if (lowerMessage.includes('not a registered waiter') || lowerMessage.includes('registered waiter')) {
    return 'Only registered waiters can withdraw.';
  }

  if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
    return 'This waiter is already registered.';
  }

  if (lowerMessage.includes('not registered') || lowerMessage.includes('does not exist')) {
    return 'That waiter is not registered.';
  }

  if (lowerMessage.includes('reverted') || lowerMessage.includes('execution reverted')) {
    return fallback;
  }

  return message || fallback;
}

function showView(role) {
  customerView.classList.add('hidden');
  waiterView.classList.add('hidden');
  managerView.classList.add('hidden');

  if (role === 'customer') customerView.classList.remove('hidden');
  if (role === 'waiter') waiterView.classList.remove('hidden');
  if (role === 'manager') managerView.classList.remove('hidden');
}

function showApp() {
  landingScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
}

function showLanding() {
  appScreen.classList.add('hidden');
  landingScreen.classList.remove('hidden');
}

function ensureContractAddress() {
  if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
    throw new Error('Deploy the contract and replace CONTRACT_ADDRESS in app.js with the deployed address.');
  }
}

async function connectWallet(role) {
  if (typeof window.ethereum === 'undefined') {
    setMessage(loginStatus, 'MetaMask was not found. Please install it first.', 'error');
    return;
  }

  try {
    setMessage(loginStatus, 'Connecting to MetaMask…');
    ensureContractAddress();

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    currentAddress = await signer.getAddress();
    currentRole = role;

    if (role === 'waiter') {
      try {
        const waiter = await contract.getWaiter(currentAddress);
        if (!waiter.exists) {
          throw new Error('This wallet is not registered as a waiter.');
        }
      } catch (waiterError) {
        if (role === 'waiter') {
          console.warn('getWaiter failed, continuing with fallback waiter flow:', waiterError);
        }
      }
    }

    if (role === 'manager') {
      try {
        const owner = await contract.getOwner();
        if (currentAddress.toLowerCase() !== owner.toLowerCase()) {
          throw new Error('This wallet is not the contract owner.');
        }
      } catch (ownerError) {
        const fallbackOwner = await provider.getSigner().getAddress();
        if (fallbackOwner.toLowerCase() !== currentAddress.toLowerCase()) {
          throw new Error('Manager access is unavailable for this contract ABI.');
        }
      }
    }

    await detectNetwork();
    await syncWalletInfo();
    showApp();
    await refreshDashboard();
  } catch (error) {
    setMessage(loginStatus, `Connection failed: ${error.message}`, 'error');
    provider = null;
    signer = null;
    contract = null;
    currentAddress = null;
    currentRole = null;
  }
}

async function detectNetwork() {
  const network = await provider.getNetwork();
  const chainId = network.chainId;

  if (chainId === 11155111) {
    networkName.textContent = 'Sepolia';
    networkDot.className = 'dot ok';
  } else if (chainId === 1) {
    networkName.textContent = 'Mainnet';
    networkDot.className = 'dot warn';
  } else {
    networkName.textContent = 'Unknown';
    networkDot.className = 'dot warn';
  }
}

async function syncWalletInfo() {
  const address = await signer.getAddress();
  const balance = await provider.getBalance(address);
  userAddress.textContent = shortenAddress(address);
  userAddress.title = address;
  document.getElementById('userBalance').textContent = `${formatEth(balance)} ETH`;
}

async function refreshDashboard() {
  if (!contract || !currentAddress) return;

  await detectNetwork();
  await syncWalletInfo();

  if (currentRole === 'customer') {
    showView('customer');
    await renderCustomerView();
  } else if (currentRole === 'waiter') {
    showView('waiter');
    await renderWaiterView();
  } else if (currentRole === 'manager') {
    showView('manager');
    await renderManagerView();
  }
}

async function renderCustomerView() {
  try {
    const [addresses, names] = await contract.getWaiters();
    if (!addresses.length) {
      waiterList.innerHTML = '<div class="list-row">No waiters are registered yet.</div>';
      return;
    }

    waiterList.innerHTML = addresses.map((address, index) => {
      const isActive = selectedWaiterAddress && selectedWaiterAddress.toLowerCase() === address.toLowerCase();
      const displayName = names[index] || 'Unnamed waiter';
      return `
        <div class="waiter-item ${isActive ? 'active' : ''}">
          <div>
            <strong>${displayName}</strong><br />
            <small>${shortenAddress(address)}</small>
          </div>
          <button type="button" data-address="${address}">Select</button>
        </div>
      `;
    }).join('');
  } catch (error) {
    waiterList.innerHTML = `<div class="list-row">${error.message}</div>`;
  }
}

async function renderWaiterView() {
  try {
    const waiterInfo = await contract.getWaiter(currentAddress);
    waiterName.textContent = waiterInfo.name || 'Waiter';
    waiterBalance.textContent = `${formatEth(waiterInfo.balance)} ETH`;

    const tips = await contract.getTipsForWaiter(currentAddress);
    if (!tips.length) {
      waiterTipsList.innerHTML = '<div class="list-row">No tips yet.</div>';
      return;
    }

    waiterTipsList.innerHTML = tips.slice().reverse().map((tip) => `
      <div class="list-row">
        <div>
          <strong>${tip.message || 'No message'}</strong><br />
          <small>${shortenAddress(tip.tipper)} • ${formatEth(tip.amount)} ETH</small>
        </div>
        <span class="microcopy">${new Date(tip.timestamp * 1000).toLocaleString()}</span>
      </div>
    `).join('');
  } catch (error) {
    waiterTipsList.innerHTML = `<div class="list-row">${error.message}</div>`;
  }
}

async function renderManagerView() {
  try {
    const totalTips = await contract.totalTipsReceived();
    const totalWithdrawn = await contract.totalWithdrawn();
    const balance = await contract.getContractBalance();
    const [addresses, names, active] = await contract.getWaiters();

    managerTotalTips.textContent = `${formatEth(totalTips)} ETH`;
    managerTotalWithdrawn.textContent = `${formatEth(totalWithdrawn)} ETH`;
    managerContractBalance.textContent = `${formatEth(balance)} ETH`;

    if (!addresses.length) {
      managerWaiterList.innerHTML = '<div class="list-row">No waiters registered.</div>';
      return;
    }

    managerWaiterList.innerHTML = addresses.map((address, index) => `
      <div class="list-row">
        <div>
          <strong>${names[index] || 'Unnamed waiter'}</strong><br />
          <small>${shortenAddress(address)} • ${active[index] ? 'Active' : 'Removed'}</small>
        </div>
        <button type="button" data-remove="${address}">Remove</button>
      </div>
    `).join('');
  } catch (error) {
    managerWaiterList.innerHTML = `<div class="list-row">${error.message}</div>`;
  }
}

connectCustomerBtn.addEventListener('click', () => connectWallet('customer'));
connectWaiterBtn.addEventListener('click', () => connectWallet('waiter'));
connectManagerBtn.addEventListener('click', () => connectWallet('manager'));

sendTipBtn.addEventListener('click', async () => {
  if (!selectedWaiterAddress) {
    setMessage(customerStatus, 'Please select a waiter first.', 'error');
    return;
  }

  const amount = customerTipAmount.value;
  const message = customerTipMessage.value;
  if (!amount || !message) {
    setMessage(customerStatus, 'Please enter an amount and a message.', 'error');
    return;
  }

  try {
    setMessage(customerStatus, 'Submitting tip…');
    const tx = await contract.sendTip(selectedWaiterAddress, message, { value: ethers.utils.parseEther(amount) });
    await tx.wait();
    setMessage(customerStatus, 'Tip sent successfully!', 'success');
    customerTipAmount.value = '';
    customerTipMessage.value = '';
    await refreshDashboard();
  } catch (error) {
    setMessage(customerStatus, getFriendlyErrorMessage(error, 'The tip transaction was rejected by the contract.'), 'error');
  }
});

withdrawBtn.addEventListener('click', async () => {
  try {
    setMessage(withdrawStatus, 'Withdrawing…');
    const tx = await contract.withdraw();
    await tx.wait();
    setMessage(withdrawStatus, 'Withdrawal complete.', 'success');
    await refreshDashboard();
  } catch (error) {
    setMessage(withdrawStatus, getFriendlyErrorMessage(error, 'The withdrawal was rejected by the contract.'), 'error');
  }
});

registerWaiterBtn.addEventListener('click', async () => {
  try {
    const address = managerWaiterAddress.value.trim();
    const name = managerWaiterName.value.trim();
    if (!address || !name) {
      setMessage(managerStatus, 'Enter both a wallet address and a name.', 'error');
      return;
    }

    setMessage(managerStatus, 'Registering waiter…');
    const tx = await contract.registerWaiter(address, name);
    await tx.wait();
    setMessage(managerStatus, 'Waiter registered!', 'success');
    managerWaiterAddress.value = '';
    managerWaiterName.value = '';
    await refreshDashboard();
  } catch (error) {
    setMessage(managerStatus, getFriendlyErrorMessage(error, 'The registration was rejected by the contract.'), 'error');
  }
});

waiterList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-address]');
  if (!button) return;
  selectedWaiterAddress = button.getAttribute('data-address');
  renderCustomerView();
});

managerWaiterList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-remove]');
  if (!button) return;
  const address = button.getAttribute('data-remove');
  try {
    setMessage(managerStatus, 'Removing waiter…');
    const tx = await contract.removeWaiter(address);
    await tx.wait();
    setMessage(managerStatus, 'Waiter removed.', 'success');
    await refreshDashboard();
  } catch (error) {
    setMessage(managerStatus, getFriendlyErrorMessage(error, 'The removal was rejected by the contract.'), 'error');
  }
});

copyBtn.addEventListener('click', async () => {
  if (!currentAddress) return;
  await navigator.clipboard.writeText(currentAddress);
  const original = copyBtn.textContent;
  copyBtn.textContent = '✓';
  setTimeout(() => {
    copyBtn.textContent = original;
  }, 1200);
});

backToHomeBtn.addEventListener('click', () => {
  showLanding();
  setMessage(loginStatus, '', '');
});

disconnectBtn.addEventListener('click', async () => {
  if (contract) {
    try {
      await window.ethereum?.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] });
    } catch (error) {
      console.warn(error);
    }
  }

  provider = null;
  signer = null;
  contract = null;
  currentAddress = null;
  currentRole = null;
  selectedWaiterAddress = null;
  userAddress.textContent = '0x0000…0000';
  document.getElementById('userBalance').textContent = '—';
  networkName.textContent = '—';
  networkDot.className = 'dot';
  setMessage(loginStatus, '', '');
  showLanding();
});

window.ethereum?.on('accountsChanged', async () => {
  if (!window.ethereum) return;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (!accounts.length) {
    disconnectBtn.click();
    return;
  }
  await refreshDashboard();
});

window.ethereum?.on('chainChanged', async () => {
  if (contract) await refreshDashboard();
});

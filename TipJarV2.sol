// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TipJarV2 {
    address public owner;

    struct Waiter {
        string name;
        bool exists;
        uint256 balance;
        uint256 tipsReceived;
        uint256 tipsWithdrawn;
    }

    struct TipRecord {
        address tipper;
        address waiter;
        uint256 amount;
        string message;
        uint256 timestamp;
    }

    mapping(address => Waiter) public waiters;
    mapping(address => TipRecord[]) public waiterTips;
    TipRecord[] public allTips;
    address[] public waiterList;
    mapping(address => uint256) private waiterIndex;

    uint256 public totalTipsReceived;
    uint256 public totalWithdrawn;
    uint256 public waiterCount;

    event WaiterRegistered(address indexed waiter, string name);
    event WaiterRemoved(address indexed waiter);
    event TipSent(address indexed tipper, address indexed waiter, uint256 amount, string message, uint256 timestamp);
    event Withdrawal(address indexed waiter, uint256 amount, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyRegisteredWaiter() {
        require(waiters[msg.sender].exists, "Not a registered waiter");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerWaiter(address waiterAddress, string calldata name) external onlyOwner {
        require(waiterAddress != address(0), "Invalid address");
        require(!waiters[waiterAddress].exists, "Waiter already exists");
        require(bytes(name).length > 0, "Name required");

        waiters[waiterAddress] = Waiter({
            name: name,
            exists: true,
            balance: 0,
            tipsReceived: 0,
            tipsWithdrawn: 0
        });

        waiterList.push(waiterAddress);
        waiterIndex[waiterAddress] = waiterList.length - 1;
        waiterCount++;
        emit WaiterRegistered(waiterAddress, name);
    }

    function removeWaiter(address waiterAddress) external onlyOwner {
        require(waiters[waiterAddress].exists, "Waiter not found");

        uint256 index = waiterIndex[waiterAddress];
        uint256 lastIndex = waiterList.length - 1;
        address lastAddress = waiterList[lastIndex];

        waiterList[index] = lastAddress;
        waiterIndex[lastAddress] = index;
        waiterList.pop();
        delete waiterIndex[waiterAddress];

        waiters[waiterAddress].exists = false;
        waiterCount--;
        emit WaiterRemoved(waiterAddress);
    }

    function sendTip(address waiterAddress, string calldata message) external payable {
        require(waiters[waiterAddress].exists, "Waiter not registered");
        require(msg.value > 0, "Tip amount must be greater than zero");

        waiters[waiterAddress].balance += msg.value;
        waiters[waiterAddress].tipsReceived += msg.value;
        totalTipsReceived += msg.value;

        TipRecord memory newTip = TipRecord({
            tipper: msg.sender,
            waiter: waiterAddress,
            amount: msg.value,
            message: message,
            timestamp: block.timestamp
        });

        waiterTips[waiterAddress].push(newTip);
        allTips.push(newTip);

        emit TipSent(msg.sender, waiterAddress, msg.value, message, block.timestamp);
    }

    function withdraw() external onlyRegisteredWaiter {
        uint256 amount = waiters[msg.sender].balance;
        require(amount > 0, "Nothing to withdraw");

        waiters[msg.sender].balance = 0;
        waiters[msg.sender].tipsWithdrawn += amount;
        totalWithdrawn += amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount, block.timestamp);
    }

    function getWaiter(address waiterAddress) external view returns (string memory name, bool exists, uint256 balance, uint256 tipsReceived, uint256 tipsWithdrawn) {
        Waiter storage waiter = waiters[waiterAddress];
        return (waiter.name, waiter.exists, waiter.balance, waiter.tipsReceived, waiter.tipsWithdrawn);
    }

    function getWaiters() external view returns (address[] memory addresses, string[] memory names, bool[] memory active, uint256[] memory balances) {
        addresses = new address[](waiterCount);
        names = new string[](waiterCount);
        active = new bool[](waiterCount);
        balances = new uint256[](waiterCount);

        uint256 count;
        for (uint256 i = 0; i < waiterList.length; i++) {
            address current = waiterList[i];
            if (waiters[current].exists) {
                addresses[count] = current;
                names[count] = waiters[current].name;
                active[count] = true;
                balances[count] = waiters[current].balance;
                count++;
            }
        }

        if (count < waiterCount) {
            assembly {
                mstore(addresses, count)
                mstore(names, count)
                mstore(active, count)
                mstore(balances, count)
            }
        }

        return (addresses, names, active, balances);
    }

    function getTipsForWaiter(address waiterAddress) external view returns (TipRecord[] memory) {
        return waiterTips[waiterAddress];
    }

    function getAllTips() external view returns (TipRecord[] memory) {
        return allTips;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getOwner() external view returns (address) {
        return owner;
    }
}

const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-harhat-config")

const { verify } = require("../utils/verify")

const VRF_SUB_FUND_AMOUNT = hardhat.ethers.util.parseEther("2")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let vrfCoordinatorV2Address, subscriptionId

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.adress
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId

        // Fund the subscription
        // Usually, you'd need the link token on a real network

        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinator"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const enteranceFee = 10000000000 //networkConfig[chainId]["enteranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]

    const args = [
        vrfCoordinatorV2Address,
        enteranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAM_API_KEY) {
        log("Verifying...")
        await verify(raffle.address, args)
    }
    log("---------------------------------------")
}

module.exports.tags = ["all", "raffle"]

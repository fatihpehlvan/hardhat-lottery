const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains, networkConfig } = require("../../helper-harhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle", function () {
          let raffle, raffleEnteranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEnteranceFee = await raffle.getEnteranceFee()
          })
          describe("fulfillRandomWords", function () {
              it("works with live Chainlin Keepers and Chainlink VRF, we get a random winner", async function () {
                  // enter the raffle
                  const stratingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("winnerpicked event fired")
                          resolve()
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              const rafffleState = await raffle.getRaffleState()
                              const winnerEndingBalance = await accounts[0].getBalance()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()
                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(recentWinner.toString(), accounts[0].address)
                              assert.equal(rafffleState.toString(), "0")
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance.add(raffleEnteranceFee).toString()
                              )
                              assert(endingTimeStamp > stratingTimeStamp)
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      await raffle.enterRaffle({ value: raffleEnteranceFee })
                      const winnerStartingBalance = await accounts[0].getBalance()
                  })
              })
          })
      })
